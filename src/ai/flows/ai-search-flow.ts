
'use server';

import { ai } from "@/ai/ai";
import { z } from "zod";

const aiSearchFlowInputSchema = z.object({
  query: z.string(),
  dataSources: z.array(z.string()),
});

export const aiSearchFlow = ai.defineFlow(
  {
    name: "aiSearchFlow",
    inputSchema: aiSearchFlowInputSchema,
    outputSchema: z.any(),
  },
  async ({ query, dataSources }) => {
    const { output } = await ai.generate({
      prompt: `
        You are a search query generator.
        Based on the user's query, generate a set of conditions and a logic operator (AND/OR) to search a database.
        The available data sources are: ${dataSources.join(", ")}.
        The user's query is: "${query}"
        Respond with a JSON object with two properties: "conditions" (an array of objects with "field", "operator", and "value" properties) and "logic" ("AND" or "OR").
      `,
      config: {
        temperature: 0.3,
      },
      output: {
        format: 'json',
      },
    });
    return output!;
  }
);
