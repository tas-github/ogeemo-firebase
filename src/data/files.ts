
export const REPORT_TEMPLATE_MIMETYPE = 'application/vnd.og-report-template+html';

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number; // in bytes
  modifiedAt: Date;
  folderId: string;
  content?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
}

export const mockFolders: FolderItem[] = [
  { id: 'folder-reports', name: 'Report Templates', parentId: null },
  { id: 'folder-1', name: 'Client Documents', parentId: null },
  { id: 'folder-2', name: 'Invoices', parentId: 'folder-1' },
  { id: 'folder-3', name: 'Marketing Assets', parentId: 'folder-1' },
  { id: 'folder-4', name: 'Internal Projects', parentId: null },
  { id: 'folder-5', name: 'Website V2', parentId: 'folder-4' },
  { id: 'folder-6', name: 'Design', parentId: 'folder-5' },
  { id: 'folder-7', name: 'Development', parentId: 'folder-5' },
];

export const mockFiles: FileItem[] = [
  {
    id: 'file-1',
    name: 'Website_Redesign_Brief.pdf',
    type: 'application/pdf',
    size: 1204857,
    modifiedAt: new Date('2024-07-20T10:00:00Z'),
    folderId: 'folder-6',
  },
  {
    id: 'file-2',
    name: 'Q1_Financials.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    name: 'api-endpoints.json',
    type: 'application/json',
    size: 1234,
    modifiedAt: new Date('2024-07-26T10:15:00Z'),
    folderId: 'folder-7',
  },
  {
    id: 'file-8',
    name: 'Component.tsx',
    type: 'text/javascript',
    size: 2456,
    modifiedAt: new Date('2024-07-26T11:30:00Z'),
    folderId: 'folder-7',
  },
  {
    id: 'file-9',
    name: 'landing-page-v1.fig',
    type: 'application/octet-stream',
    size: 4500123,
    modifiedAt: new Date('2024-07-24T09:00:00Z'),
    folderId: 'folder-6',
  },
  {
    id: 'file-10',
    name: 'landing-page-v2.fig',
    type: 'application/octet-stream',
    size: 5100234,
    modifiedAt: new Date('2024-07-25T15:20:00Z'),
    folderId: 'folder-6',
  },
];
