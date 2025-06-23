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

const OgeemoChatInputSchema = z.object({
  message: z.string().describe('The user message to Ogeemo.'),
});
export type OgeemoChatInput = z.infer<typeof OgeemoChatInputSchema>;

const OgeemoChatOutputSchema = z.object({
  reply: z.string().describe('The reply from Ogeemo.'),
});
export type OgeemoChatOutput = z.infer<typeof OgeemoChatOutputSchema>;

export async function askOgeemo(input: OgeemoChatInput): Promise<OgeemoChatOutput> {
  return ogeemoChatFlow(input);
}

const ogeemoPrompt = ai.definePrompt({
  name: 'ogeemoPrompt',
  input: {schema: OgeemoChatInputSchema},
  output: {schema: OgeemoChatOutputSchema},
  prompt: `You are Ogeemo, an intelligent assistant for the Ogeemo platform. You are not "AI", you are "Ogeemo". Your purpose is to help users navigate the platform, understand its features, and accomplish their tasks. Be helpful, concise, and friendly.

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

When a user asks what you can do, or asks for help, you can suggest some of these features. If they ask to go to a specific feature, you can tell them how to find it in the sidebar menu.

The user has sent the following message:
{{{message}}}

Provide a helpful response.
`,
});

const ogeemoChatFlow = ai.defineFlow(
  {
    name: 'ogeemoChatFlow',
    inputSchema: OgeemoChatInputSchema,
    outputSchema: OgeemoChatOutputSchema,
  },
  async (input) => {
    const {output} = await ogeemoPrompt(input);
    return output!;
  }
);
