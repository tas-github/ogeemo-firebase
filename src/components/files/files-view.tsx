
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Script from 'next/script';
import { useDrag, useDrop } from 'react-dnd';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  Users,
  LoaderCircle,
  ChevronRight,
  FolderPlus,
  BookOpen,
  Upload,
  Download,
  FilePenLine,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import { type FileItem, type FolderItem } from '@/data/files';
import { useToast } from '@/hooks/use-toast';
import { 
    getFolders, 
    addFolder, 
    updateFolder, 
    deleteFolderAndContents,
    getUploadUrl,
    addFileRecord,
    deleteFiles,
    getFileDownloadUrl,
    getFileContent,
    getFiles,
} from '@/services/file-service';
import { getGoogleAuthUrl, downloadFromGoogleDriveAndUpload, syncGoogleDriveFolder } from '@/services/google-service';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
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
import { FileIcon } from './file-icon';
import FileEditDialog from './file-edit-dialog';
import { moveFile } from '@/app/actions/file-actions';

const ItemTypes = {
  FILE: 'file',
  FOLDER: 'folder',
};

type DroppableItem = (FileItem & { type?: 'file' }) | (FolderItem & { type: 'folder' });

const GOOGLE_DRIVE_FOLDER_ID = 'root';

export function FilesView() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('all');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  
  const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isGisLoaded, setIsGisLoaded] = useState(false);
  const [isPickerApiLoaded, setIsPickerApiLoaded] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [fileToEdit, setFileToEdit] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);


  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInitialData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [fetchedFolders, allFiles] = await Promise.all([
        getFolders(user.uid),
        getFiles(user.uid)
      ]);
      setFolders(fetchedFolders);
      setFiles(allFiles);
      if (fetchedFolders.length > 0) {
        const rootFolder = fetchedFolders.find(f => !f.parentId);
        if(rootFolder) {
          setExpandedFolders(new Set([rootFolder.id]));
        }
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to load data", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  const selectedFolder = useMemo(
    () => folders.find((f) => f && f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  const displayedFiles = useMemo(() => {
    if (selectedFolderId === 'all' || !selectedFolderId) {
        return files;
    }
    const getDescendantFolderIds = (folderId: string): string[] => {
        let ids = [folderId];
        const children = folders.filter(f => f.parentId === folderId);
        children.forEach(child => {
            ids = [...ids, ...getDescendantFolderIds(child.id)];
        });
        return ids;
    };
    const folderIdsToDisplay = getDescendantFolderIds(selectedFolderId);
    return files.filter(f => folderIdsToDisplay.includes(f.folderId));
  }, [files, folders, selectedFolderId]);
  
  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    try {
      const newFolder = await addFolder({ name: newFolderName, userId: user.uid, parentId: newFolderParentId });
      setFolders(prev => [...prev, newFolder]);
      toast({ title: "Folder Created" });
      if(newFolder.parentId) {
          setExpandedFolders(prev => new Set(prev).add(newFolder.parentId!));
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setIsNewFolderDialogOpen(false);
      setNewFolderName("");
      setNewFolderParentId(null);
    }
  };
  
  const handleStartRename = (folder: FolderItem) => {
    setRenamingFolder(folder);
    setRenameInputValue(folder.name);
  };

  const handleConfirmRename = async () => {
    if (!renamingFolder || !renameInputValue.trim() || renamingFolder.name === renameInputValue.trim()) {
      setRenamingFolder(null);
      return;
    }
    try {
      await updateFolder(renamingFolder.id, { name: renameInputValue.trim() });
      setFolders(prev => prev.map(f => f.id === renamingFolder.id ? { ...f, name: renameInputValue.trim() } : f));
      toast({ title: "Folder Renamed" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Rename Failed", description: error.message });
    } finally {
      setRenamingFolder(null);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!user || !folderToDelete) return;
    try {
        await deleteFolderAndContents(user.uid, folderToDelete.id);
        toast({ title: `Folder "${folderToDelete.name}" deleted` });
        loadInitialData(); // Reload everything
    } catch(e: any) {
        toast({ variant: "destructive", title: "Delete Failed", description: e.message });
    } finally {
        setFolderToDelete(null);
    }
  };

  const handleFileDropOnFolder = async (item: DroppableItem, folderId: string) => {
    if (item.type === ItemTypes.FILE || !item.type) {
      const file = item as FileItem;
      if (file.folderId === folderId) return;
      try {
        const result = await moveFile(file.id, folderId);
        if (result.success) {
            setFiles(prev => prev.map(f => 
                f.id === file.id ? { ...f, folderId: folderId } : f
            ));
          const folder = folders.find(f => f.id === folderId);
          toast({ title: "File Moved", description: `"${file.name}" moved to "${folder?.name}".` });
        } else {
          throw new Error(result.error);
        }
      } catch(e: any) {
        toast({ variant: "destructive", title: "Move Failed", description: e.message });
      }
    } else if (item.type === ItemTypes.FOLDER) {
        const folder = item as FolderItem;
        if (folder.id === folderId || folder.parentId === folderId) return;
        try {
            await updateFolder(folder.id, { parentId: folderId });
            setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, parentId: folderId } : f));
            toast({ title: "Folder Moved" });
        } catch(e: any) {
             toast({ variant: "destructive", title: "Move Failed", description: e.message });
        }
    }
  };

  const FolderTreeItem = ({ folder, allFolders, level = 0 }: { folder: FolderItem, allFolders: FolderItem[], level?: number }) => {
    const hasChildren = allFolders.some(f => f.parentId === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const isRenaming = renamingFolder?.id === folder.id;

    const [{ canDrop, isOver }, drop] = useDrop(() => ({
      accept: [ItemTypes.FILE, ItemTypes.FOLDER],
      drop: (item: DroppableItem) => handleFileDropOnFolder(item, folder.id),
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
    }));

    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.FOLDER,
      item: { ...folder, type: ItemTypes.FOLDER },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }));
    
    return (
      <div ref={drag} style={{ marginLeft: level > 0 ? '1rem' : '0', opacity: isDragging ? 0.5 : 1 }}>
        <div 
            ref={drop} 
            className={cn(
                "flex items-center gap-1 rounded-md pr-1 group",
                !isRenaming && 'hover:bg-accent',
                (isOver && canDrop) && 'bg-primary/20 ring-1 ring-primary',
                selectedFolderId === folder.id && !isRenaming && 'bg-accent'
            )}
        >
          <Button
            variant="ghost"
            className="flex-1 justify-start gap-2 h-9 p-2 text-left min-w-0"
            onClick={() => { if (!isRenaming) setSelectedFolderId(folder.id) }}
          >
            {hasChildren ? (
              <ChevronRight 
                className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')} 
                onClick={(e) => { e.stopPropagation(); setExpandedFolders(p => { const n = new Set(p); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; }); }} 
              />
            ) : (
              <div className="w-4 h-4" />
            )}
            <Folder className={cn('h-4 w-4', folder.parentId ? 'text-green-500' : 'text-blue-500')} />
            {isRenaming ? (
              <Input autoFocus value={renameInputValue} onChange={e => setRenameInputValue(e.target.value)} onBlur={handleConfirmRename} onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(); }} className="h-7" onClick={e => e.stopPropagation()} />
            ) : (
              <span className="truncate flex-1">{folder.name}</span>
            )}
          </Button>
          {!isRenaming && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => { setNewFolderParentId(folder.id); setIsNewFolderDialogOpen(true); }}><FolderPlus className="mr-2 h-4 w-4" />New Subfolder</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleStartRename(folder)}><Pencil className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setFolderToDelete(folder)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {isExpanded && allFolders.filter(f => f.parentId === folder.id).sort((a,b) => a.name.localeCompare(b.name)).map(child => (
          <FolderTreeItem key={child.id} folder={child} allFolders={allFolders} level={level + 1} />
        ))}
      </div>
    );
  };
  
  const DraggableTableRow = ({ file, children }: { file: FileItem, children: React.ReactNode }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.FILE,
        item: { ...file, type: ItemTypes.FILE },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }));
    return (
      <TableRow ref={drag} className={cn(isDragging && "opacity-50")}>
        {children}
      </TableRow>
    );
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !user || !selectedFolderId || selectedFolderId === 'all') {
        toast({ variant: 'destructive', title: 'Upload failed', description: 'Please select a specific folder before uploading.' });
        return;
      }
      
      setIsUploading(true);
      const filesToUpload = Array.from(e.target.files);

      for (const file of filesToUpload) {
          try {
              const { signedUrl, storagePath } = await getUploadUrl({
                  fileName: file.name,
                  fileType: file.type,
                  userId: user.uid,
                  folderId: selectedFolderId,
              });

              await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type }});

              const newFileRecord = await addFileRecord({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  modifiedAt: new Date(),
                  folderId: selectedFolderId,
                  userId: user.uid,
                  storagePath,
              });
              setFiles(prev => [...prev, newFileRecord]);
          } catch(err: any) {
              toast({ variant: 'destructive', title: `Upload failed for ${file.name}`, description: err.message });
          }
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleDeleteSelected = async () => {
    if (selectedFileIds.length === 0) return;
    try {
        await deleteFiles(selectedFileIds);
        setFiles(prev => prev.filter(f => !selectedFileIds.includes(f.id)));
        setSelectedFileIds([]);
        toast({ title: 'Files Deleted' });
    } catch(err: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
    }
  };
  
  const handleDownloadFile = async (file: FileItem) => {
    try {
        const url = await getFileDownloadUrl(file.storagePath);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch(err: any) {
        toast({ variant: 'destructive', title: 'Download Failed', description: err.message });
    }
  };
  
  const handleOpenFileEditor = async (file: FileItem) => {
    if (!file.type.startsWith('text/')) {
        toast({ variant: 'destructive', title: 'Cannot Edit', description: 'Only plain text files can be edited in the browser.' });
        return;
    }
    setFileToEdit(file);
    setFileContent(null);
    try {
        const content = await getFileContent(file.storagePath);
        setFileContent(content);
    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Failed to load content', description: err.message });
        setFileToEdit(null);
    }
  }

  const handleGoogleDriveSync = async () => {
    if (!googleAccessToken) {
        toast({ title: "Connecting...", description: "Please authorize with Google first." });
        return;
    }
    setIsSyncing(true);
    try {
        const result = await syncGoogleDriveFolder(googleAccessToken, user!.uid);
        toast({
            title: "Sync Complete",
            description: `${result.syncedFiles} new files synced from a total of ${result.totalFiles} in the source folder.`
        });
        await loadInitialData();
    } catch(error: any) {
        toast({ variant: "destructive", title: "Sync Failed", description: error.message });
    } finally {
        setIsSyncing(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
      if (!user) return;
      const state = `uid_${user.uid}_ts_${Date.now()}`;
      sessionStorage.setItem('google_auth_state', state);
      sessionStorage.setItem('google_auth_redirect', '/files'); // Redirect back here
      try {
          const { url } = await getGoogleAuthUrl(user.uid, state);
          window.location.href = url;
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Failed to get auth URL', description: error.message });
      }
  };
  
  const allVisibleSelected = displayedFiles.length > 0 && selectedFileIds.length === displayedFiles.length;
  
  if (isLoading) return <div className="flex h-full w-full items-center justify-center p-4"><LoaderCircle className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <>
      <Script src="https://apis.google.com/js/api.js" async onLoad={() => setIsGapiLoaded(true)} />
      <Script src="https://accounts.google.com/gsi/client" async onLoad={() => setIsGisLoaded(true)} />
      <div className="flex flex-col h-full p-4 sm:p-6">
        <header className="text-center pb-4"><h1 className="text-3xl font-bold font-headline text-primary">File Manager</h1><p className="text-muted-foreground">Organize your project and client documents.</p></header>
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="flex h-full flex-col">
                <div className="p-2 border-b"><Button className="w-full" onClick={() => { setNewFolderParentId(null); setIsNewFolderDialogOpen(true); }}><FolderPlus className="mr-2 h-4 w-4" /> New Folder</Button></div>
                <ScrollArea className="flex-1 p-2">
                    <Button
                        variant={selectedFolderId === 'all' ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 my-1"
                        onClick={() => setSelectedFolderId('all')}
                    >
                        <Users className="h-4 w-4" /> <span>All Files</span>
                    </Button>
                    {folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)).map(folder => (
                        <FolderTreeItem key={folder.id} folder={folder} allFolders={folders} />
                    ))}
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b h-20">
                  <div>
                    <h2 className="text-xl font-bold">{selectedFolder?.name || 'All Files'}</h2>
                    <p className="text-sm text-muted-foreground">{displayedFiles.length} item(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedFileIds.length > 0 && <Button variant="destructive" size="sm" onClick={handleDeleteSelected}><Trash2 className="mr-2 h-4 w-4" /> Delete Selected</Button>}
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={!selectedFolderId || isUploading || selectedFolderId === 'all'}>
                      {isUploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple disabled={!selectedFolderId || isUploading} />
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><img src="/google-drive-icon.png" alt="Google Drive" className="mr-2 h-4 w-4" /> Google Drive</Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {!googleAccessToken && <DropdownMenuItem onSelect={handleGoogleSignIn}>Connect to Google Drive</DropdownMenuItem>}
                        {googleAccessToken && (
                            <>
                            <DropdownMenuItem onSelect={() => alert('Picker not implemented yet')}>Import from Drive</DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleGoogleDriveSync} disabled={isSyncing}>
                                {isSyncing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                                Sync from "1Ogeemo" Folder
                            </DropdownMenuItem>
                            </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-12"><Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => setSelectedFileIds(checked ? displayedFiles.map(f => f.id) : [])} /></TableHead><TableHead>Name</TableHead><TableHead>Modified</TableHead><TableHead className="w-10"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                    <TableBody>
                        {displayedFiles.map(file => (
                          <DraggableTableRow key={file.id} file={file}>
                            <TableCell><Checkbox checked={selectedFileIds.includes(file.id)} onCheckedChange={() => setSelectedFileIds(prev => prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id])} /></TableCell>
                            <TableCell className="font-medium flex items-center gap-2"><FileIcon fileType={file.type} />{file.name}</TableCell>
                            <TableCell>{file.modifiedAt.toLocaleDateString()}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => handleDownloadFile(file)}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleOpenFileEditor(file)}><FilePenLine className="mr-2 h-4 w-4" />Edit (Text only)</DropdownMenuItem>
                                        {file.webViewLink && <DropdownMenuItem onSelect={() => window.open(file.webViewLink, '_blank')}><ExternalLink className="mr-2 h-4 w-4" />Open in Google Drive</DropdownMenuItem>}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => deleteFiles([file.id]).then(() => { setFiles(prev => prev.filter(f => f.id !== file.id)); toast({title: "File Deleted"}); })} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                          </DraggableTableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
      
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-name-new">Name</Label>
              <Input id="folder-name-new" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder() }} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateFolder}>Create</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{folderToDelete?.name}" and all its contents (including subfolders and files). This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FileEditDialog isOpen={!!fileToEdit} onOpenChange={() => setFileToEdit(null)} file={fileToEdit} initialContent={fileContent} />
    </>
  );
}
