import { defineTool } from '@genkit-ai/ai';
import { z } from 'zod';
import { addContact } from '@/services/contact-service';
import { getCurrentUser } from '@/lib/firebase'; // We'll need a way to get the current user

export const addContactTool = defineTool(
  {
    name: 'addContact',
    description: 'Use this tool to add a new contact to the database. Collect the first name, last name, and email address. Other fields are optional.',
    inputSchema: z.object({
      firstName: z.string().describe('The first name of the contact'),
      lastName: z.string().describe('The last name of the contact'),
      email: z.string().email().describe('The email address of the contact'),
      phone: z.string().optional().describe('The phone number of the contact'),
      company: z.string().optional().describe('The company the contact works for'),
      notes: z.string().optional().describe('Any additional notes about the contact'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      contactId: z.string().optional(),
      message: z.string(),
    }),
  },
  async (input) => {
    // Note: Genkit flows run on the server. We need a server-side way to identify the user.
    // We will need to implement or use an existing server-side session management utility.
    // For now, let's assume a placeholder function `getUserIdOnServer()` exists.
    const userId = "placeholder-user-id"; // TODO: Replace with actual server-side user auth

    if (!userId) {
      return {
        success: false,
        message: "Error: User could not be authenticated on the server.",
      };
    }

    try {
      const newContact = await addContact({
        name: `${input.firstName} ${input.lastName}`,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || '',
        company: input.company || '',
        notes: input.notes || '',
        userId: userId,
        folderId: null, // Defaulting to no folder for now
        createdAt: new Date(),
        updatedAt: new Date(),
        isClient: false,
      });

      return {
        success: true,
        contactId: newContact.id,
        message: `Successfully added contact ${input.firstName} ${input.lastName}.`,
      };
    } catch (error) {
      console.error("Error in addContactTool:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        success: false,
        message: `Failed to add contact. Error: ${errorMessage}`,
      };
    }
  }
);
