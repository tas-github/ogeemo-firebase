
import "./genkit";
import { onFlow } from "genkit";
import { z } from "zod";
import { geminiPro as gemini10pro } from "@genkit-ai/googleai";

export const generateFormFlow = onFlow(
  {
    name: "generateFormFlow",
    inputSchema: z.object({
      topic: z.string(),
    }),
    outputSchema: z.any(),
  },
  async ({ topic }) => {
    const llm = gemini10pro;
    const result = await llm.generate({
      prompt: `
        You are a form generator.
        Based on the user's topic, generate a JSON object representing a form.
        The JSON object should have two properties: "name" (a string for the form's title) and "fields" (an array of objects).
        Each field object should have "name", "label", "type" (e.g., "text", "textarea", "select"), and optionally "options" (an array of strings for select fields).
        The user's topic is: "${topic}"
      `,
      config: {
        temperature: 0.5,
      },
    });
    return JSON.parse(result.text());
  }
);
