
import "./genkit";
import { onFlow } from "genkit";
import { z } from "zod";
import { geminiPro as gemini10pro } from "@genkit-ai/googleai";

export const aiSearchFlow = onFlow(
  {
    name: "aiSearchFlow",
    inputSchema: z.object({
      query: z.string(),
      dataSources: z.array(z.string()),
    }),
    outputSchema: z.any(),
  },
  async ({ query, dataSources }) => {
    const llm = gemini10pro;
    const result = await llm.generate({
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
    });
    return JSON.parse(result.text());
  }
);
