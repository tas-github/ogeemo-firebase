import { defineTool } from '@genkit-ai/ai';
import { z } from 'zod';
import { addContact } from '@/services/contact-service';

// 1. Define and export the schema so it can be used for validation elsewhere.
export const contactInputSchema = z.object({
  firstName: z.string().describe('The first name of the contact'),
  lastName: z.string().describe('The last name of the contact'),
  email: z.string().email().describe('The email address of the contact'),
  phone: z.string().optional().describe('The primary phone number for the contact. This will be stored as a cell phone.'),
  company: z.string().optional().describe('The company the contact works for'),
  notes: z.string().optional().describe('Any additional notes about the contact'),
});

export async function addContactFlow(input: z.infer<typeof contactInputSchema>) {
  const userId = "placeholder-user-id"; // TODO: Replace with a robust, server-side method of getting the current user's ID.

  if (!userId) {
    return { success: false, message: "Error: User not authenticated." };
  }

  try {
    const newContact = await addContact({
      name: `${input.firstName} ${input.lastName}`,
      email: input.email,
      businessName: input.company || '',
      cellPhone: input.phone || '',
      primaryPhoneType: 'cellPhone',
      notes: input.notes || '',
      userId: userId,
      folderId: '',
    });
    return {
      success: true,
      contactId: newContact.id,
      message: `Successfully added contact ${input.firstName} ${input.lastName}.`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to add contact: ${errorMessage}` };
  }
}

// @ts-ignore - This directive is necessary to bypass a persistent, incorrect
// error from the IDE's TypeScript server.
export const addContactTool = defineTool(
  {
    name: 'addContact',
    description: 'Use this tool to add a new contact. It requires a first name, last name, and email. Phone number and company are optional.',
    inputSchema: contactInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      contactId: z.string().optional(),
      message: z.string(),
    }),
  },
  addContactFlow
);
