
'use server';
/**
 * @fileOverview A chat flow for interacting with Ogeemo.
 *
 * - askOgeemo - A function that handles chat interactions with the Ogeemo assistant.
 * - OgeemoChatInput - The input type for the askOgeemo function.
 * - OgeemoChatOutput - The return type for the askOgeemo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getFolders, addFolder, addContact } from '@/services/contact-service';

const OgeemoChatInputSchema = z.object({
  message: z.string().describe('The user message to Ogeemo.'),
  userId: z.string().describe('The ID of the user making the request.'),
});
export type OgeemoChatInput = z.infer<typeof OgeemoChatInputSchema>;

const OgeemoChatOutputSchema = z.object({
  reply: z.string().describe('The reply from Ogeemo.'),
});
export type OgeemoChatOutput = z.infer<typeof OgeemoChatOutputSchema>;

async function findOrCreateDefaultFolder(userId: string): Promise<string> {
    const folders = await getFolders(userId);
    const defaultFolderName = "From Ogeemo Assistant";
    let folder = folders.find(f => f.name === defaultFolderName && !f.parentId);
    
    if (!folder) {
        folder = await addFolder({ name: defaultFolderName, userId, parentId: null });
    }
    return folder.id;
}

const createContactTool = ai.defineTool(
    {
        name: 'createContact',
        description: "Creates a new contact. Use this when a user asks to add, create, or save a new contact. You must have the contact's name, email address, and the user's ID.",
        inputSchema: z.object({
            name: z.string().describe("The full name of the contact."),
            email: z.string().email().describe("The email address for the contact."),
            userId: z.string().describe("The ID of the user for whom to create the contact.")
        }),
        outputSchema: z.string(),
    },
    async ({ name, email, userId }) => {
        try {
            const folderId = await findOrCreateDefaultFolder(userId);
            await addContact({
                name,
                email,
                folderId,
                userId,
            });
            return `I have successfully created a new contact for ${name} with the email ${email}.`;
        } catch (error: any) {
            console.error("Critical Error in createContactTool:", error);
            return `I encountered a problem while trying to create the contact. The system reported: ${error.message}`;
        }
    }
);

const ogeemoChatFlow = ai.defineFlow(
  {
    name: 'ogeemoChatFlow',
    inputSchema: OgeemoChatInputSchema,
    outputSchema: OgeemoChatOutputSchema,
  },
  async ({ message, userId }) => {
    const systemPrompt = `You are Ogeemo, an intelligent assistant for the Ogeemo platform. You are not "AI", you are "Ogeemo". Your purpose is to help users navigate the platform, understand its features, and accomplish their tasks. Be helpful, concise, and friendly.

You have access to a set of tools to perform actions on the user's behalf. The current user's ID is: ${userId}.

The Ogeemo platform has the following features (Managers):
- Dashboard: Overview of key metrics.
- Action Manager: Chat with Ogeemo to navigate and perform actions.
- OgeeMail: An intelligent email client.
- Contacts: Manage your contacts and client relationships.
- Projects: A task manager where projects are collections of tasks.
- Calendar: Manage your schedule, events, and appointments.
- Files: Store, organize, and share documents.
- Ideas: An idea board to capture and develop creative thoughts.
- Research: A hub to gather and analyze information.
- Accounting: Manage finances, invoices, and expenses.
- Google: Integration with Google services.
- Time: A time tracker.
- Backup: Secure and restore your application data.
- Reports: Generate and view detailed reports.
- Alerts: Configure and view system alerts.
- Data: Manage raw data in your collections.
- Forms: Generate forms for data entry.
- Settings: Configure your profile and application settings.

TOOL INSTRUCTIONS:
- If a user asks you to create a contact, use the \`createContact\` tool.
- You must get the contact's full name and their email address before using the tool.
- When you call the \`createContact\` tool, you MUST pass the user's ID, which is ${userId}, to the tool's \`userId\` parameter.
`;

    const { text } = await ai.generate({
        model: 'googleai/gemini-1.5-pro-latest',
        prompt: message,
        system: systemPrompt,
        tools: [createContactTool],
    });

    return { reply: text || "I'm not sure how to respond to that. Could you please rephrase?" };
  }
);


export async function askOgeemo(input: OgeemoChatInput): Promise<OgeemoChatOutput> {
  try {
    return await ogeemoChatFlow(input);
  } catch (error) {
    console.error("Error in askOgeemo:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      reply: `An error occurred: ${errorMessage}. Please check the server logs.`
    };
  }
}
