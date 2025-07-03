
'use server';
/**
 * @fileOverview A flow for generating images from a text prompt.
 *
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt }) => {
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_ONLY_HIGH',
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_ONLY_HIGH',
            },
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_ONLY_HIGH',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_ONLY_HIGH',
            },
        ],
      },
    });

    const imageUrl = response.media?.url;

    if (!imageUrl) {
        const finishReason = response.candidates[0]?.finishReason;
        const finishMessage = response.candidates[0]?.finishMessage;
        let errorMessage = 'Image generation failed for an unknown reason.';

        if (finishReason === 'SAFETY') {
            errorMessage = `Image generation was blocked for safety reasons. Please try a different prompt. Details: ${finishMessage || 'No details provided.'}`;
        } else if (finishReason === 'REFUSED') {
            errorMessage = 'The model refused to generate an image for this prompt. Please try rephrasing it.';
        } else {
            errorMessage = `Image generation failed. The model may have refused to generate the image. Reason: ${finishReason || 'Unknown'}. ${finishMessage || ''}`;
        }
        
        console.error("Image generation failed:", errorMessage, response);
        throw new Error(errorMessage);
    }

    return { imageUrl };
  }
);
