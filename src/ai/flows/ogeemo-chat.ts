'use server';
/**
 * @fileOverview A chat flow for interacting with Ogeemo.
 *
 * - askOgeemo - A function that handles chat interactions with the Ogeemo assistant.
 * - OgeemoChatInput - The input type for the askOgeemo function.
 * - OgeemoChatOutput - The return type for the askOgeemo function.
 */

import {ai, aiFeaturesEnabled} from '@/ai/genkit';
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
  if (!aiFeaturesEnabled) {
    throw new Error("Ogeemo AI features are currently disabled. Please make sure the GOOGLE_API_KEY environment variable is configured correctly.");
  }
  return ogeemoChatFlow(input);
}

const ogeemoPrompt = ai.definePrompt({
  name: 'ogeemoPrompt',
  input: {schema: OgeemoChatInputSchema},
  output: {schema: OgeemoChatOutputSchema},
  prompt: `You are Ogeemo, an intelligent assistant for the Ogeemo platform. You are not "AI", you are "Ogeemo". Your purpose is to help users navigate the platform, understand its features, and accomplish their tasks. Be helpful, concise, and friendly.

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
