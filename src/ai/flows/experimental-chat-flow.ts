'use server';

import { ai } from "@/ai/ai";
import { z } from "zod";
import { MessageData } from 'genkit';
import { googleAI } from "@genkit-ai/googleai";
import { addContactTool } from "@/ai/tools/contact-tools"; // Import the new tool
import { run } from "node:test";
import { Runnable } from "node:stream";

const systemPrompt = `
You are an experimental AI assistant in a sandbox environment.
Your persona is helpful and proactive.
You must always respond in markdown format.
You have access to tools. When a user asks to perform an action, you should use the available tools.
If you need more information to use a tool, you must ask the user for it.
When a tool returns data, you should present it to the user in a clear and organized way.
If a tool returns an error, you should inform the user and ask for more information.
Do not make up information.
`;

// Define a schema that can handle the full range of message parts, including tool requests/responses
const messageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.array(z.object({
    text: z.string().optional(),
    toolRequest: z.any().optional(),
    toolResponse: z.any().optional(),
  })),
});


const experimentalChatFlowInputSchema = z.object({
  message: z.string(),
  history: z.array(messageSchema).optional(),
});


export async function experimentalChatFlow(input: z.infer<typeof experimentalChatFlowInputSchema>): Promise<{ reply: string }> {
  const { message, history } = input;
  
  const conversationHistory: MessageData[] = history || [];

  const messages: MessageData[] = [
    ...conversationHistory,
    { role: 'user', content: [{ text: message }] }
  ];
  
  const result = await ai.run({
    // @ts-ignore
    prompt: messages,
    tools: [addContactTool],
    model: googleAI.model('gemini-1.5-flash'),
    config: {
        temperature: 0.7,
    },
    system: systemPrompt,
  });


  return {
    reply: result.text(),
  };
}
