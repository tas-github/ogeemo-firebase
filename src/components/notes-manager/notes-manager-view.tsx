
'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, ChevronRight, Folder as FolderIcon, Plus, Pencil, Trash2, File as FileIcon, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

interface File {
  id: string;
  name: string;
  folderId: string;
}

const initialFolders: Folder[] = [
    { id: '1', name: 'Client Notes', parentId: null },
    { id: '2', name: 'Project Alpha', parentId: '1' },
    { id: '3', name: 'Meeting Minutes', parentId: '2' },
    { id: '4', name: 'Personal', parentId: null },
];

const initialFiles: File[] = [
    { id: 'f1', name: 'Initial Client Call.txt', folderId: '2' },
    { id: 'f2', name: 'Requirements.docx', folderId: '2' },
    { id: 'f3', name: 'June 15 Meeting Notes.md', folderId: '3' },
    { id: 'f4', name: 'Grocery List.txt', folderId: '4' },
];

const SubfolderDialog = ({ folder, onSubfolderCreate }: { folder: Folder, onSubfolderCreate: (parentId: string, name: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newSubFolderName, setNewSubFolderName] = useState('');

    const handleCreate = () => {
        if (!newSubFolderName.trim()) return;
        onSubfolderCreate(folder.id, newSubFolderName);
        setIsOpen(false);
        setNewSubFolderName('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="mr-2 h-4 w-4" />Create Subfolder
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Subfolder in "{folder.name}"</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor={`folder-name-${folder.id}`}>Folder Name</Label>
                    <Input
                        id={`folder-name-${folder.id}`}
                        value={newSubFolderName}
                        onChange={(e) => setNewSubFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function NotesManagerView() {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');


  const handleCreateSubfolder = (parentId: string | null, name: string) => {
    if (!name.trim()) return;
    const newFolder: Folder = {
      id: String(Date.now()),
      name: name,
      parentId,
    };
    setFolders(prev => [...prev, newFolder]);
    if (parentId) {
        setExpandedFolders(prev => new Set(prev).add(parentId));
    }
  };
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(folderId)) {
            newSet.delete(folderId);
        } else {
            newSet.add(folderId);
        }
        return newSet;
    });
  };

  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedFile(null); // Deselect file when folder changes
  }
  
  const handleSelectFile = (file: File) => {
    setSelectedFile(file);
  }

  const handleCreateFile = () => {
    if (!newFileName.trim() || !selectedFolderId || selectedFolderId === 'all') {
        // Maybe show a toast error
        return;
    }
    const newFile: File = {
        id: String(Date.now()),
        name: newFileName,
        folderId: selectedFolderId,
    };
    setFiles(prev => [...prev, newFile]);
    setIsNewFileDialogOpen(false);
    setNewFileName('');
  };

  const selectedFolder = selectedFolderId ? folders.find(f => f.id === selectedFolderId) : null;
  const filesInSelectedFolder = selectedFolderId === 'all'
    ? files
    : selectedFolder
    ? files.filter(f => f.folderId === selectedFolder.id)
    : [];

  const FolderTree = ({ parentId }: { parentId: string | null }) => {
    const childFolders = folders.filter(f => f.parentId === parentId);

    return (
      <div style={{ marginLeft: parentId ? '20px' : '0px' }} className="space-y-1">
        {childFolders.map(folder => {
            const hasChildren = folders.some(f => f.parentId === folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            return (
                <div key={folder.id}>
                    <div className={cn("flex items-center justify-between border rounded-md group", selectedFolderId === folder.id ? "bg-accent" : "")}>
                        <div className="flex items-center gap-1 p-0 flex-1 cursor-pointer" onClick={() => handleSelectFolder(folder.id)}>
                           {hasChildren ? (
                                <ChevronRight
                                    className={cn("h-4 w-4 cursor-pointer transition-transform", isExpanded && "rotate-90")}
                                    onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
                                />
                           ): <div className="w-4 h-4" /> }
                           <FolderIcon className="h-4 w-4 text-muted-foreground" />
                           <span className="text-sm p-1">{folder.name}</span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <SubfolderDialog folder={folder} onSubfolderCreate={handleCreateSubfolder} />
                                <DropdownMenuItem>
                                    <Pencil className="mr-2 h-4 w-4" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {isExpanded && <FolderTree parentId={folder.id} />}
                </div>
            )
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full p-4 sm:p-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">Notes Manager</h1>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border rounded-lg h-6 flex items-center justify-center font-semibold">Folder Name</div>
        <div className="border rounded-lg h-6 flex items-center justify-center font-semibold relative">
            File Name
            <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 absolute right-0" disabled={!selectedFolderId || selectedFolderId === 'all'}>
                        <Plus className="h-4 w-4"/>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New File in "{selectedFolder?.name}"</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="file-name">File Name</Label>
                        <Input
                            id="file-name"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNewFileDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateFile}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="border rounded-lg h-6 flex items-center justify-center font-semibold">Preview</div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border rounded-lg h-6 flex items-center justify-center text-sm">{selectedFolderId === 'all' ? 'All Files' : (selectedFolder?.name || 'No folder selected')}</div>
        <div className="border rounded-lg h-6 flex items-center justify-center text-sm">{selectedFile ? selectedFile.name : 'Select file'}</div>
        <div className="border rounded-lg h-6"></div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        <Card className="flex flex-col">
            <CardContent className="p-4 space-y-1">
                <Button 
                    variant={selectedFolderId === 'all' ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-9"
                    onClick={() => handleSelectFolder('all')}
                >
                    <Users className="h-4 w-4" /> <span>All Files</span>
                </Button>
                <FolderTree parentId={null} />
            </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardContent className="p-4 pt-4 space-y-1">
            {selectedFolderId ? (
                filesInSelectedFolder.length > 0 ? (
                    filesInSelectedFolder.map(file => (
                        <div key={file.id} className={cn("flex items-center justify-between border rounded-md group", selectedFile?.id === file.id ? "bg-accent" : "")}>
                            <div className="flex items-center gap-1 p-1 flex-1 cursor-pointer" onClick={() => handleSelectFile(file)}>
                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Pencil className="mr-2 h-4 w-4" />Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-muted-foreground text-center pt-4">No files in this folder.</p>
                )
            ) : (
                <p className="text-xs text-muted-foreground text-center pt-4">Select a folder to view files.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-4">
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
