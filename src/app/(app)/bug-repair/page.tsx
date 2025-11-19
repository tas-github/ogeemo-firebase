'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Save, Eraser, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { findOrCreateFileFolder, updateFile, addTextFileClient } from '@/services/file-service';

const TEST_FOLDER_NAME = "Bug Repair Tests";

export default function BugRepairPage() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to save.'});
        return;
    }
    const content = editorRef.current?.innerHTML || '';
    if (!content.trim()) {
        toast({ variant: 'destructive', title: 'Cannot save empty content.' });
        return;
    }

    setIsSaving(true);
    try {
        const testFolder = await findOrCreateFileFolder(user.uid, TEST_FOLDER_NAME);

        if (currentFileId) {
            // Update existing file
            await updateFile(currentFileId, { content });
             toast({
                title: "Content Updated",
                description: `Your content has been saved.`,
            });
        } else {
            // Create new file
            const newFile = await addTextFileClient(
                user.uid,
                testFolder.id,
                `Test Document ${new Date().toLocaleTimeString()}`,
                content
            );
            setCurrentFileId(newFile.id);
            toast({
                title: "Content Saved",
                description: `A new test file has been created in the "${TEST_FOLDER_NAME}" folder.`,
            });
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: "Save Failed",
            description: error.message || 'An unknown error occurred.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setCurrentFileId(null);
    toast({
      title: "Content Cleared",
    });
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col items-center">
      <header className="text-center mb-6">
          <h1 className="text-3xl font-bold font-headline text-primary">Isolated Text Editor</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A safe environment to build and test a simple text editor.
          </p>
      </header>
      
      <Card className="w-full max-w-4xl flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Sandbox Editor</CardTitle>
          <CardDescription>
            This editor saves HTML content to the dedicated "{TEST_FOLDER_NAME}" folder in your Document Manager.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div
            ref={editorRef}
            contentEditable
            className="prose dark:prose-invert max-w-none flex-1 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Start typing here..."
          />
        </CardContent>
        <div className="p-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={handleClear} disabled={isSaving}><Eraser className="mr-2 h-4 w-4" /> Clear</Button>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
            </Button>
        </div>
      </Card>
    </div>
  );
}
