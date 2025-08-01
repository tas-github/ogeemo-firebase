'use server';

import { ai } from "@/ai/ai";
import { z } from "zod";
import { MessageData } from 'genkit';
import { googleAI } from "@genkit-ai/googleai";

const systemPrompt = `
You are Ogeemo, an AI assistant for the Ogeemo platform.
Your persona is helpful, knowledgeable, and slightly formal.
You must always respond in markdown format.
You have access to tools for interacting with the Ogeemo database.
When a user asks you to perform an action, you should use the available tools.
If you are not sure what to do, you can ask clarifying questions.
When a tool returns data, you should present it to the user in a clear and organized way.
If a tool returns an error, you should inform the user and ask for more information.
Do not make up information. If you do not know the answer, say so.
`;

// Define a more specific Zod schema for the history objects to match the client
const messageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({
    text: z.string(),
  })),
});

const ogeemoChatFlowInputSchema = z.object({
  message: z.string(),
  history: z.array(messageSchema).optional(),
});

export async function ogeemoChatFlow(input: z.infer<typeof ogeemoChatFlowInputSchema>): Promise<{ reply: string }> {
  const { message, history } = input;
  
  const conversationHistory: MessageData[] = history || [];

  // Combine the history and the new user message into a single array.
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: [{ text: message }] }
  ];
  
  const result = await ai.generate({
    model: googleAI.model('gemini-1.5-flash'),
    // Pass the entire conversation in the 'messages' property.
    messages: messages,
    config: {
      temperature: 0.7,
    },
    system: systemPrompt,
  });

  return {
    reply: result.text,
  };
}
