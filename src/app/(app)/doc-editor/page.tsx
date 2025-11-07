'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LoaderCircle, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getFileById, updateFile, getFileContentFromStorage } from '@/services/file-service';
import { type FileItem } from '@/data/files';

export default function DocEditorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, firebaseServices } = useAuth();
    const { toast } = useToast();

    const [file, setFile] = useState<FileItem | null>(null);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fileId = searchParams.get('fileId');

    const loadContent = useCallback(async () => {
        if (!fileId || !user || !firebaseServices) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const fileData = await getFileById(fileId);
            if (!fileData || fileData.userId !== user.uid) {
                toast({ variant: 'destructive', title: 'Error', description: 'File not found or you do not have permission to access it.' });
                router.push('/document-manager');
                return;
            }
            setFile(fileData);

            if (fileData.storagePath) {
                const fileContent = await getFileContentFromStorage(firebaseServices.auth, fileData.storagePath);
                setContent(fileContent);
            } else {
                setContent(''); // Handle case where there's no storage path
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load file', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [fileId, user, router, toast, firebaseServices]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    const handleSave = async () => {
        if (!file) return;

        setIsSaving(true);
        try {
            await updateFile(file.id, { content });
            toast({ title: 'File Saved', description: `"${file.name}" has been updated.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!file) {
        return (
             <div className="flex h-full w-full items-center justify-center p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>No File Selected</CardTitle>
                        <CardDescription>Please go back to the Document Manager and select a file to edit.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/document-manager')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 space-y-4">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-headline">{file.name}</h1>
                    <p className="text-sm text-muted-foreground">Editing document</p>
                </div>
                <div className="flex items-center gap-2">
                     <Button variant="outline" onClick={() => router.push('/document-manager')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manager
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save
                    </Button>
                </div>
            </header>
            <Card className="flex-1 flex flex-col">
                <CardContent className="p-0 flex-1">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0"
                        placeholder="Start writing..."
                    />
                </CardContent>
            </Card>
        </div>
    );
}
