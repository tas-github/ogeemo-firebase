
'use server';
/**
 * @fileOverview A test chat flow for debugging.
 *
 * - askTestChat - A function that handles chat interactions with the test assistant.
 * - TestChatInput - The input type for the askTestChat function.
 * - TestChatOutput - The return type for the askTestChat function.
 */

import {ai, aiFeaturesEnabled} from '@/ai/genkit';
import {z} from 'genkit';

const TestChatInputSchema = z.object({
  message: z.string().describe('The user message to the test assistant.'),
});
export type TestChatInput = z.infer<typeof TestChatInputSchema>;

const TestChatOutputSchema = z.object({
  reply: z.string().describe('The reply from the test assistant.'),
});
export type TestChatOutput = z.infer<typeof TestChatOutputSchema>;

export async function askTestChat(input: TestChatInput): Promise<TestChatOutput> {
  if (!aiFeaturesEnabled) {
    return {
      reply: "Test Chat AI features are currently disabled. Please make sure the GOOGLE_API_KEY environment variable is configured correctly."
    };
  }
  return testChatFlow(input);
}

const testPrompt = ai.definePrompt({
  name: 'testPrompt',
  input: {schema: TestChatInputSchema},
  output: {schema: TestChatOutputSchema},
  prompt: `You are a simple test assistant. Your only purpose is to confirm you are working.

The user has sent the following message:
{{{message}}}

Reply with a confirmation that you received the message.
`,
});

const testChatFlow = ai.defineFlow(
  {
    name: 'testChatFlow',
    inputSchema: TestChatInputSchema,
    outputSchema: TestChatOutputSchema,
  },
  async (input) => {
    const {output} = await testPrompt(input);
    return output!;
  }
);
