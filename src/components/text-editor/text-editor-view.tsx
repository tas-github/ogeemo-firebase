
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Save,
  LoaderCircle,
  ArrowLeft,
  FilePenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { type FileItem } from '@/data/files';
import { getFileById, updateFile } from '@/services/file-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';

export function TextEditorView() {
  const [file, setFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const fileId = searchParams.get('fileId');

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (isSaving || !file) return;

    const newContent = editorRef.current?.innerHTML || '';

    if (newContent === lastSavedContent) {
      if (!isAutoSave) {
        toast({ title: "No changes to save." });
      }
      return;
    }
    
    setIsSaving(true);
    
    try {
      await updateFile(file.id, { content: newContent });
      setLastSavedContent(newContent);
      if (!isAutoSave) {
        toast({ title: 'Document Saved', description: `"${file.name}" has been successfully updated.` });
      }
    } catch (error: any) {
        console.error("Save failed:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  }, [file, isSaving, lastSavedContent, toast]);

  useEffect(() => {
    async function loadFile() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      if (!fileId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const fetchedFile = await getFileById(fileId);
        if (!fetchedFile) {
          toast({ variant: 'destructive', title: 'Error', description: 'File not found.' });
          router.push('/file-manager');
          return;
        }
        if (!fetchedFile.type.startsWith('text/')) {
            toast({ variant: 'destructive', title: 'Unsupported File Type', description: 'This editor only supports text-based files.' });
            router.push('/file-manager');
            return;
        }
        setFile(fetchedFile);
        const initialContent = fetchedFile.content || '';
        setLastSavedContent(initialContent);
        if (editorRef.current) {
          editorRef.current.innerHTML = initialContent;
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load file', description: error.message });
      } finally {
        setIsLoading(false);
      }
    }
    loadFile();
  }, [fileId, router, toast, user]);
  
  const triggerAutoSave = useCallback(() => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(true);
      }, 2000); 
  }, [handleSave]);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    triggerAutoSave();
  };
  
  const preventDefault = (e: React.MouseEvent) => e.preventDefault();

  if (isLoading) {
    return (
        <div className="p-4 sm:p-6 space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[500px] w-full" />
        </div>
    );
  }

  if (!file) {
    return (
        <div className="p-4 sm:p-6 text-center">
            <FilePenLine className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No Document Selected</h2>
            <p className="mt-2 text-muted-foreground">Please create or select a document from the File Manager to begin editing.</p>
            <Button asChild className="mt-6">
                <a href="/file-manager">Go to File Manager</a>
            </Button>
        </div>
    );
  }

  return (
    <>
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <header className="flex justify-between items-center mb-4">
                <Button variant="outline" onClick={() => router.push('/file-manager')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to File Manager
                </Button>
                <div className="text-center">
                    <h1 className="text-xl font-bold font-headline text-primary truncate" title={file.name}>{file.name}</h1>
                    <p className="text-sm text-muted-foreground">Text Document</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => handleSave(false)} disabled={isSaving}>
                        {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Document'}
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
                <div className="p-2 border-b flex items-center gap-1 flex-wrap bg-muted/50">
                    <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Strikethrough" onMouseDown={preventDefault} onClick={() => handleFormat('strikeThrough')}><Strikethrough className="h-4 w-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Blockquote" onMouseDown={preventDefault} onClick={() => handleFormat('formatBlock', 'blockquote')}><Quote className="h-4 w-4" /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div
                        ref={editorRef}
                        contentEditable
                        className="prose dark:prose-invert max-w-none focus:outline-none h-full"
                        placeholder="Start writing..."
                        onInput={triggerAutoSave}
                    />
                </div>
            </div>
        </div>
    </>
  );
}
