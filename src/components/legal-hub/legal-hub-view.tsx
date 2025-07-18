
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Folder,
  LoaderCircle,
  FolderPlus,
  MoreVertical,
  Trash2,
  FileUp,
  ChevronRight,
  Pencil,
  Download,
  FolderSearch,
  Landmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { type FolderItem, type FileItem } from '@/data/files';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileIcon } from '@/components/files/file-icon';
import { format } from 'date-fns';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { 
    getFiles, 
    getFolders, 
    addFolder, 
    updateFolder, 
    updateFile, 
    deleteFiles, 
    deleteFolderAndContents,
    uploadFiles,
    findOrCreateTopLevelFolder,
} from '@/services/file-service';
import { FilesViewContent } from '@/components/files/files-view-content';

const LEGAL_FOLDER_NAME = "Legal Documents";

export function LegalHubView() {
    const [isLoading, setIsLoading] = useState(true);
    const [legalRootFolder, setLegalRootFolder] = useState<FolderItem | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        async function initializeLegalHub(userId: string) {
            try {
                const rootFolder = await findOrCreateTopLevelFolder(userId, LEGAL_FOLDER_NAME);
                setLegalRootFolder(rootFolder);
            } catch (error: any) {
                console.error("Failed to initialize Legal Hub:", error);
                toast({
                    variant: "destructive",
                    title: "Initialization Failed",
                    description: error.message,
                });
            } finally {
                setIsLoading(false);
            }
        }

        if (user) {
            initializeLegalHub(user.uid);
        } else {
            setIsLoading(false);
        }
    }, [user, toast]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Initializing Legal Hub...</p>
                </div>
            </div>
        );
    }
    
    if (!user) {
        return <div className="p-4 text-center text-muted-foreground">Please log in to access the Legal Hub.</div>;
    }
    
    if (!legalRootFolder) {
        return <div className="p-4 text-center text-destructive">Could not load the Legal Hub. Please try again.</div>;
    }
    
    return (
        <DndProvider backend={HTML5Backend}>
            <FilesViewContent
                rootFolderId={legalRootFolder.id}
                headerIcon={Landmark}
                headerTitle="Legal Hub"
                headerDescription="Manage all your legal documents, contracts, and compliance files in one secure place."
            />
        </DndProvider>
    );
}
