
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  Folder,
  Plus,
  MoreVertical,
  Trash2,
  Pencil,
  LoaderCircle,
  ChevronRight,
  FolderPlus,
  UploadCloud,
  Download,
  BookOpen,
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
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
    getFolders,
    getFilesForFolder,
    addFolder,
    updateFolder,
    deleteFolderAndContents,
    addFile,
    updateFile,
    deleteFiles,
    getFileDownloadUrl,
    type FolderItem,
    type FileItem,
} from '@/services/file-service';
import { cn, triggerBrowserDownload } from '@/lib/utils';
import { FileIcon } from './file-icon';
import { format } from 'date-fns';

const ItemTypes = {
  FILE: 'file',
  FOLDER: 'folder',
};

const DraggableTableRow = ({ file, children }: { file: FileItem, children: React.ReactNode }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.FILE,
        item: file,
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }));
    return (
      <TableRow ref={drag} className={cn(isDragging && "opacity-50")}>
        {children}
      </TableRow>
    );
};

export function FilesView() {
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
    const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState("");
    
    const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
    const [renameInputValue, setRenameInputValue] = useState("");
    const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);

    const { toast } = useToast();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const loadData = useCallback(async (selectFolderId: string | null = null) => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const fetchedFolders = await getFolders(user.uid);
            setFolders(fetchedFolders);
            const rootFolders = fetchedFolders.filter(f => !f.parentId);
            if (rootFolders.length > 0) {
              setExpandedFolders(prev => new Set([...prev, ...rootFolders.map(f => f.id)]));
            }

            const folderToLoad = selectFolderId || selectedFolderId || (fetchedFolders.length > 0 ? fetchedFolders[0].id : null);
            setSelectedFolderId(folderToLoad);
            
            if (folderToLoad) {
                const fetchedFiles = await getFilesForFolder(user.uid, folderToLoad);
                setFiles(fetchedFiles);
            } else {
                setFiles([]);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to load data", description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast, selectedFolderId]);

    useEffect(() => {
        if(user) {
            loadData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); 

    useEffect(() => {
        async function loadFiles() {
            if (user && selectedFolderId) {
                setIsLoading(true);
                const fetchedFiles = await getFilesForFolder(user.uid, selectedFolderId);
                setFiles(fetchedFiles);
                setSelectedFileIds([]);
                setIsLoading(false);
            } else if (!selectedFolderId) {
                setFiles([]);
            }
        }
        loadFiles();
    }, [user, selectedFolderId]);

    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;
        try {
            const newFolder = await addFolder({ name: newFolderName, parentId: newFolderParentId, userId: user.uid });
            setFolders(prev => [...prev, newFolder]);
            if(newFolder.parentId) {
                setExpandedFolders(p => new Set(p).add(newFolder.parentId!));
            }
            toast({ title: "Folder Created" });
        } catch(e: any) { toast({ variant: "destructive", title: "Failed", description: e.message }); }
        finally { setIsNewFolderDialogOpen(false); setNewFolderName(""); }
    };
    
    const handleStartRename = (folder: FolderItem | null) => {
        if (!folder) return;
        setRenamingFolder(folder);
        setRenameInputValue(folder.name);
    };

    const handleCancelRename = () => {
        setRenamingFolder(null);
        setRenameInputValue("");
    };

    const handleConfirmRename = async () => {
        if (!renamingFolder || !renameInputValue.trim() || renamingFolder.name === renameInputValue.trim()) {
            handleCancelRename();
            return;
        }
        try {
            await updateFolder(renamingFolder.id, { name: renameInputValue.trim() });
            setFolders(prev => prev.map(f => f.id === renamingFolder.id ? { ...f, name: renameInputValue.trim() } : f));
            toast({ title: "Folder Renamed" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Rename Failed", description: error.message });
        } finally {
            handleCancelRename();
        }
    };

    const handleConfirmDeleteFolder = async () => {
        if (!user || !folderToDelete) return;
        try {
            await deleteFolderAndContents(user.uid, folderToDelete.id);
            toast({ title: "Folder Deleted" });
            loadData(null);
        } catch (e: any) { toast({ variant: 'destructive', title: "Delete Failed", description: e.message }); }
        finally { setFolderToDelete(null); }
    };
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !selectedFolderId || !e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        toast({ title: 'Uploading...', description: file.name });

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.uid);
            formData.append('folderId', selectedFolderId);

            await addFile(formData);

            toast({ title: 'Upload successful', description: `${file.name} has been uploaded.` });
            const fetchedFiles = await getFilesForFolder(user.uid, selectedFolderId);
            setFiles(fetchedFiles);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    
    const handleDeleteSelectedFiles = async () => {
        if (!user || selectedFileIds.length === 0) return;
        try {
            await deleteFiles(selectedFileIds);
            setFiles(files.filter(f => !selectedFileIds.includes(f.id)));
            setSelectedFileIds([]);
            toast({ title: `${selectedFileIds.length} file(s) deleted.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
        }
    };
    
    const handleDownloadSelectedFiles = async () => {
        if(selectedFileIds.length === 0) return;
        toast({ title: `Preparing ${selectedFileIds.length} download(s)...`});
        for (const fileId of selectedFileIds) {
            const fileToDownload = files.find(f => f.id === fileId);
            if(fileToDownload) {
                try {
                    const url = await getFileDownloadUrl(fileToDownload.storagePath);
                    await triggerBrowserDownload(url, fileToDownload.name);
                } catch (error: any) {
                    toast({ variant: 'destructive', title: `Download Failed for ${fileToDownload.name}`, description: error.message });
                }
            }
        }
    };
    
    const handleOpenFile = async (file: FileItem) => {
        if (file.webViewLink) {
            window.open(file.webViewLink, '_blank');
        } else {
            try {
                toast({ title: 'Preparing download...' });
                const url = await getFileDownloadUrl(file.storagePath);
                await triggerBrowserDownload(url, file.name);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Download Failed', description: error.message });
            }
        }
    };

    const handleFileDrop = async (file: FileItem, newFolderId: string) => {
        if (file.folderId === newFolderId) return;
        try {
            await updateFile(file.id, { folderId: newFolderId });
            setFiles(prev => prev.filter(f => f.id !== file.id));
            toast({ title: "File Moved" });
        } catch (error: any) { toast({ variant: "destructive", title: "Move Failed", description: error.message }); }
    };
    
    const handleFolderDrop = async (folder: FolderItem, newParentId: string | null) => {
        if (folder.parentId === newParentId) return;
        try {
            await updateFolder(folder.id, { parentId: newParentId });
            setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, parentId: newParentId } : f));
            toast({ title: "Folder Moved" });
        } catch (error: any) { toast({ variant: "destructive", title: "Move Failed", description: error.message }); }
    };
    
    const allVisibleSelected = files.length > 0 && selectedFileIds.length === files.length;

    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    
    const FolderTreeItem = ({
      folder,
      allFolders,
      level = 0,
    }: {
      folder: FolderItem;
      allFolders: FolderItem[];
      level?: number;
    }) => {
        const hasChildren = allFolders.some((f: FolderItem) => f.parentId === folder.id);
        const isExpanded = expandedFolders.has(folder.id);
        const isRenaming = renamingFolder?.id === folder.id;

        const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
            type: ItemTypes.FOLDER,
            item: folder,
            collect: (monitor) => ({ isDragging: monitor.isDragging() }),
        }));

        const [{ canDrop, isOver }, drop] = useDrop(() => ({
            accept: [ItemTypes.FILE, ItemTypes.FOLDER],
            drop: (item: any) => {
                if (item.id === folder.id) return;
                
                if (item.type === ItemTypes.FOLDER) {
                    handleFolderDrop(item, folder.id);
                } else {
                    handleFileDrop(item, folder.id);
                }
            },
            collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
        }));
        
        return (
            <div key={folder.id} className="my-1 rounded-md" style={{ marginLeft: level > 0 ? '1rem' : '0' }} ref={dragPreview}>
                <div
                    ref={node => drag(drop(node))}
                    className={cn(
                        "flex items-center gap-1 rounded-md pr-1 group",
                        !isRenaming && "hover:bg-accent",
                        (isOver && canDrop) && 'bg-primary/20 ring-1 ring-primary',
                        isDragging && 'opacity-50',
                        selectedFolderId === folder.id && !isRenaming && "bg-accent"
                    )}
                >
                    <Button variant="ghost" className="flex-1 justify-start gap-2 h-9 p-2 text-left" onClick={() => !isRenaming && setSelectedFolderId(folder.id)}>
                        {hasChildren ? (
                           <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')} onClick={(e) => { e.stopPropagation(); setExpandedFolders((p: Set<string>) => { const n = new Set(p); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; }); }} />
                        ) : <div className="w-4 h-4 shrink-0" />}
                        <Folder className="h-4 w-4 shrink-0 text-primary" />
                        {isRenaming ? (
                            <Input
                                autoFocus
                                value={renameInputValue}
                                onChange={e => setRenameInputValue(e.target.value)}
                                onBlur={handleConfirmRename}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleConfirmRename();
                                    if (e.key === 'Escape') handleCancelRename();
                                }}
                                className="h-7"
                                onClick={e => e.stopPropagation()}
                            />
                        ) : (
                            <span className="truncate flex-1">{folder.name}</span>
                        )}
                    </Button>
                </div>
                {isExpanded && allFolders.filter((f: FolderItem) => f.parentId === folder.id).sort((a: FolderItem, b: FolderItem) => a.name.localeCompare(b.name)).map((childFolder: FolderItem) => (
                    <FolderTreeItem key={childFolder.id} folder={childFolder} allFolders={allFolders} level={level + 1} />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full p-4 sm:p-6">
            <header className="text-center pb-4">
                <h1 className="text-3xl font-bold font-headline text-primary">File Manager</h1>
                <p className="text-muted-foreground">Organize your project and client documents.</p>
            </header>
            <div className="flex-1 min-h-0">
                <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
                    <ResizablePanel defaultSize={25} minSize={20}>
                        <div className="flex h-full flex-col">
                            <div className="flex items-center justify-between p-2 border-b h-[57px]">
                                <h3 className="text-lg font-semibold px-2">Folders</h3>
                                <Button variant="ghost" size="icon" onClick={() => { setNewFolderParentId(null); setIsNewFolderDialogOpen(true); }} title="New Root Folder"><FolderPlus className="h-5 w-5" /></Button>
                            </div>
                            <ScrollArea className="flex-1 p-2">
                                {folders.filter(f => !f.parentId).sort((a,b) => a.name.localeCompare(b.name)).map(folder => (
                                    <FolderTreeItem key={folder.id} folder={folder} allFolders={folders} level={0} />
                                ))}
                            </ScrollArea>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={75}>
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-4 border-b h-20">
                                {selectedFileIds.length > 0 ? (
                                    <>
                                        <h2 className="text-xl font-bold">{selectedFileIds.length} selected</h2>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" onClick={handleDownloadSelectedFiles}><Download className="mr-2 h-4 w-4" /> Download</Button>
                                            <Button variant="destructive" onClick={handleDeleteSelectedFiles}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <h2 className="text-xl font-bold">{selectedFolder?.name}</h2>
                                            <p className="text-sm text-muted-foreground">{files.length} item(s)</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" onClick={() => { setNewFolderParentId(selectedFolderId); setIsNewFolderDialogOpen(true); }} disabled={!selectedFolderId}>
                                                <FolderPlus className="mr-2 h-4 w-4" /> Create Subfolder
                                            </Button>
                                            <Button variant="outline" onClick={() => handleStartRename(selectedFolder || null)} disabled={!selectedFolderId}>
                                                <Pencil className="mr-2 h-4 w-4" /> Rename Folder
                                            </Button>
                                             <Button variant="destructive" onClick={() => setFolderToDelete(selectedFolder || null)} disabled={!selectedFolderId}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Folder
                                            </Button>
                                            <Button onClick={() => fileInputRef.current?.click()} disabled={!selectedFolderId}><UploadCloud className="mr-2 h-4 w-4" /> Upload File</Button>
                                            <Input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                        </div>
                                    </>
                                )}
                            </div>
                            <ScrollArea className="flex-1">
                                <Table>
                                    <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={allVisibleSelected} onCheckedChange={() => setSelectedFileIds(allVisibleSelected ? [] : files.map(f => f.id))} /></TableHead><TableHead>Name</TableHead><TableHead>Size</TableHead><TableHead>Modified</TableHead><TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {isLoading ? <TableRow><TableCell colSpan={5} className="h-24 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
                                            : files.map((file) => (
                                            <DraggableTableRow key={file.id} file={file}>
                                                <TableCell><Checkbox checked={selectedFileIds.includes(file.id)} onCheckedChange={() => setSelectedFileIds(p => p.includes(file.id) ? p.filter(id => id !== file.id) : [...p, file.id])} /></TableCell>
                                                <TableCell className="font-medium flex items-center gap-2"><FileIcon fileType={file.type} /> {file.name}</TableCell>
                                                <TableCell>{(file.size / 1024).toFixed(2)} KB</TableCell>
                                                <TableCell>{format(new Date(file.modifiedAt), 'PPp')}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => handleOpenFile(file)}>
                                                                <BookOpen className="mr-2 h-4 w-4" /> Open
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => { /* Placeholder for edit */ }}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => { /* Placeholder for rename */ }}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Rename
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive" onSelect={async () => {
                                                                if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
                                                                    await deleteFiles([file.id]);
                                                                    setFiles(prev => prev.filter(f => f.id !== file.id));
                                                                    toast({ title: "File Deleted" });
                                                                }
                                                            }}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
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

            <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader><div className="py-4"><Label htmlFor="folder-name">Name</Label><Input id="folder-name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} /></div><DialogFooter><Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateFolder}>Create</Button></DialogFooter></DialogContent>
            </Dialog>
            <Dialog open={folderToDelete !== null} onOpenChange={() => setFolderToDelete(null)}>
                <DialogContent><DialogHeader><DialogTitle>Delete Folder</DialogTitle><DialogDescription>Are you sure? Deleting "{folderToDelete?.name}" will also delete all its subfolders and files.</DialogDescription></DialogHeader><DialogFooter><Button variant="ghost" onClick={() => setFolderToDelete(null)}>Cancel</Button><Button variant="destructive" onClick={handleConfirmDeleteFolder}>Delete</Button></DialogFooter></DialogContent>
            </Dialog>
        </div>
    );
}
