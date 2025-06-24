'use server';
/**
 * @fileOverview A very simple chat flow for debugging.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SimpleChatInputSchema = z.object({
  message: z.string(),
});
export type SimpleChatInput = z.infer<typeof SimpleChatInputSchema>;

export const SimpleChatOutputSchema = z.object({
  reply: z.string(),
});
export type SimpleChatOutput = z.infer<typeof SimpleChatOutputSchema>;


export async function askSimpleChat(input: SimpleChatInput): Promise<SimpleChatOutput> {
  console.log("askSimpleChat invoked with:", input.message);
  try {
    const { text } = await ai.generate({
      prompt: `This is a test. The user said: "${input.message}". Respond with: "Message received."`,
    });

    console.log("AI response received:", text);

    return {
      reply: text || "AI returned an empty response.",
    };
  } catch (error) {
    console.error("Critical Error in askSimpleChat:", error);
    return {
      reply: "An error occurred in the AI flow. Please check the server logs for details.",
    };
  }
}
