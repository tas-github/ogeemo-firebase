'use server';

import { ai } from "@/ai/ai";
import { z } from "zod";
import { MessageData } from 'genkit';
import { googleAI } from "@genkit-ai/googleai";
// Import the schema, the tool, and the handler function
import { contactInputSchema, addContactTool, addContactFlow } from "@/ai/tools/contact-tools"; 

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
    tools: [addContactTool],
    config: {
        temperature: 0.7,
    },
    system: systemPrompt,
  });

  if (result.toolRequests.length > 0) {
    const toolRequestPart = result.toolRequests[0];
    const toolRequest = toolRequestPart.toolRequest; 

    if (toolRequest) {
      console.log(`AI wants to call tool: ${toolRequest.name} with input:`, toolRequest.input);
      
      if (toolRequest.name === 'addContact') {
        // Use the Zod schema to safely parse the 'unknown' input
        const validationResult = contactInputSchema.safeParse(toolRequest.input);

        if (!validationResult.success) {
          return { reply: "I'm sorry, the information you provided was not in the correct format. Please provide the contact's details again." };
        }

        const toolResult = await addContactFlow(validationResult.data);
        
        // Use 'as any' to bypass the faulty IDE error.
        const finalResult = await ai.generate({
            model: googleAI.model('gemini-1.5-flash'),
            messages: [
                ...messages,
                result.message,
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
        } as any);

        return { reply: finalResult.text };
      }
    }
    return { reply: "I'm sorry, I can't perform that specific action right now." };
  }

  return {
    reply: result.text,
  };
}
