
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { checkoutToGoogleDrive } from '@/app/actions/file-actions';
import { Button } from '@/components/ui/button';

function OpenerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { accessToken } = useAuth();
    const [status, setStatus] = useState('Initializing...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fileId = searchParams.get('fileId');
        const fileName = searchParams.get('fileName');
        const storagePath = searchParams.get('storagePath');

        if (!fileId || !fileName || !storagePath) {
            setError('Missing required file information.');
            return;
        }

        if (!accessToken) {
            setStatus('Waiting for authentication...');
            // The component will re-render once the accessToken is available from the AuthContext
            return;
        }

        async function processFileCheckout() {
            setStatus('Checking out file to Google Drive...');
            try {
                const result = await checkoutToGoogleDrive({ fileId, fileName, storagePath, accessToken });
                if (result.success && result.driveLink) {
                    setStatus('Redirecting to Google Drive...');
                    window.location.href = result.driveLink;
                } else {
                    throw new Error(result.error || 'Failed to get a valid link from Google Drive.');
                }
            } catch (err: any) {
                console.error('File checkout process failed:', err);
                setError(err.message || 'An unknown error occurred during the checkout process.');
            }
        }

        processFileCheckout();

    }, [accessToken, searchParams, router]);

    if (error) {
        return (
            <div className="flex flex-col items-center gap-4 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold">Could Not Open File</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => router.push('/files')}>Return to File Cabinet</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">{status}</h2>
            <p className="text-muted-foreground">Please wait, this may take a moment...</p>
        </div>
    );
}


export default function OpenerPage() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
           <Suspense fallback={<LoaderCircle className="h-12 w-12 animate-spin text-primary" />}>
                <OpenerContent />
           </Suspense>
        </div>
    )
}
