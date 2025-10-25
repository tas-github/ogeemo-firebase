
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

  const loadInitialData = useCallback(async () => {
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

          if (fileData.storagePath) {
            const content = await getFileContentFromStorage(firebaseServices.auth, fileData.storagePath);
            setFileContent(content);
          }

        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not find the specified file.',
          });
        }
      } else {
        // If creating a new file, pre-select the first folder if available
        if (fetchedFolders.length > 0) {
            setSelectedFolderId(fetchedFolders[0].id);
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load data',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, firebaseServices, toast, searchParams]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSave = async () => {
    if (!user) return;
    if (!fileName.trim()) {
      toast({ variant: 'destructive', title: 'File Name Required' });
      return;
    }
    if (!selectedFolderId) {
      toast({ variant: 'destructive', title: 'Folder Required', description: 'Please select a folder to save the file in.' });
      return;
    }

    setIsSaving(true);
    try {
      if (fileToEditId) {
        // Updating an existing file
        await updateFile(fileToEditId, {
          name: fileName,
          content: fileContent,
          folderId: selectedFolderId,
        });
        toast({ title: 'File Updated' });
      } else {
        // Creating a new file
        const newFile = await addTextFileClient(
          user.uid,
          selectedFolderId,
          fileName,
          fileContent
        );
        setFileToEditId(newFile.id);
        toast({ title: 'File Saved' });
        // Update URL without a full page reload to reflect the new file ID and storage path
        router.push(`/text-editor?fileId=${newFile.id}&storagePath=${encodeURIComponent(newFile.storagePath)}`, { scroll: false });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    try {
        const newFolder = await addFolder({ name: newFolderName.trim(), userId: user.uid, parentId: null });
        setFolders(prev => [...prev, newFolder]);
        setSelectedFolderId(newFolder.id); // Select the new folder
        setIsNewFolderDialogOpen(false);
        setNewFolderName('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create folder', description: error.message });
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
              <CardTitle>Text Editor</CardTitle>
              <CardDescription>
                Create and edit simple text files and notes.
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
                      placeholder="Enter the file name"
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
                {isSaving && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
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
