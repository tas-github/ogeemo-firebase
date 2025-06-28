'use server';

import { z } from 'zod';

// Schema for the parts of a Google Contact we care about
export const GoogleContactSchema = z.object({
  resourceName: z.string(),
  names: z.array(z.object({
    displayName: z.string().optional(),
  })).optional(),
  emailAddresses: z.array(z.object({
    value: z.string().optional(),
  })).optional(),
  phoneNumbers: z.array(z.object({
    value: z.string().optional(),
    type: z.string().optional(),
  })).optional(),
});
export type GoogleContact = z.infer<typeof GoogleContactSchema>;

export const GetGoogleContactsOutputSchema = z.object({
  contacts: z.array(GoogleContactSchema),
});
export type GetGoogleContactsOutput = z.infer<typeof GetGoogleContactsOutputSchema>;

export async function getGoogleContacts(accessToken: string): Promise<GetGoogleContactsOutput> {
  if (!accessToken) {
    throw new Error('Google access token is required.');
  }

  const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store', // Ensure fresh data is fetched every time
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google People API Error:', errorData);
    throw new Error(`Failed to fetch Google Contacts: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  const connections = data.connections || [];
  
  // Parse and filter contacts to ensure they have at least a name and email.
  const validatedContacts = connections
    .map((conn: any) => GoogleContactSchema.safeParse(conn))
    .filter((result: { success: any; }) => result.success)
    .map((result: { data: any; }) => result.data)
    .filter((contact: GoogleContact) => 
        contact.names?.[0]?.displayName && contact.emailAddresses?.[0]?.value
    );

  return { contacts: validatedContacts };
}
