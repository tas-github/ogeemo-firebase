
'use server';
/**
 * @fileOverview A test chat flow for debugging.
 *
 * - askTestChat - A function that handles chat interactions with the test assistant.
 * - TestChatInput - The input type for the askTestChat function.
 * - TestChatOutput - The return type for the askTestChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TestChatInputSchema = z.object({
  message: z.string().describe('The user message to the test assistant.'),
});
export type TestChatInput = z.infer<typeof TestChatInputSchema>;

const TestChatOutputSchema = z.object({
  reply: z.string().describe('The reply from the test assistant.'),
});
export type TestChatOutput = z.infer<typeof TestChatOutputSchema>;


const testChatPrompt = ai.definePrompt({
    name: 'testChatPrompt',
    model: 'googleai/gemini-1.5-flash',
    input: { schema: TestChatInputSchema },
    output: { schema: TestChatOutputSchema },
    prompt: `You are a helpful test assistant. The user said: {{{message}}}. Respond to their message.`,
});

const testChatFlow = ai.defineFlow(
  {
    name: 'testChatFlow',
    inputSchema: TestChatInputSchema,
    outputSchema: TestChatOutputSchema,
  },
  async (input) => {
    const { output } = await testChatPrompt(input);
    return output!;
  }
);

export async function askTestChat(input: TestChatInput): Promise<TestChatOutput> {
  // Wrap the flow call in a try/catch to provide a graceful error response.
  try {
    return await testChatFlow(input);
  } catch (error) {
    console.error("Error in askTestChat:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    // Return a structured error response that matches the output schema.
    return {
      reply: `An error occurred: ${errorMessage}. Please check the server logs.`
    };
  }
}
