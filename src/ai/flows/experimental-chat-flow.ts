'use server';

import { ai } from "@/ai/ai";
import { z } from "zod";
import { MessageData } from 'genkit';
import { googleAI } from "@genkit-ai/googleai";
import { addContactTool } from "@/ai/tools/contact-tools"; // Import the tool directly

const systemPrompt = `
You are an experimental AI assistant in a sandbox environment.
Your persona is helpful and proactive.
You must always respond in markdown format.
You have access to tools. When a user asks to perform an action, you must use the available tools.
If you need more information to use a tool, you must ask the user for it.
When a tool returns data, you should present it to the user in a clear and organized way.
If a tool returns an error, you should inform the user and ask for more information.
Do not make up information.
`;

// A simplified schema for data coming from the client.
const clientMessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.array(z.any()),
});

const experimentalChatFlowInputSchema = z.object({
  message: z.string(),
  history: z.array(clientMessageSchema).optional(),
});

export async function experimentalChatFlow(input: z.infer<typeof experimentalChatFlowInputSchema>): Promise<{ reply: string }> {
  const { message, history } = input;
  
  const conversationHistory: MessageData[] = (history as MessageData[]) || [];

  const messages: MessageData[] = [
    ...conversationHistory,
    { role: 'user', content: [{ text: message }] }
  ];
  
  const result = await ai.generate({
    model: googleAI.model('gemini-1.5-flash'),
    messages: messages,
    tools: [addContactTool], // Pass the tool in the 'tools' array
    config: {
        temperature: 0.7,
    },
    system: systemPrompt,
  });

  // Check if the AI wants to call a tool.
  if (result.toolRequests.length > 0) {
    const toolRequest = result.toolRequests[0];
    console.log(`AI wants to call tool: ${toolRequest.name} with input:`, toolRequest.input);
    
    if (toolRequest.name === 'addContact') {
      const toolResult = await addContactTool.fn(toolRequest.input);
      
      // Send the tool's result back to the AI for a final, conversational response.
      const finalResult = await ai.generate({
          model: googleAI.model('gemini-1.5-flash'),
          messages: [
              ...messages,
              result.message, // The AI's message that contained the tool request
              { 
                role: 'tool', 
                content: [{ 
                  toolResponse: { 
                    name: 'addContact', 
                    result: toolResult 
                  } 
                }] 
              }
          ],
          tools: [addContactTool],
      });

      return { reply: finalResult.text };
    }
  }

  // If no tool was called, return the direct text response.
  return {
    reply: result.text,
  };
}
