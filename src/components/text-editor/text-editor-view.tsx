
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Mic,
  Square,
  Save,
  LoaderCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { addEditorFile, getEditorFile, updateEditorFile, type EditorFile } from '@/services/text-editor-service';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { format, formatDistanceToNow } from 'date-fns';

export function TextEditorView() {
    const [file, setFile] = useState<EditorFile | null>(null);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { toast } = useToast();

    const fileId = useMemo(() => searchParams.get('fileId'), [searchParams]);
    const folderId = useMemo(() => searchParams.get('folderId'), [searchParams]);

    const loadFile = useCallback(async () => {
        if (!user || !fileId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const fetchedFile = await getEditorFile(fileId);
            if (fetchedFile) {
                setFile(fetchedFile);
                setFileName(fetchedFile.name);
                if (editorRef.current) {
                    editorRef.current.innerHTML = fetchedFile.content;
                }
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'File not found.' });
                router.push('/notes-manager');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load file', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [fileId, user, toast, router]);

    useEffect(() => {
        if (fileId) {
            loadFile();
        } else {
            setIsLoading(false);
            setFileName('New Document');
        }
    }, [fileId, loadFile]);

    const handleFormat = (command: string, value?: string) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(command, false, value);
        }
    };
    
    const handleSave = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Not authenticated.' });
            return;
        }
        if (!fileName.trim()) {
            toast({ variant: 'destructive', title: 'File name is required.' });
            return;
        }

        setIsSaving(true);
        const content = editorRef.current?.innerHTML || '';

        try {
            if (file) { // Editing existing file
                await updateEditorFile(file.id, { name: fileName, content });
                toast({ title: 'File Saved', description: `"${fileName}" has been updated.` });
                router.push('/notes-manager');
            } else if (folderId) { // Creating new file
                const newFile = await addEditorFile({
                    name: fileName.trim(),
                    content,
                    folderId,
                    userId: user.uid,
                });
                toast({ title: 'File Created', description: `"${newFile.name}" has been saved.` });
                router.push(`/notes-manager?fileId=${newFile.id}`);
            }
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
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 flex flex-col h-full items-center">
            <header className="w-full max-w-4xl mb-4 flex justify-between items-center">
                <Button variant="outline" onClick={() => router.push('/notes-manager')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notes Manager
                </Button>
                <div className="text-center">
                    <Input
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="text-2xl font-bold font-headline text-primary border-0 shadow-none focus-visible:ring-0 text-center"
                    />
                    {file && <p className="text-xs text-muted-foreground">Last saved: {formatDistanceToNow(file.modifiedAt, { addSuffix: true })}</p>}
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Saving...' : 'Save Document'}
                </Button>
            </header>

            <div className="w-full max-w-4xl flex-1 flex flex-col border rounded-lg">
                <div className="p-2 border-b flex flex-wrap items-center gap-1">
                    <Button variant="ghost" size="icon" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Strikethrough" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('strikeThrough')}><Strikethrough className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Highlight" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('backColor', 'yellow')}><Highlighter className="h-4 w-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Blockquote" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('formatBlock', 'blockquote')}><Quote className="h-4 w-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" title="Insert Link" onMouseDown={(e) => e.preventDefault()} onClick={() => { const url = prompt('Enter a URL:'); if (url) handleFormat('createLink', url); }}><LinkIcon className="h-4 w-4" /></Button>
                </div>
                <ScrollArea className="flex-1">
                    <div
                        ref={editorRef}
                        contentEditable
                        className="prose dark:prose-invert max-w-none p-6 focus:outline-none h-full"
                        placeholder="Start writing..."
                    />
                </ScrollArea>
            </div>
        </div>
    );
}
