
export interface Contact {
  id: string;
  name: string;
  email: string;
  businessPhone?: string;
  cellPhone?: string;
  homePhone?: string;
  faxNumber?: string;
  primaryPhoneType?: 'businessPhone' | 'cellPhone' | 'homePhone';
  folderId: string;
  notes?: string;
  userId: string;
}

export interface FolderData {
  id: string;
  name: string;
  userId: string;
}

// NOTE: Mock data below is for demonstration in other components
// and is NOT used by the main Contacts Manager view.
// A 'userId' of 'mock-user' is used as a placeholder.

export const mockFolders: Readonly<Omit<FolderData, 'userId'>[]> = [
  { id: '1', name: 'Personal' },
  { id: '2', name: 'Work' },
  { id: '3', name: 'Leads' },
];

export const mockContacts: Readonly<Omit<Contact, 'userId'>[]> = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice@example.com', cellPhone: '123-456-7890', primaryPhoneType: 'cellPhone', folderId: '1', notes: 'Met at the 2023 conference. Interested in our enterprise package.' },
  { id: 'c2', name: 'Bob Williams', email: 'bob@example.com', homePhone: '234-567-8901', primaryPhoneType: 'homePhone', folderId: '1', notes: 'Long-time personal friend.' },
  { id: 'c3', name: 'Charlie Brown', email: 'charlie@work.com', businessPhone: '345-678-9012', primaryPhoneType: 'businessPhone', folderId: '2', notes: 'Key contact for Project Phoenix.' },
  { id: 'c4', name: 'Diana Miller', email: 'diana@work.com', cellPhone: '456-789-0123', primaryPhoneType: 'cellPhone', folderId: '2', notes: '' },
  { id: 'c5', name: 'Eve Davis', email: 'eve@work.com', businessPhone: '567-890-1234', faxNumber: '567-890-9999', primaryPhoneType: 'businessPhone', folderId: '2', notes: 'Prefers communication via email.' },
  { id: 'c6', name: 'Frank White', email: 'frank.lead@example.com', cellPhone: '678-901-2345', primaryPhoneType: 'cellPhone', folderId: '3', notes: 'Follow up next week regarding the proposal.' },
];
