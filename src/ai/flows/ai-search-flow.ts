'use server';
/**
 * @fileOverview An AI flow to convert natural language queries into structured search conditions.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSearchInputSchema = z.object({
  query: z.string().describe('The natural language search query from the user.'),
  dataSources: z.array(z.string()).describe('The data sources to search within. Example: ["contacts", "emails"]'),
});
export type AiSearchInput = z.infer<typeof AiSearchInputSchema>;

const ConditionSchema = z.object({
  field: z.string().describe("The field to search in. Must be one of the available fields for the specified data sources."),
  operator: z.enum(['contains', 'is', 'is_not', 'starts_with', 'ends_with']).describe("The operator to use for the comparison."),
  value: z.string().describe("The value to search for."),
});

const AiSearchOutputSchema = z.object({
  conditions: z.array(ConditionSchema).describe('The structured search conditions generated from the query.'),
  logic: z.enum(['AND', 'OR']).describe('The logic to apply between conditions. Defaults to AND.'),
});
export type AiSearchOutput = z.infer<typeof AiSearchOutputSchema>;

export async function generateSearchQuery(input: AiSearchInput): Promise<AiSearchOutput> {
  return aiSearchFlow(input);
}

const aiSearchFlow = ai.defineFlow(
  {
    name: 'aiSearchFlow',
    inputSchema: AiSearchInputSchema,
    outputSchema: AiSearchOutputSchema,
  },
  async ({ query, dataSources }) => {
    
    const prompt = `
You are an expert search query builder. Your task is to convert a user's natural language query into a structured JSON format with search conditions.

The user has selected the following data sources to search: ${dataSources.join(', ')}.

Here are the available fields for each data source. You MUST only use these fields for the given data source.
- contacts: name, email, notes
- projects: name, description
- tasks: title, description, status (possible values for status are 'todo', 'inProgress', 'done')
- files: name, type
- emails: from, subject, text

Based on the user's query, create an array of conditions. For each condition, provide a 'field', an 'operator', and a 'value'.
- Use the 'contains' operator for general text searches.
- Use 'is' for specific, exact matches (like a status or an email address).
- When a user mentions a time-frame (e.g., "this week", "last month"), do not attempt to generate a date-based condition. Instead, search for the literal text in the relevant fields.
- Also determine if the conditions should be combined with 'AND' (all must match) or 'OR' (any can match). Default to 'AND' unless the user implies 'or' (e.g., "find emails from john OR jane").

The user's query is: "${query}"
`;

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: prompt,
      output: { schema: AiSearchOutputSchema },
      config: {
        temperature: 0.1,
      },
    });

    if (!output) {
      throw new Error("The AI failed to generate a valid search query structure.");
    }
    
    return output;
  }
);
