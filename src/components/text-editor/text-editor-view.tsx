
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Folder, FileText, Plus, Trash2, MoreVertical, Pencil, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getEditorFolders,
  addEditorFolder,
  updateEditorFolder,
  deleteEditorFolder,
  getEditorFiles,
  addEditorFile,
  updateEditorFile,
  deleteEditorFile,
  deleteEditorFiles,
  type EditorFile,
  type EditorFolder,
} from '@/services/text-editor-service';
import { useAuth } from '@/context/auth-context';
import { LoaderCircle } from 'lucide-react';

const ItemTypes = {
  FILE: 'file',
};

const DraggableFile = ({ file, isSelected, onToggleSelect, selectedFileIds, onDelete, onClick }: { file: EditorFile, isSelected: boolean, onToggleSelect: (id: string) => void, selectedFileIds: string[], onDelete: (id: string) => void, onClick: () => void }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FILE,
    item: () => {
      const isSelectedInDrag = selectedFileIds.includes(file.id);
      const draggedIds = isSelectedInDrag ? selectedFileIds : [file.id];
      return { ids: draggedIds, type: ItemTypes.FILE };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 p-1 rounded-md cursor-pointer hover:bg-muted group",
        isSelected && "bg-accent",
        isDragging && "opacity-50"
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleSelect(file.id)}
        onClick={(e) => e.stopPropagation()}
        className="mr-2"
      />
      <FileText className="h-4 w-4" />
      <div className="flex-1 w-0">
        <p className="text-sm truncate">{file.name}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onDelete(file.id)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export function TextEditorView() {
    const [folders, setFolders] = useState<EditorFolder[]>([]);
    const [files, setFiles] = useState<EditorFile[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [newFileContent, setNewFileContent] = useState("");
    const [newFileFolderId, setNewFileFolderId] = useState<string>("");

    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
    
    const [folderToDelete, setFolderToDelete] = useState<EditorFolder | null>(null);
    const [folderToRename, setFolderToRename] = useState<EditorFolder | null>(null);
    const [renameValue, setRenameValue] = useState("");

    const { toast } = useToast();
    const { user } = useAuth();

    const loadData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [fetchedFolders, fetchedFiles] = await Promise.all([
                getEditorFolders(user.uid),
                getEditorFiles(user.uid),
            ]);

            setFolders(fetchedFolders);
            setFiles(fetchedFiles);

            if (fetchedFolders.length > 0 && !selectedFolderId) {
                setSelectedFolderId(fetchedFolders[0].id);
            } else if (fetchedFolders.length === 0) {
                setSelectedFolderId(null);
            }
        } catch (error) {
            console.error("Failed to load from Firestore:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast, selectedFolderId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const selectedFile = useMemo(() => files.find(f => f.id === selectedFileId), [files, selectedFileId]);
    
    const filesInSelectedFolder = useMemo(() => {
        if (selectedFolderId === null) return [];
        return files.filter(f => f.folderId === selectedFolderId);
    }, [files, selectedFolderId]);
    
    const handleOpenNewFileDialog = () => {
        setNewFileFolderId(selectedFolderId || "");
        setIsNewFileDialogOpen(true);
    };

    const handleCreateNewFile = async () => {
        if (!newFileName.trim()) { toast({ variant: 'destructive', title: 'File name is required.' }); return; }
        if (!newFileFolderId) { toast({ variant: 'destructive', title: 'Please select a folder first.' }); return; }
        if (!user) return;

        try {
            const newFile = await addEditorFile({
                name: newFileName.trim(),
                content: newFileContent,
                folderId: newFileFolderId,
                userId: user.uid,
            });
            setFiles(prev => [...prev, newFile]);
            setSelectedFolderId(newFile.folderId);
            setSelectedFileId(newFile.id);
            
            setIsNewFileDialogOpen(false);
            setNewFileName('');
            setNewFileContent('');
            toast({ title: "File Created", description: `"${newFile.name}" was added.`});
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create file.' });
        }
    };
    
    const handleToggleSelect = (fileId: string) => {
        setSelectedFileIds(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, id]);
    };

    const handleToggleSelectAll = () => {
        const fileIdsInCurrentFolder = filesInSelectedFolder.map(f => f.id);
        if (selectedFileIds.length === fileIdsInCurrentFolder.length) {
            setSelectedFileIds([]);
        } else {
            setSelectedFileIds(fileIdsInCurrentFolder);
        }
    };
    
    const handleDeleteSelected = async () => {
        if (selectedFileIds.length === 0) return;
        try {
            await deleteEditorFiles(selectedFileIds);
            setFiles(prev => prev.filter(f => !selectedFileIds.includes(f.id)));
            toast({ title: `Deleted ${selectedFileIds.length} file(s).` });
            setSelectedFileIds([]);
            if (selectedFileId && selectedFileIds.includes(selectedFileId)) {
                setSelectedFileId(null);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete files.' });
        }
    };

    const handleFileDrop = async (item: { ids: string[] }, newFolderId: string) => {
        const originalFiles = [...files];
        try {
            setFiles(prevFiles => prevFiles.map(file => item.ids.includes(file.id) ? { ...file, folderId: newFolderId } : file));
            await Promise.all(item.ids.map(id => updateEditorFile(id, { folderId: newFolderId })));
            
            const folderName = folders.find(f => f.id === newFolderId)?.name || '...';
            toast({ title: `${item.ids.length} file(s) moved to "${folderName}"` });
            setSelectedFileIds([]);
        } catch (error: any) {
            setFiles(originalFiles);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to move files.' });
        }
    };
    
    const handleCreateNewFolder = async () => {
        if (!newFolderName.trim() || !user) {
            toast({ variant: 'destructive', title: 'Folder name is required.' });
            return;
        }
        try {
            const newFolder = await addEditorFolder({ name: newFolderName.trim(), userId: user.uid, parentId: newFolderParentId });
            setFolders(prev => [...prev, newFolder]);
            setIsNewFolderDialogOpen(false);
            setNewFolderName('');
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to create folder.' });
        }
    };
    
    const handleConfirmDeleteFolder = async () => {
        if (!folderToDelete) return;
        try {
            await deleteEditorFolder(folderToDelete.id);
            setFiles(prev => prev.filter(f => f.folderId !== folderToDelete.id));
            setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
            if (selectedFolderId === folderToDelete.id) {
                setSelectedFolderId(folders.length > 1 ? folders.find(f => f.id !== folderToDelete.id)!.id : null);
            }
            setFolderToDelete(null);
            toast({ title: 'Folder Deleted' });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete folder.' });
        }
    };

    const handleStartRename = (folder: EditorFolder) => {
        setFolderToRename(folder);
        setRenameValue(folder.name);
    };

    const handleConfirmRename = async () => {
        if (!folderToRename || !renameValue.trim()) return;
        try {
            await updateEditorFolder(folderToRename.id, { name: renameValue.trim() });
            setFolders(prev => prev.map(f => f.id === folderToRename.id ? { ...f, name: renameValue.trim() } : f));
            setFolderToRename(null);
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename folder.' });
        }
    };

    const FolderItem = ({ folder }: { folder: EditorFolder }) => {
        const [{ isOver, canDrop }, drop] = useDrop(() => ({
            accept: ItemTypes.FILE,
            drop: (item: { ids: string[] }) => handleFileDrop(item, folder.id),
            collect: (monitor) => ({
                isOver: monitor.isOver(),
                canDrop: monitor.canDrop(),
            }),
        }));
    
        return (
            <div
                ref={drop}
                onClick={() => { setSelectedFolderId(folder.id); setSelectedFileId(null); setSelectedFileIds([]); }}
                className={cn(
                    "flex items-center gap-2 p-1 rounded-md cursor-pointer hover:bg-muted group",
                    selectedFolderId === folder.id && "bg-accent",
                    isOver && canDrop && "bg-primary/20 ring-2 ring-primary"
                )}
            >
                <Folder className="h-4 w-4" />
                {folderToRename?.id === folder.id ? (
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={handleConfirmRename}
                    onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename() }}
                    className="h-7 text-sm"
                  />
                ) : (
                  <div className="flex-1 w-0"><p className="text-sm truncate">{folder.name}</p></div>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { setNewFolderParentId(folder.id); setIsNewFolderDialogOpen(true); }}><FolderPlus className="mr-2 h-4 w-4"/>New Subfolder</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStartRename(folder)}><Pencil className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFolderToDelete(folder)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <>
            <div className="p-4 sm:p-6 flex flex-col h-full items-center">
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold font-headline text-primary">Text Editor</h1>
                </header>
                <ResizablePanelGroup
                    direction="vertical"
                    className="flex-1 w-full max-w-6xl rounded-lg border"
                >
                    <ResizablePanel defaultSize={30} minSize={20}>
                       <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <div className="flex h-full flex-col">
                                    <div className="flex items-center justify-between p-2 border-b">
                                        <h3 className="text-lg font-semibold px-2">Folders</h3>
                                        <Button size="icon" variant="ghost" onClick={() => { setNewFolderParentId(null); setIsNewFolderDialogOpen(true); }}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                    <ScrollArea className="flex-1 p-2">
                                        {folders.map(folder => <FolderItem key={folder.id} folder={folder} />)}
                                    </ScrollArea>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={70} minSize={30}>
                                <div className="flex h-full flex-col">
                                    <div className="flex items-center justify-between p-2 border-b">
                                        <h3 className="text-lg font-semibold px-2">Files</h3>
                                        <Button size="icon" variant="ghost" onClick={handleOpenNewFileDialog}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="p-2 border-b">
                                        {selectedFileIds.length > 0 ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">{selectedFileIds.length} selected</span>
                                                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                 <Checkbox id="select-all" checked={filesInSelectedFolder.length > 0 && selectedFileIds.length === filesInSelectedFolder.length} onCheckedChange={handleToggleSelectAll} />
                                                 <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
                                            </div>
                                        )}
                                    </div>
                                    <ScrollArea className="flex-1 p-2">
                                        {selectedFolderId ? (
                                            filesInSelectedFolder.map(file => (
                                                <DraggableFile key={file.id} file={file} isSelected={selectedFileIds.includes(file.id)} onToggleSelect={handleToggleSelect} selectedFileIds={selectedFileIds} onDelete={(id) => deleteEditorFile(id).then(() => setFiles(files.filter(f => f.id !== id)))} onClick={() => setSelectedFileId(file.id)} />
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-muted-foreground">Select a folder</div>
                                        )}
                                    </ScrollArea>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={70}>
                         <div className="flex flex-col h-full">
                            <div className="p-4 border-b">
                                <h3 className="font-semibold">{selectedFile?.name || 'Select a file to view its content'}</h3>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                <pre className="text-sm whitespace-pre-wrap font-sans">
                                    {selectedFile?.content}
                                </pre>
                            </ScrollArea>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
            
            <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
                <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
                    <DialogHeader className="p-6 pb-4 border-b">
                        <DialogTitle>Create New File</DialogTitle>
                        <DialogDescription>Create a new text file.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 p-6 flex-1 min-h-0">
                        <div className="space-y-2">
                            <Label htmlFor="file-folder">Folder <span className="text-destructive">*</span></Label>
                            <Select value={newFileFolderId} onValueChange={setNewFileFolderId}>
                                <SelectTrigger id="file-folder">
                                    <SelectValue placeholder="Select a folder..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {folders.map(folder => (<SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file-name">File Name <span className="text-destructive">*</span></Label>
                            <Input id="file-name" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="My new document.txt" />
                        </div>
                        <div className="space-y-2 flex-1 flex flex-col">
                            <Label htmlFor="file-content">Content</Label>
                            <Textarea id="file-content" value={newFileContent} onChange={(e) => setNewFileContent(e.target.value)} placeholder="Start typing your content here..." className="flex-1 resize-none" />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-4 border-t">
                        <Button variant="ghost" onClick={() => setIsNewFileDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateNewFile}>Create File</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
                    <div className="py-4"><Label htmlFor="new-folder-name">Folder Name</Label><Input id="new-folder-name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateNewFolder()} /></div>
                    <DialogFooter><Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateNewFolder}>Create</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the folder "{folderToDelete?.name}" and all files inside it. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDeleteFolder} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Dialog open={!!folderToRename} onOpenChange={() => setFolderToRename(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Rename Folder</DialogTitle></DialogHeader>
                    <div className="py-4"><Label htmlFor="rename-folder-name">New Name</Label><Input id="rename-folder-name" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleConfirmRename()} /></div>
                    <DialogFooter><Button variant="ghost" onClick={() => setFolderToRename(null)}>Cancel</Button><Button onClick={handleConfirmRename}>Rename</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
