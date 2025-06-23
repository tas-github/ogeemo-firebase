'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing a Firebase database's contents and statistics.
 *
 * - summarizeDatabase - A function that generates a summary of the database.
 * - SummarizeDatabaseInput - The input type for the summarizeDatabase function.
 * - SummarizeDatabaseOutput - The return type for the summarizeDatabase function.
 */

import {ai, aiFeaturesEnabled} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDatabaseInputSchema = z.object({
  databaseDescription: z
    .string()
    .describe('A description of the Firebase database schema.'),
  collectionsDescription: z
    .string()
    .describe('A description of all collections in the database.'),
});
export type SummarizeDatabaseInput = z.infer<typeof SummarizeDatabaseInputSchema>;

const SummarizeDatabaseOutputSchema = z.object({
  summary: z
    .string()
    .describe('A summary of the Firebase database contents and statistics.'),
});
export type SummarizeDatabaseOutput = z.infer<typeof SummarizeDatabaseOutputSchema>;

export async function summarizeDatabase(input: SummarizeDatabaseInput): Promise<SummarizeDatabaseOutput> {
  if (!aiFeaturesEnabled) {
    return {
      summary: "Database summarization is currently disabled. Please make sure the GOOGLE_API_KEY environment variable is configured correctly. This feature requires a valid GOOGLE_API_KEY to be set in the environment variables."
    };
  }
  return summarizeDatabaseFlow(input);
}

const summarizeDatabasePrompt = ai.definePrompt({
  name: 'summarizeDatabasePrompt',
  input: {schema: SummarizeDatabaseInputSchema},
  output: {schema: SummarizeDatabaseOutputSchema},
  prompt: `You are an expert database analyst tasked with summarizing the contents and statistics of a Firebase database.

  Your goal is to provide a concise and informative overview of the database's structure, data distribution, and key insights.

  Here's a description of the database schema:
  {{{databaseDescription}}}

  Here's a description of the collections in the database:
  {{{collectionsDescription}}}

  Based on this information, generate a summary of the database. The summary should be no more than 200 words.
  Include the number of documents in each collection.
  The summary should highlight any interesting patterns or anomalies in the data.
  The summary should be written in a clear and concise style that is easy to understand.
  `,
});

const summarizeDatabaseFlow = ai.defineFlow(
  {
    name: 'summarizeDatabaseFlow',
    inputSchema: SummarizeDatabaseInputSchema,
    outputSchema: SummarizeDatabaseOutputSchema,
  },
  async input => {
    const {output} = await summarizeDatabasePrompt(input);
    return output!;
  }
);
