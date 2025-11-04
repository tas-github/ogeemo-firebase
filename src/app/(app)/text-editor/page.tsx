
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoaderCircle, ArrowLeft, Save, FolderPlus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { type FolderItem } from '@/data/files';
import {
  addTextFileClient,
  getFileById,
  updateFile,
  getFolders,
  addFolder,
  getFileContentFromStorage,
} from '@/services/file-service';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function TextEditorPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileToEditId, setFileToEditId] = useState<string | null>(null);

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { user, firebaseServices } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      if (!user || !firebaseServices) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const fetchedFolders = await getFolders(user.uid);
        setFolders(fetchedFolders);

        const fileId = searchParams?.get('fileId');

        if (fileId) {
          setFileToEditId(fileId);
          const fileData = await getFileById(fileId);
          if (fileData) {
            setFileName(fileData.name);
            setSelectedFolderId(fileData.folderId);
            const content = await getFileContentFromStorage(firebaseServices.auth, fileData.storagePath);
            setFileContent(content);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find the specified file.' });
          }
        } else {
          // Default folder selection for new files
          if (fetchedFolders.length > 0) {
              const defaultFolder = fetchedFolders.find(f => !f.parentId) || fetchedFolders[0];
              setSelectedFolderId(defaultFolder.id);
          }
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, firebaseServices, toast, searchParams]);
  
  const handleSave = async () => {
    if (!user || !fileName.trim() || !selectedFolderId) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'File name and folder are required.' });
        return;
    }
    
    setIsSaving(true);
    try {
        if (fileToEditId) {
            // Update existing file
            await updateFile(fileToEditId, {
                name: fileName,
                content: fileContent,
                folderId: selectedFolderId,
            });
            toast({ title: 'File Updated', description: `"${fileName}" has been saved.` });
        } else {
            // Create new file
            const newFile = await addTextFileClient(
                user.uid,
                selectedFolderId,
                fileName,
                fileContent
            );
            toast({ title: 'File Saved', description: `"${fileName}" has been created.` });
            // Update URL to edit mode for the newly created file, preventing duplicate creations on subsequent saves.
            router.replace(`/text-editor?fileId=${newFile.id}`);
            setFileToEditId(newFile.id);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };


  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    try {
        const newFolder = await addFolder({ name: newFolderName.trim(), userId: user.uid, parentId: null });
        setFolders(prev => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedFolderId(newFolder.id);
        toast({ title: "Folder Created" });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create folder', description: error.message });
    } finally {
        setIsNewFolderDialogOpen(false);
        setNewFolderName('');
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <Button asChild variant="outline" className="mb-4">
            <Link href="/file-manager">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to File Manager
            </Link>
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>{fileToEditId ? 'Edit File' : 'Create New Text File'}</CardTitle>
              <CardDescription>
                {fileToEditId ? `Editing "${fileName}"` : 'Create a new text file or note.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="file-name">File Name</Label>
                    <Input
                      id="file-name"
                      placeholder="Enter the file name (e.g., my-notes.txt)"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="folder-select">Folder</Label>
                    <div className="flex gap-2">
                        <Select value={selectedFolderId || ''} onValueChange={setSelectedFolderId}>
                            <SelectTrigger id="folder-select">
                                <SelectValue placeholder="Select a folder..." />
                            </SelectTrigger>
                            <SelectContent>
                                {folders.map(folder => (
                                    <SelectItem key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsNewFolderDialogOpen(true)}>
                            <FolderPlus className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-editor-content">Content</Label>
                    <Textarea
                      id="text-editor-content"
                      placeholder="Start writing your content here..."
                      rows={15}
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : <Save className="mr-2 h-4 w-4" />}
                {fileToEditId ? 'Save Changes' : 'Save New File'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-name-new">Name</Label>
              <Input id="folder-name-new" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={async (e) => { if (e.key === 'Enter') handleCreateFolder() }} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder}>Create</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
