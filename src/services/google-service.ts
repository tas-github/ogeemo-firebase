
'use server';

import { google, drive_v3 } from 'googleapis';
import { adminDb as db, getAdminStorage } from '@/lib/firebase-admin';
import { type FileItem } from '@/data/files';
import {
  GetGoogleContactsOutput,
  GoogleContact,
} from '@/types/google';
import stream from 'stream';
import { findOrCreateFileFolder, addFileRecord } from './file-service';

export async function getGoogleContacts(
  accessToken: string
): Promise<GetGoogleContactsOutput> {
  if (!accessToken) {
    throw new Error('Google access token is required.');
  }

  const response = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Ensure fresh data is fetched every time
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google People API Error:', errorData);
    throw new Error(
      `Failed to fetch Google Contacts: ${
        errorData.error?.message || 'Unknown error'
      }`
    );
  }

  const data = await response.json();
  const connections = data.connections || [];
  const validatedContacts = connections
    .map((conn: any) => {
        if (conn.names?.[0]?.displayName && conn.emailAddresses?.[0]?.value) {
            return {
                resourceName: conn.resourceName,
                names: conn.names,
                emailAddresses: conn.emailAddresses,
                phoneNumbers: conn.phoneNumbers,
            } as GoogleContact;
        }
        return null;
    })
    .filter(Boolean) as GoogleContact[];

  return { contacts: validatedContacts };
}

async function getGoogleAuth(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return auth;
}

// Uploads a file from Firebase Storage to Google Drive and returns the link
export async function uploadToDriveAndGetLink(params: { fileName: string, storagePath: string, accessToken: string }): Promise<{ driveLink: string, googleFileId: string }> {
    const { fileName, storagePath, accessToken } = params;

    const auth = await getGoogleAuth(accessToken);
    const drive = google.drive({ version: 'v3', auth });

    const bucket = getAdminStorage().bucket();
    const fileStream = bucket.file(storagePath).createReadStream();

    const fileMetadata = { name: fileName };
    const media = { body: fileStream };
    
    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
    });
    
    const googleFileId = response.data.id;
    const driveLink = response.data.webViewLink;

    if (!googleFileId || !driveLink) {
        throw new Error('Failed to create file in Google Drive or get a valid link.');
    }
    
    // Make the file publicly accessible (or share with specific users)
    await drive.permissions.create({
        fileId: googleFileId,
        requestBody: {
            role: 'writer',
            type: 'anyone',
        },
    });

    return { driveLink, googleFileId };
}

// Saves an updated file from Google Drive back to Firebase Storage
export async function saveFromDriveToFirebase(params: { storagePath: string; googleDriveFileId: string; accessToken: string; }): Promise<void> {
    const { storagePath, googleDriveFileId, accessToken } = params;
    
    const auth = await getGoogleAuth(accessToken);
    const drive = google.drive({ version: 'v3', auth });
    
    // 1. Get the file content from Google Drive
    const response = await drive.files.get(
        { fileId: googleDriveFileId, alt: 'media' },
        { responseType: 'stream' }
    );

    const driveStream = response.data as stream.Readable;

    // 2. Get a reference to the Firebase Storage file
    const bucket = getAdminStorage().bucket();
    const file = bucket.file(storagePath);
    
    // 3. Create a writable stream to Firebase Storage
    const firebaseStream = file.createWriteStream();

    // 4. Pipe the data from Drive to Firebase Storage
    await new Promise((resolve, reject) => {
        driveStream.pipe(firebaseStream)
            .on('finish', resolve)
            .on('error', reject);
    });
}


// --- New Folder Import Logic ---

const GOOGLE_DOC_MIMETYPES_TO_EXPORT: Record<string, { extension: string; mimeType: string }> = {
    'application/vnd.google-apps.document': { extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    'application/vnd.google-apps.spreadsheet': { extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    'application/vnd.google-apps.presentation': { extension: 'pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
};

async function processFile(drive: drive_v3.Drive, file: drive_v3.Schema$File, userId: string, ogeemoFolderId: string) {
    if (!file.id || !file.name || !file.mimeType) {
        console.warn('Skipping file with missing ID, name, or mimeType:', file);
        return { skipped: true, reason: 'Missing metadata' };
    }

    const isGoogleDoc = file.mimeType.startsWith('application/vnd.google-apps');
    const exportConfig = GOOGLE_DOC_MIMETYPES_TO_EXPORT[file.mimeType];
    
    let fileName = file.name;
    let fileStream;

    if (isGoogleDoc) {
        if (!exportConfig) {
            console.warn(`Skipping unsupported Google Workspace file type: ${file.mimeType}`);
            return { skipped: true, reason: 'Unsupported Google Workspace type' };
        }
        fileName = `${file.name}.${exportConfig.extension}`;
        const response = await drive.files.export({ fileId: file.id, mimeType: exportConfig.mimeType }, { responseType: 'stream' });
        fileStream = response.data as stream.Readable;
    } else {
        const response = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'stream' });
        fileStream = response.data as stream.Readable;
    }

    const bucket = getAdminStorage().bucket();
    const storagePath = `${userId}/${ogeemoFolderId}/${Date.now()}-${fileName}`;
    const storageFile = bucket.file(storagePath);
    const firebaseStream = storageFile.createWriteStream();

    await new Promise((resolve, reject) => {
        fileStream.pipe(firebaseStream).on('finish', resolve).on('error', reject);
    });
    
    const [metadata] = await storageFile.getMetadata();

    const newFileRecord: Omit<FileItem, 'id'> = {
        name: fileName,
        type: metadata.contentType || file.mimeType,
        size: parseInt(metadata.size, 10),
        modifiedAt: new Date(file.modifiedTime || Date.now()),
        folderId: ogeemoFolderId,
        userId,
        storagePath,
    };

    await addFileRecord(newFileRecord);
    return { skipped: false };
}

export async function importFolderFromDrive(params: { rootFolderId: string; accessToken: string; userId: string; }): Promise<string> {
    const { rootFolderId, accessToken, userId } = params;
    const auth = await getGoogleAuth(accessToken);
    const drive = google.drive({ version: 'v3', auth });
    
    let fileCount = 0;
    let folderCount = 0;
    let skippedCount = 0;
    
    try {
        const rootDriveFolder = await drive.files.get({ fileId: rootFolderId, fields: 'id, name' });
        if (!rootDriveFolder.data.name) throw new Error('Could not retrieve root folder name from Google Drive.');

        const ogeemoRootFolder = await findOrCreateFileFolder(userId, rootDriveFolder.data.name);
        folderCount++;

        const traverse = async (driveFolderId: string, ogeemoParentFolderId: string) => {
            let pageToken: string | undefined = undefined;
            do {
                const res = await drive.files.list({
                    q: `'${driveFolderId}' in parents and trashed = false`,
                    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
                    pageToken,
                });

                const items = res.data.files || [];
                for (const item of items) {
                    if (item.mimeType === 'application/vnd.google-apps.folder') {
                        const newOgeemoFolder = await findOrCreateFileFolder(userId, item.name!, ogeemoParentFolderId);
                        folderCount++;
                        await traverse(item.id!, newOgeemoFolder.id);
                    } else {
                        const result = await processFile(drive, item, userId, ogeemoParentFolderId);
                        if (result.skipped) {
                            skippedCount++;
                        } else {
                            fileCount++;
                        }
                    }
                }
                pageToken = res.data.nextPageToken || undefined;
            } while (pageToken);
        };

        await traverse(rootFolderId, ogeemoRootFolder.id);
        
        return `Import complete. Created ${folderCount} folder(s) and imported ${fileCount} file(s). Skipped ${skippedCount} file(s).`;
    } catch (error: any) {
        if (error.code === 403) {
            throw new Error("Permission denied. Ensure you have granted Google Drive access to this application. You may need to sign out and sign back in to grant the correct permissions.");
        }
        throw error;
    }
}
