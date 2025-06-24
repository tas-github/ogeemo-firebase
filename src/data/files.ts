
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number; // in bytes
  modifiedAt: Date;
  folderId: string;
}

export interface FolderItem {
  id: string;
  name: string;
}

export const mockFolders: FolderItem[] = [
  { id: 'folder-1', name: 'Project Documents' },
  { id: 'folder-2', name: 'Invoices' },
  { id: 'folder-3', name: 'Marketing Assets' },
  { id: 'folder-4', name: 'Legal' },
];

export const mockFiles: FileItem[] = [
  {
    id: 'file-1',
    name: 'Website_Redesign_Brief.pdf',
    type: 'application/pdf',
    size: 1204857,
    modifiedAt: new Date('2024-07-20T10:00:00Z'),
    folderId: 'folder-1',
  },
  {
    id: 'file-2',
    name: 'Q2_Marketing_Plan.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 34567,
    modifiedAt: new Date('2024-07-21T14:30:00Z'),
    folderId: 'folder-1',
  },
  {
    id: 'file-3',
    name: 'Invoice_INV-2024-001.pdf',
    type: 'application/pdf',
    size: 78234,
    modifiedAt: new Date('2024-07-22T09:00:00Z'),
    folderId: 'folder-2',
  },
  {
    id: 'file-4',
    name: 'Invoice_INV-2024-002.pdf',
    type: 'application/pdf',
    size: 81234,
    modifiedAt: new Date('2024-07-25T11:00:00Z'),
    folderId: 'folder-2',
  },
  {
    id: 'file-5',
    name: 'logo_final.png',
    type: 'image/png',
    size: 56345,
    modifiedAt: new Date('2024-07-19T18:00:00Z'),
    folderId: 'folder-3',
  },
  {
    id: 'file-6',
    name: 'social_media_banner.jpg',
    type: 'image/jpeg',
    size: 980432,
    modifiedAt: new Date('2024-07-23T16:45:00Z'),
    folderId: 'folder-3',
  },
  {
    id: 'file-7',
    name: 'MSA_Client_Corp.pdf',
    type: 'application/pdf',
    size: 890432,
    modifiedAt: new Date('2024-06-15T12:00:00Z'),
    folderId: 'folder-4',
  },
];
