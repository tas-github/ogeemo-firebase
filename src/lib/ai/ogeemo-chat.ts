
import "./genkit";
import { onFlow } from "genkit";
import { z } from "zod";
import { geminiPro as gemini10pro } from "@genkit-ai/googleai";

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

export const ogeemoChat = onFlow(
  {
    name: "ogeemoChat",
    inputSchema: z.object({
      message: z.string(),
      history: z.array(z.any()).optional(),
    }),
    outputSchema: z.object({
      reply: z.string(),
    }),
  },
  async ({ message, history }) => {
    const llm = gemini10pro;
    const augmentedHistory = history || [];
    const result = await llm.generate({
      prompt: message,
      history: augmentedHistory,
      config: {
        temperature: 0.7,
      },
      system: systemPrompt,
    });
    return {
      reply: result.text(),
    };
  }
);
