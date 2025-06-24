
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

export async function askTestChat(input: TestChatInput): Promise<TestChatOutput> {
  try {
    const { text } = await ai.generate({
      prompt: `You are a simple test assistant. Your only purpose is to confirm you are working.

        The user has sent the following message:
        ${input.message}

        Reply with a confirmation that you received the message.`,
    });

    return {
      reply: text || "The AI returned an empty response. This might be due to a content filter.",
    };
  } catch (error) {
    console.error("Error in askTestChat:", error);
    return {
      reply: "An error occurred while communicating with the AI. Please check the server logs for more details.",
    };
  }
}
