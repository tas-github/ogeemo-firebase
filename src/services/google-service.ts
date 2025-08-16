
'use server';

import { google } from 'googleapis';
import { adminDb as db, getAdminStorage } from '@/lib/firebase-admin';
import { addFileRecord, findOrCreateFileFolder, getFilesForFolder } from './file-service';
import { type FileItem } from '@/data/files';
import {
  GetGoogleContactsOutput,
  GoogleContact,
} from '@/types/google';

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

  // Parse and filter contacts to ensure they have at least a name and email.
  const validatedContacts = connections
    .map((conn: any) => {
        // Basic validation, since Zod schema was moved.
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

// Helper to get OAuth2 client
const getOAuth2Client = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google API credentials are not set in environment variables.');
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

export async function getGoogleAuthUrl(
  userId: string,
  state: string
): Promise<{ url: string }> {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/drive.file', // Changed from readonly to file for creating files
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/contacts.readonly',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: state,
    prompt: 'consent',
  });
  return { url };
}

export async function getGoogleAccessToken(
  code: string
): Promise<{ accessToken: string; refreshToken: string | null }> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token) {
    throw new Error('Failed to retrieve access token.');
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
  };
}

// The return type is modified to return a plain object that is JSON-serializable
export async function downloadFromGoogleDriveAndUpload(
  fileId: string,
  fileName: string,
  mimeType: string,
  accessToken: string,
  userId: string,
  folderId: string
): Promise<FileItem> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // 1. Download file from Google Drive
  const response = await drive.files.get(
    { fileId: fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  const buffer = Buffer.from(response.data as any);

  // 2. Upload to Firebase Storage
  const storagePath = `${userId}/${folderId}/${Date.now()}-${fileName}`;
  const file = getAdminStorage().bucket().file(storagePath);
  await file.save(buffer, { contentType: mimeType });

  // 3. Create Firestore record
  const newFileRecord: Omit<FileItem, 'id'> = {
    name: fileName,
    type: mimeType,
    size: buffer.length,
    modifiedAt: new Date(),
    folderId,
    userId,
    storagePath,
  };

  const savedFile = await addFileRecord(newFileRecord);

  // 4. Return a plain, serializable object
  return {
    ...savedFile,
    modifiedAt: savedFile.modifiedAt.toISOString(),
  } as unknown as FileItem;
}

export async function getGoogleDriveWebViewLink(fileId: string, storagePath: string): Promise<{ url?: string; error?: string }> {
    const accessToken = "DUMMY_TOKEN_REPLACE_WITH_REAL_ONE"; // In a real app, this would be retrieved from the user's session/database
    if (!accessToken) {
        return { error: 'User is not authenticated with Google. Please connect your account in the Google Integration settings.' };
    }

    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ access_token: accessToken });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Step 1: Download the file from Firebase Storage to the server's memory
        const bucket = getAdminStorage().bucket();
        const file = bucket.file(storagePath);
        const [buffer] = await file.download();

        // Step 2: Get file metadata from Firestore
        const fileDoc = await db.collection('files').doc(fileId).get();
        if (!fileDoc.exists) {
            return { error: 'File record not found in database.' };
        }
        const fileData = fileDoc.data() as FileItem;

        // Step 3: Upload the file to Google Drive
        const media = {
            mimeType: fileData.type,
            body: require('stream').Readable.from(buffer),
        };
        const driveResponse = await drive.files.create({
            requestBody: {
                name: fileData.name,
                mimeType: fileData.type,
            },
            media: media,
            fields: 'webViewLink',
        });
        
        const webViewLink = driveResponse.data.webViewLink;

        if (!webViewLink) {
            return { error: 'Could not get a viewable link from Google Drive.' };
        }
        
        return { url: webViewLink };

    } catch (error: any) {
        console.error("Error processing file with Google Drive:", error);
        if (error.code === 401 || (error.response && error.response.status === 401)) {
            return { error: 'Google authentication is invalid. Please reconnect your account.' };
        }
        return { error: error.message || 'An unknown server error occurred.' };
    }
}

export async function syncGoogleDriveFolder(
    accessToken: string,
    userId: string
): Promise<{ syncedFiles: number; totalFiles: number }> {
    const GDRIVE_SOURCE_FOLDER_NAME = "1 1Ogeemo File Cabinet";
    const OGEEMO_DEST_FOLDER_NAME = "Ogeemo Google File Sync";

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Find the source Google Drive folder
    const driveFoldersRes = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${GDRIVE_SOURCE_FOLDER_NAME}' and trashed=false`,
        fields: 'files(id, name)',
    });
    const sourceFolder = driveFoldersRes.data.files?.[0];
    if (!sourceFolder || !sourceFolder.id) {
        throw new Error(`Google Drive folder "${GDRIVE_SOURCE_FOLDER_NAME}" not found.`);
    }

    // 2. Find or create the destination Ogeemo folder
    const ogeemoFolder = await findOrCreateFileFolder(userId, OGEEMO_DEST_FOLDER_NAME, null);

    // 3. List files in both folders to compare
    const [driveFilesRes, ogeemoFiles] = await Promise.all([
        drive.files.list({
            q: `'${sourceFolder.id}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType, size, modifiedTime)',
        }),
        getFilesForFolder(userId, ogeemoFolder.id),
    ]);
    
    const driveFiles = driveFilesRes.data.files || [];
    if (driveFiles.length === 0) {
        return { syncedFiles: 0, totalFiles: 0 };
    }

    // 4. Determine which files are new and need to be synced
    const filesToSync = driveFiles.filter(driveFile => {
        return !ogeemoFiles.some(ogeemoFile => 
            ogeemoFile.name === driveFile.name && ogeemoFile.size === Number(driveFile.size)
        );
    });

    // 5. Sync each new file
    let syncedCount = 0;
    for (const driveFile of filesToSync) {
        if (!driveFile.id || !driveFile.name || !driveFile.mimeType) continue;

        try {
            await downloadFromGoogleDriveAndUpload(
                driveFile.id,
                driveFile.name,
                driveFile.mimeType,
                accessToken,
                userId,
                ogeemoFolder.id
            );
            syncedCount++;
        } catch (error) {
            console.error(`Failed to sync file: ${driveFile.name}`, error);
            // Continue syncing other files even if one fails
        }
    }

    return { syncedFiles: syncedCount, totalFiles: driveFiles.length };
}
