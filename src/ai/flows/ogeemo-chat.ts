'use server';
/**
 * @fileOverview The primary Ogeemo AI assistant agent.
 * This agent can answer questions about the Ogeemo application and use tools to perform actions.
 *
 * - ogeemoAgent - The main function that handles user requests.
 * - OgeemoAgentInput - The input type for the ogeemoAgent function.
 */
import { ai } from '@/ai/ai';
import { z } from 'zod';
import { MessageData } from 'genkit';
import { addContact } from '@/services/contact-service';
import fs from 'fs';
import path from 'path';

// Schemas

const messageContentSchema = z.object({
  text: z.string(),
  // Assuming content can only be text for now. Add other types if needed.
});

const clientMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.array(messageContentSchema),
});


const OgeemoAgentInputSchema = z.object({
  userId: z.string(),
  message: z.string(),
  history: z.array(clientMessageSchema).optional(),
});
export type OgeemoAgentInput = z.infer<typeof OgeemoAgentInputSchema>;

const ContactInputSchema = z.object({
  firstName: z.string().describe('The first name of the contact'),
  lastName: z.string().describe('The last name of the contact'),
  email: z.string().email().describe('The email address of the contact'),
  phone: z.string().optional().describe('The primary phone number for the contact. This will be stored as a cell phone.'),
  company: z.string().optional().describe('The company the contact works for'),
  notes: z.string().optional().describe('Any additional notes about the contact'),
});

const AddContactToolInputSchema = ContactInputSchema.extend({
    userId: z.string(),
});

// Tool Definition
const addContactTool = ai.defineTool(
  {
    name: 'addContact',
    description: 'Use this tool to add a new contact when the user explicitly asks to. It requires a first name, last name, and email. Phone number, company, and notes are optional.',
    inputSchema: AddContactToolInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      contactId: z.string().optional(),
      message: z.string(),
    }),
  },
  async (input) => {
    const { userId, ...contactDetails } = input;
    if (!userId) {
      return { success: false, message: "Error: User is not authenticated." };
    }
    try {
      const newContact = await addContact({
        name: `${contactDetails.firstName} ${contactDetails.lastName}`,
        email: contactDetails.email,
        businessName: contactDetails.company || '',
        cellPhone: contactDetails.phone || '',
        primaryPhoneType: 'cellPhone',
        notes: contactDetails.notes || '',
        userId: userId,
        folderId: '', // Defaulting to root
      });
      return {
        success: true,
        contactId: newContact.id,
        message: `Successfully added contact ${contactDetails.firstName} ${contactDetails.lastName}.`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `Failed to add contact: ${errorMessage}` };
    }
  }
);

// Helper to get Knowledge Base
function getKnowledgeBase(): string {
  try {
    const summaryPath = path.join(process.cwd(), 'OGEEMO_SUMMARY.md');
    const summaryContent = fs.readFileSync(summaryPath, 'utf-8');
    return `<knowledge_base><document name="OGEEMO_SUMMARY.md">${summaryContent}</document></knowledge_base>`;
  } catch (error) {
    console.error("Error reading knowledge base files:", error);
    return "<knowledge_base>Error: Could not load application documentation.</knowledge_base>";
  }
}

const systemPromptTemplate = `
You are Ogeemo, an AI assistant for the Ogeemo platform. Your primary role is to help users understand and use the Ogeemo application based on the provided knowledge base.
Your secondary role is to act as a general business assistant and perform actions on the user's behalf using the available tools.
Your persona is helpful, knowledgeable, and slightly formal.
You must always respond in markdown format.

You have been provided with a knowledge base containing specific documentation about the Ogeemo application.
You MUST prioritize the information in this knowledge base when answering questions about Ogeemo's features, purpose, or functionality.
If a user asks a question you cannot answer from the provided history or the knowledge base, state that you do not have that information and then add the following text on a new line: "The Ogeemo Assistant is still under development and will be gaining even more power as we continue to enhance the Ogeemo app.". Do not make up information.

When the user asks you to perform an action, like adding a contact, you must use the available tools.

Here is the knowledge base:
{{{knowledgeBase}}}
`;

// Exported wrapper function for the flow
export async function ogeemoAgent(input: OgeemoAgentInput): Promise<{ reply: string }> {
    return ogeemoAgentFlow(input);
}

// The Main Agent Flow
const ogeemoAgentFlow = ai.defineFlow(
  {
    name: 'ogeemoAgentFlow',
    inputSchema: OgeemoAgentInputSchema,
    outputSchema: z.object({ reply: z.string() }),
  },
  async (input) => {
    const { userId, message, history } = input;

    const conversationHistory: MessageData[] = (history as MessageData[]) || [];
    const messages: MessageData[] = [
      ...conversationHistory,
      { role: 'user', content: [{ text: message }] }
    ];

    const knowledgeBase = getKnowledgeBase();
    const finalSystemPrompt = systemPromptTemplate.replace('{{knowledgeBase}}', knowledgeBase);

    const result = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      messages: messages,
      tools: [addContactTool],
      toolConfig: {
        commonData: {
            userId,
        },
      },
      system: finalSystemPrompt,
      config: {
        temperature: 0.1,
      },
    });

    return {
      reply: result.text,
    };
  }
);
