
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Script from 'next/script';
import {
  Folder,
  Plus,
  LoaderCircle,
  ChevronRight,
  FolderPlus,
  Users,
  UploadCloud,
  FileText,
  Trash2,
  MoreVertical,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import { FileIcon } from './file-icon';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getFolders, addFolder, getFiles, getUploadUrl, addFileRecord, type FolderItem, type FileItem, updateFolder, deleteFolderAndContents, getFileDownloadUrl, getFileContent } from '@/services/file-service';
import { downloadFromGoogleDriveAndUpload, getGoogleAuthUrl } from '@/services/google-service';
import { cn } from '@/lib/utils';
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
import { triggerBrowserDownload } from '@/lib/utils';
import FileEditDialog from './file-edit-dialog';

const GoogleDriveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path d="M7.71 5.42L12 12.25l4.29-6.83a.996.996 0 00-.85-1.42H8.56c-.5 0-.89.37-.85.86z" fill="#34A853"/>
      <path d="M16.29 18.58l4.29-6.83h-8.58L7.71 18.58c.28.45.81.71 1.35.71h5.88c.54 0 1.07-.26 1.35-.71z" fill="#FFC107"/>
      <path d="M3.42 11.75l4.29 6.83 4.29-6.83H3.42z" fill="#4285F4"/>
    </svg>
);

export function FilesView() {
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
    
    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
    const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState("");
    
    const [renamingFolder, setRenamingFolder] = useState<FolderItem | null>(null);
    const [renameInputValue, setRenameInputValue] = useState("");
    const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);

    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const { user } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

    const [isGapiLoaded, setIsGapiLoaded] = useState(false);
    const [isGisLoaded, setIsGisLoaded] = useState(false);
    const gisInited = useRef(false);
    
    const [fileToEdit, setFileToEdit] = useState<FileItem | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);


    const loadData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [fetchedFolders, fetchedFiles] = await Promise.all([
                getFolders(user.uid),
                getFiles(user.uid),
            ]);
            setFolders(fetchedFolders);
            setFiles(fetchedFiles);
            const rootFolder = fetchedFolders.find(f => !f.parentId);
            if (rootFolder) {
                setExpandedFolders(new Set([rootFolder.id]));
            }
        } catch (error: any) {
            console.error("Failed to load file manager data:", error);
            toast({
                variant: "destructive",
                title: "Failed to load data",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handlePickerCallback = useCallback(async (response: any) => {
        if (response.action === google.picker.Action.PICKED && user) {
            const doc = response.docs[0];
            const fileId = doc.id;
            const fileName = doc.name;
            const mimeType = doc.mimeType;
            
            toast({ title: "Importing...", description: `Starting import for "${fileName}" from Google Drive.` });

            try {
                const accessToken = sessionStorage.getItem('google_drive_access_token');
                if (!accessToken) {
                    throw new Error("Google Drive access token not found. Please re-authenticate.");
                }

                const newFile = await downloadFromGoogleDriveAndUpload(
                    fileId,
                    fileName,
                    mimeType,
                    accessToken,
                    user.uid,
                    selectedFolderId,
                );
                
                const newFileWithDate = {
                    ...newFile,
                    modifiedAt: new Date(newFile.modifiedAt),
                };

                setFiles(prev => [...prev, newFileWithDate]);
                toast({ title: "Import Complete", description: `"${fileName}" has been added to your files.` });

            } catch (error: any) {
                console.error("Error during Google Drive import process:", error);
                toast({ variant: 'destructive', title: "Import Failed", description: error.message });
            }
        }
    }, [user, selectedFolderId, toast]);

    const handleGoogleAuthRedirect = useCallback(async (action: 'import' | 'sync') => {
        if (!user) return;
        const state = `${action}_${user.uid}_${Date.now()}`;
        sessionStorage.setItem('google_auth_state', state);
        sessionStorage.setItem('google_auth_redirect', window.location.pathname);
        const { url } = await getGoogleAuthUrl(user.uid, state);
        window.location.href = url;
    }, [user]);

    const handleGoogleImport = useCallback(async () => {
        if (selectedFolderId === 'all') {
            toast({ variant: 'destructive', title: 'Select a Folder', description: 'Please select a specific folder to import files into.' });
            return;
        }
        
        const showPicker = (accessToken: string) => {
             const picker = new google.picker.PickerBuilder()
                .addView(google.picker.ViewId.DOCS)
                .setOAuthToken(accessToken)
                .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_DEVELOPER_KEY!)
                .setCallback(handlePickerCallback)
                .build();
            picker.setVisible(true);
        };

        const existingToken = sessionStorage.getItem('google_drive_access_token');
        if (existingToken) {
            showPicker(existingToken);
        } else {
            handleGoogleAuthRedirect('import');
        }
    }, [selectedFolderId, handlePickerCallback, toast, handleGoogleAuthRedirect]);

    const handleGoogleSyncClick = useCallback(async () => {
        const existingToken = sessionStorage.getItem('google_drive_access_token');
        if (!existingToken) {
            await handleGoogleAuthRedirect('sync');
        } else {
            toast({
                title: "Ready to Sync",
                description: "You are already connected to Google Drive. The next step will perform the sync."
            });
        }
    }, [handleGoogleAuthRedirect, toast]);

    useEffect(() => {
        if (isGapiLoaded && isGisLoaded && !gisInited.current && window.gapi && window.google) {
            gisInited.current = true;
            gapi.load('client:picker', () => {
                gapi.client.init({}).then(() => {
                    gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
                });
            });
        }
    }, [isGapiLoaded, isGisLoaded]);


    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;
        try {
            const newFolder = await addFolder({ 
                name: newFolderName.trim(), 
                parentId: newFolderParentId, 
                userId: user.uid 
            });
            setFolders(prev => [...prev, newFolder]);
            setNewFolderName("");
            setNewFolderParentId(null);
            setIsNewFolderDialogOpen(false);
            toast({ title: "Folder Created" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to create folder", description: error.message });
        }
    };
    
    const selectedFolder = folders.find(f => f.id === selectedFolderId);

    const displayedFiles = useMemo(() => {
        if (selectedFolderId === 'all') return files;
        return files.filter(file => file.folderId === selectedFolderId);
    }, [files, selectedFolderId]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];

        try {
            const { signedUrl, storagePath } = await getUploadUrl({
                fileName: file.name,
                fileType: file.type,
                userId: user.uid,
                folderId: selectedFolderId,
            });

            const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });
            
            if (!uploadResponse.ok) throw new Error('File upload failed.');

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
            toast({ title: "File Uploaded", description: `"${file.name}" has been successfully uploaded.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Upload Failed", description: error.message });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleStartRename = (folder: FolderItem) => {
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
    
    const handleConfirmDelete = async () => {
        if (!user || !folderToDelete) return;

        try {
            await deleteFolderAndContents(user.uid, folderToDelete.id);
            if (selectedFolderId === folderToDelete.id) {
                setSelectedFolderId('all');
            }
            toast({ title: `Folder "${folderToDelete.name}" and all its contents have been deleted.` });
            loadData();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Delete Failed", description: error.message });
        } finally {
            setFolderToDelete(null);
        }
    };
    
    const handleDownloadFile = async (file: FileItem) => {
        try {
            const url = await getFileDownloadUrl(file.storagePath);
            await triggerBrowserDownload(url, file.name);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Download Failed", description: error.message });
        }
    };

    const handleEditFile = async (file: FileItem) => {
        setFileToEdit(file);
        setFileContent(null);
        try {
            const content = await getFileContent(file.storagePath);
            setFileContent(content);
        } catch (error: any) {
            console.error("Failed to load file content:", error);
            toast({ variant: "destructive", title: "Could not load file content", description: error.message });
            setFileToEdit(null);
        }
    };
    
    const FolderTreeItem = ({
      folder,
      allFolders,
      level = 0,
    }: {
      folder: FolderItem;
      allFolders: FolderItem[];
      level?: number;
    }) => {
        const hasChildren = allFolders.some((f) => f.parentId === folder.id);
        const isExpanded = expandedFolders.has(folder.id);
        const isRenaming = renamingFolder?.id === folder.id;

        return (
            <div key={folder.id} className="my-1 rounded-md" style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
                <div
                    className={cn(
                        "flex items-center gap-1 rounded-md pr-1 group",
                        isRenaming ? 'bg-background' : 'hover:bg-accent',
                        selectedFolderId === folder.id && !isRenaming && 'bg-accent'
                    )}
                >
                    <Button variant="ghost" className="flex-1 justify-start gap-2 h-9 p-2 text-left" onClick={() => !isRenaming && setSelectedFolderId(folder.id)}>
                        {hasChildren ? (
                           <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')} onClick={(e) => { e.stopPropagation(); setExpandedFolders(p => { const n = new Set(p); n.has(folder.id) ? n.delete(folder.id) : n.add(folder.id); return n; }); }} />
                        ) : <div className="w-4 h-4 shrink-0" />}
                        <Folder className="h-4 w-4 shrink-0 text-primary" />
                         {isRenaming ? (
                            <Input autoFocus value={renameInputValue} onChange={e => setRenameInputValue(e.target.value)} onBlur={handleConfirmRename} onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') handleCancelRename(); }} className="h-7" onClick={e => e.stopPropagation()} />
                         ) : (
                            <span className="truncate flex-1">{folder.name}</span>
                         )}
                    </Button>
                     {!isRenaming && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                                <DropdownMenuItem onSelect={() => handleStartRename(folder)}><Pencil className="mr-2 h-4 w-4"/>Rename</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onSelect={() => setFolderToDelete(folder)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                {isExpanded && allFolders.filter((f) => f.parentId === folder.id).sort((a,b) => a.name.localeCompare(b.name)).map((childFolder) => (
                    <FolderTreeItem key={childFolder.id} folder={childFolder} allFolders={allFolders} level={level + 1} />
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <Script src="https://apis.google.com/js/api.js" async onLoad={() => setIsGapiLoaded(true)} />
            <Script src="https://accounts.google.com/gsi/client" async onLoad={() => setIsGisLoaded(true)} />
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
                                    <Button variant="ghost" size="icon" onClick={() => { setNewFolderParentId(selectedFolderId !== 'all' ? selectedFolderId : null); setIsNewFolderDialogOpen(true); }} title="New Folder">
                                        <FolderPlus className="h-5 w-5" />
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1 p-2">
                                    <Button variant={selectedFolderId === 'all' ? "secondary" : "ghost"} className="w-full justify-start gap-3 my-1" onClick={() => setSelectedFolderId('all')}>
                                        <Users className="h-4 w-4" /> <span>All Files</span>
                                    </Button>
                                    <Separator className="my-2"/>
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
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedFolderId === 'all' ? 'All Files' : selectedFolder?.name}</h2>
                                        <p className="text-sm text-muted-foreground">{displayedFiles.length} item(s)</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={handleGoogleSyncClick} disabled={!isGapiLoaded || !isGisLoaded}>
                                            <RefreshCw className="mr-2 h-4 w-4" /> Sync with Google Drive
                                        </Button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                        <Button variant="outline" onClick={handleUploadClick} disabled={selectedFolderId === 'all'}>
                                            <UploadCloud className="mr-2 h-4 w-4" /> Upload from Computer
                                        </Button>
                                        <Button variant="outline" onClick={handleGoogleImport} disabled={!isGapiLoaded || !isGisLoaded || selectedFolderId === 'all'}>
                                            <GoogleDriveIcon className="mr-2 h-4 w-4" /> Import from Google Drive
                                        </Button>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[50px]"><Checkbox /></TableHead>
                                          <TableHead>Name</TableHead>
                                          <TableHead>Type</TableHead>
                                          <TableHead>Size</TableHead>
                                          <TableHead>Modified</TableHead>
                                          <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {displayedFiles.map(file => (
                                            <TableRow key={file.id}>
                                                <TableCell><Checkbox /></TableCell>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <FileIcon fileType={file.type} />
                                                    {file.name}
                                                </TableCell>
                                                <TableCell>{file.type}</TableCell>
                                                <TableCell>{(file.size / 1024).toFixed(2)} KB</TableCell>
                                                <TableCell>{format(file.modifiedAt, 'PPp')}</TableCell>
                                                <TableCell>
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleDownloadFile(file)}>Download</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEditFile(file)} disabled={!file.type.startsWith('text/')}>Edit</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                     </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
                
                <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Folder</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="folder-name">Name</Label>
                            <Input id="folder-name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateFolder}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the "{folderToDelete?.name}" folder and all its contents (including subfolders). This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                {fileToEdit && (
                    <FileEditDialog
                        isOpen={!!fileToEdit}
                        onOpenChange={(open) => { if (!open) setFileToEdit(null); }}
                        file={fileToEdit}
                        initialContent={fileContent}
                    />
                )}
            </div>
        </>
    );
}
