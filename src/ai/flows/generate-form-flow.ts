'use server';
/**
 * @fileOverview An AI flow to generate a JSON form schema from a natural language description.
 *
 * - generateForm - A function that handles the form generation process.
 * - GenerateFormInput - The input type for the generateForm function.
 * - GenerateFormOutput - The return type for the generateForm function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateFormInputSchema = z.object({
  description: z.string().describe('A natural language description of the form to be created.'),
});
export type GenerateFormInput = z.infer<typeof GenerateFormInputSchema>;

const FormFieldSchema = z.object({
    name: z.string().describe("A machine-readable name for the field (e.g., 'firstName', 'bug_priority'). Use camelCase."),
    label: z.string().describe("A human-readable label for the field (e.g., 'First Name', 'Bug Priority')."),
    type: z.enum(['text', 'textarea', 'select', 'email', 'tel', 'number', 'date']).describe("The type of input field to render."),
    options: z.array(z.string()).optional().describe("An array of string options, only used if the type is 'select'.")
});

export const GenerateFormOutputSchema = z.object({
    name: z.string().describe("A suitable name for the form itself (e.g., 'Bug Report', 'Customer Feedback')."),
    fields: z.array(FormFieldSchema).describe("An array of field objects that define the form structure."),
});
export type GenerateFormOutput = z.infer<typeof GenerateFormOutputSchema>;


const generateFormPrompt = ai.definePrompt({
    name: 'generateFormPrompt',
    model: 'googleai/gemini-2.5-pro',
    input: { schema: GenerateFormInputSchema },
    output: { schema: GenerateFormOutputSchema },
    prompt: `You are a form schema generator. Based on the user's description, create a JSON object representing a form.

    - The 'name' should be a concise, human-readable title for the form.
    - Each field in the 'fields' array must have a 'name' (camelCase), a 'label' (Title Case), and a 'type'.
    - Supported field types are: 'text', 'textarea', 'select', 'email', 'tel', 'number', 'date'.
    - If you infer that a field should have a set of choices (e.g., priority levels, status types), use the 'select' type and provide an array of strings in the 'options' property.
    - Be intelligent about inferring field types. If the user mentions "phone", use 'tel'. If they mention "notes" or "details", use 'textarea'.

    User's form description: {{{description}}}
  `,
});


const generateFormFlow = ai.defineFlow(
  {
    name: 'generateFormFlow',
    inputSchema: GenerateFormInputSchema,
    outputSchema: GenerateFormOutputSchema,
  },
  async (input) => {
    const { output } = await generateFormPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a valid form schema.");
    }
    return output;
  }
);


export async function generateForm(input: GenerateFormInput): Promise<GenerateFormOutput> {
  return generateFormFlow(input);
}
