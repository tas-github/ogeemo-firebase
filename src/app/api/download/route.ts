
import { NextResponse } from 'next/server';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function POST(request: Request) {
  if (!storage) {
    return new NextResponse(
      JSON.stringify({ message: 'Firebase Storage is not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { storagePath, fileName } = await request.json();

    if (!storagePath || !fileName) {
      return new NextResponse(
        JSON.stringify({ message: 'Missing storagePath or fileName.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileRef = ref(storage, storagePath);
    // Fetch the file directly from the download URL. This is a server-to-server request, so no CORS.
    const downloadURL = await getDownloadURL(fileRef);
    const fileResponse = await fetch(downloadURL);

    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from storage: ${fileResponse.statusText}`);
    }

    // Get the file content as a blob
    const blob = await fileResponse.blob();

    // Create a new response with the blob and correct headers
    const headers = new Headers();
    headers.append('Content-Type', blob.type || 'application/octet-stream');
    headers.append('Content-Disposition', `attachment; filename="${fileName}"`);

    return new Response(blob, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Download API error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(
        JSON.stringify({ message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
