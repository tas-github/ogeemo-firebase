
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import { getGoogleDriveWebViewLink } from '@/services/google-service';
import { getDownloadUrl } from '@/app/actions/file-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mime types that Google Drive can convert
const GOOGLE_WORKSPACE_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',   // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/msword', // .doc
    'application/vnd.ms-excel', // .xls
    'application/vnd.ms-powerpoint', // .ppt
];

// Mime types browsers can typically open directly
const WEB_VIEWABLE_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
];

export default function OpenerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const openFile = async () => {
            const fileId = searchParams.get('fileId');
            const fileType = searchParams.get('fileType');
            const storagePath = searchParams.get('storagePath');

            if (!fileId || !fileType || !storagePath) {
                setErrorMessage('Missing file information. Cannot open.');
                setStatus('error');
                return;
            }

            try {
                let finalUrl: string | undefined;

                if (GOOGLE_WORKSPACE_MIME_TYPES.includes(fileType)) {
                    // It's a document for Google Drive
                    const result = await getGoogleDriveWebViewLink(fileId, storagePath);
                    if (result.error) throw new Error(result.error);
                    finalUrl = result.url;
                } else if (WEB_VIEWABLE_MIME_TYPES.includes(fileType)) {
                    // It's a file the browser can open directly
                    const result = await getDownloadUrl(storagePath);
                    if (result.error) throw new Error(result.error);
                    finalUrl = result.url;
                } else {
                    // File type is not supported for opening directly
                    setErrorMessage(`Files of type "${fileType}" cannot be opened directly.`);
                    setStatus('error');
                    return;
                }

                if (finalUrl) {
                    // Replace the current history entry with the new URL
                    window.location.replace(finalUrl);
                } else {
                    throw new Error('Could not retrieve a valid URL for the file.');
                }
            } catch (error: any) {
                console.error("Opener Error:", error);
                setErrorMessage(error.message || 'An unknown error occurred.');
                setStatus('error');
            }
        };

        openFile();
    }, [searchParams, router]);

    if (status === 'error') {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-muted p-4">
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle className="mt-4">Could Not Open File</CardTitle>
                        <CardDescription>{errorMessage}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/files">Return to File Cabinet</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Opening your file...</p>
        </div>
    );
}
