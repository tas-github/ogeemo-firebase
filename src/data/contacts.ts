
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  folderId: string;
}

export interface FolderData {
  id: string;
  name: string;
}

export let mockFolders: FolderData[] = [
  { id: '1', name: 'Personal' },
  { id: '2', name: 'Work' },
  { id: '3', name: 'Leads' },
];

export let mockContacts: Contact[] = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', folderId: '1' },
  { id: 'c2', name: 'Bob Williams', email: 'bob@example.com', phone: '234-567-8901', folderId: '1' },
  { id: 'c3', name: 'Charlie Brown', email: 'charlie@work.com', phone: '345-678-9012', folderId: '2' },
  { id: 'c4', name: 'Diana Miller', email: 'diana@work.com', phone: '456-789-0123', folderId: '2' },
  { id: 'c5', name: 'Eve Davis', email: 'eve@work.com', phone: '567-890-1234', folderId: '2' },
  { id: 'c6', name: 'Frank White', email: 'frank.lead@example.com', phone: '678-901-2345', folderId: '3' },
];
