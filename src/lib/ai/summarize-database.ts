
import "./genkit";
import { onFlow } from "genkit";
import { z } from "zod";
import { geminiPro as gemini10pro } from "@genkit-ai/googleai";

export const summarizeDatabase = onFlow(
  {
    name: "summarizeDatabase",
    inputSchema: z.object({
        databaseDescription: z.string(),
        collectionsDescription: z.string(),
    }),
    outputSchema: z.object({
      summary: z.string(),
    }),
  },
  async ({ databaseDescription, collectionsDescription }) => {
    const llm = gemini10pro;
    const result = await llm.generate({
      prompt: `
        You are a database analyst.
        Based on the following descriptions, generate a high-level executive summary of the database.
        Database Description: ${databaseDescription}
        Collections Description: ${collectionsDescription}
      `,
      config: {
        temperature: 0.5,
      },
    });
    return {
      summary: result.text(),
    };
  }
);
