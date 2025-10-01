
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFileById } from '@/services/file-service';
import { fetchFileContent } from '@/app/actions/file-actions';
import { updateTextFileContentByPath } from '@/services/file-service';
import type { FileItem } from '@/data/files';
import { Input } from '@/components/ui/input';

export default function DocEditorPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = Array.isArray(params.fileId) ? params.fileId[0] : params.fileId;
  const { toast } = useToast();

  const [file, setFile] = useState<FileItem | null>(null);
  const [content, setContent] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const isNewFile = fileId === 'new';

  useEffect(() => {
    if (isNewFile) {
        setIsLoading(false);
        return;
    };

    async function loadFile() {
      setIsLoading(true);
      try {
        const fileData = await getFileById(fileId);
        if (!fileData) {
          toast({ variant: 'destructive', title: 'Error', description: 'File not found.' });
          router.push('/file-cabinet');
          return;
        }
        setFile(fileData);
        setFileName(fileData.name);

        const { content: fileContent, error } = await fetchFileContent(fileData.storagePath);
        if (error) throw new Error(error);
        
        setContent(fileContent || '');

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load file', description: error.message });
      } finally {
        setIsLoading(false);
      }
    }
    loadFile();
  }, [fileId, isNewFile, router, toast]);

  const handleSave = async () => {
    if (!file) {
        toast({ variant: 'destructive', title: 'Error', description: 'No file is open to save.' });
        return;
    }

    setIsSaving(true);
    try {
        await updateTextFileContentByPath(file.storagePath, content);
        // TODO: Add file rename logic if fileName has changed from file.name
        toast({ title: 'File Saved', description: `Changes to "${file.name}" have been saved.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (isNewFile) {
     return (
        <div className="flex h-full w-full items-center justify-center text-center">
            <Card>
                <CardHeader>
                    <CardTitle>Create a New File</CardTitle>
                    <CardDescription>To start a new document, please go back to the Text Editor page and click "Create New Document".</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/doc-editor')}>
                         <ArrowLeft className="mr-2 h-4 w-4" /> Go to Text Editor
                    </Button>
                </CardContent>
            </Card>
        </div>
     );
  }

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-row items-center justify-between">
            <div className="flex-1">
                <Input 
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-0"
                />
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.push('/file-cabinet')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to File Cabinet
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0"
            placeholder="Start writing your document here..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
