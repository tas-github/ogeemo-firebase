
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, FileText, LoaderCircle, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getFiles, saveChatArchive, deleteFiles, getFileContent, getFolders } from '@/services/file-service';
import { type FileItem } from '@/data/files';
import { format } from 'date-fns';

const CHAT_ARCHIVES_FOLDER_NAME = "Chat Archives";

export default function DevNotesPage() {
  const [archives, setArchives] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [archiveToView, setArchiveToView] = useState<FileItem | null>(null);
  const [archiveContent, setArchiveContent] = useState<string | null>(null);
  const [archiveToDelete, setArchiveToDelete] = useState<FileItem | null>(null);

  const [newArchiveName, setNewArchiveName] = useState("");
  const [newArchiveContent, setNewArchiveContent] = useState("");

  const { toast } = useToast();
  const { user } = useAuth();

  const fetchArchives = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const [allFiles, allFolders] = await Promise.all([
            getFiles(user.uid),
            getFolders(user.uid),
        ]);
        
        const chatArchiveFolder = allFolders.find(f => f.name === CHAT_ARCHIVES_FOLDER_NAME && !f.parentId);

        if (chatArchiveFolder) {
            const chatArchives = allFiles.filter(file => file.folderId === chatArchiveFolder.id);
            setArchives(chatArchives.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()));
        } else {
            setArchives([]);
        }

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load archives', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const handleSave = async () => {
    if (!user || !newArchiveName.trim() || !newArchiveContent.trim()) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a name and content for the archive.' });
        return;
    }
    try {
        await saveChatArchive(user.uid, newArchiveName, newArchiveContent);
        toast({ title: 'Chat Saved', description: `Archive "${newArchiveName}" has been saved.` });
        setIsSaveDialogOpen(false);
        setNewArchiveName("");
        setNewArchiveContent("");
        await fetchArchives();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  };

  const handleView = async (archive: FileItem) => {
    setArchiveToView(archive);
    setIsViewDialogOpen(true);
    setArchiveContent(null); 
    try {
        const content = await getFileContent(archive.storagePath);
        setArchiveContent(content);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load content', description: error.message });
        setIsViewDialogOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !archiveToDelete) return;

    try {
        await deleteFiles([archiveToDelete.id]);
        setArchives(prev => prev.filter(a => a.id !== archiveToDelete.id));
        toast({ title: "Archive Deleted" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } finally {
        setArchiveToDelete(null);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 flex flex-col items-center h-full">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Dev Notes & Chat Archive
          </h1>
          <p className="text-muted-foreground">
            A place to manually save and review important conversations and notes.
          </p>
        </header>

        <Card className="w-full max-w-4xl flex-1 flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Saved Chat Archives</CardTitle>
                <CardDescription>
                  Your saved development chat sessions.
                </CardDescription>
              </div>
              <Button onClick={() => setIsSaveDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Save Current Chat
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full border rounded-md">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                ) : archives.length > 0 ? (
                    archives.map(archive => (
                        <div key={archive.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{archive.name}</p>
                                    <p className="text-xs text-muted-foreground">Saved on {format(new Date(archive.modifiedAt), 'PP')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleView(archive)}><Eye className="mr-2 h-4 w-4" /> View</Button>
                                <Button variant="destructive" size="sm" onClick={() => setArchiveToDelete(archive)}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground p-16">
                        <FileText className="mx-auto h-12 w-12" />
                        <p className="mt-4">No archives found.</p>
                        <p className="text-sm">Click "Save Current Chat" to add your first one.</p>
                    </div>
                )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>Save New Chat Archive</DialogTitle><DialogDescription>Copy and paste our current conversation into the text area below.</DialogDescription></DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="archive-name">Archive Name</Label>
                    <Input id="archive-name" value={newArchiveName} onChange={(e) => setNewArchiveName(e.target.value)} placeholder={`Chat - ${format(new Date(), 'yyyy-MM-dd')}`} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="archive-content">Chat Content</Label>
                    <Textarea id="archive-content" value={newArchiveContent} onChange={(e) => setNewArchiveContent(e.target.value)} rows={10} placeholder="Paste the chat conversation here..."/>
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Archive</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader><DialogTitle>{archiveToView?.name}</DialogTitle><DialogDescription>Saved on {archiveToView ? format(new Date(archiveToView.modifiedAt), 'PPp') : ''}</DialogDescription></DialogHeader>
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full border rounded-md p-4">
                    {archiveContent === null ? (
                        <div className="flex items-center justify-center h-full"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <pre className="text-sm whitespace-pre-wrap font-body">{archiveContent}</pre>
                    )}
                </ScrollArea>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveToDelete} onOpenChange={() => setArchiveToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the archive "{archiveToDelete?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
