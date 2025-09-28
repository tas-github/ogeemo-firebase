
'use client';

import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  Folder,
  File as FileIconLucide,
  MoreVertical,
  Pencil,
  Trash2,
  FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type FileItem, type FolderItem } from '@/data/files';
import { cn } from '@/lib/utils';

export const ItemTypes = {
    FILE: 'file',
    FOLDER: 'folder',
};

const itemFrameStyle = "flex items-center gap-2 p-2 border rounded-md";

interface DraggableFileProps {
    file: FileItem;
    onDelete: (file: FileItem) => void;
    isSelected: boolean;
    onToggleSelect: (fileId: string) => void;
    selectedFileIds: string[];
}

export const DraggableFile = ({ file, onDelete, isSelected, onToggleSelect, selectedFileIds }: DraggableFileProps) => {
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
        <div ref={drag} className={cn(itemFrameStyle, "bg-background group cursor-move", isDragging && "opacity-50")}>
            <FileIconLucide className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate flex-1">{file.name}</span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onDelete(file)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

interface DroppableFolderProps {
    folder: FolderItem;
    onClick: () => void;
    onDrop: (item: any, folderId: string | null) => void;
    onRename: (folder: FolderItem) => void;
    onDelete: (folder: FolderItem) => void;
    onNewSubfolder: (parentId: string) => void;
    className?: string;
    children?: React.ReactNode;
}

export const DroppableFolder = ({ folder, onClick, onDrop, onRename, onDelete, onNewSubfolder, className, children }: DroppableFolderProps) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: [ItemTypes.FILE, ItemTypes.FOLDER],
        drop: (item) => onDrop(item, folder.id),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));
    
    const isSubfolder = !!folder.parentId;

    return (
        <div ref={drop} className={cn("transition-colors rounded-md p-1", isOver && canDrop && "bg-primary/10")}>
            <div
                onClick={onClick}
                className={cn(itemFrameStyle, "group cursor-pointer", className)}
            >
                <Folder className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={() => onNewSubfolder(folder.id)}>
                            <FolderPlus className="mr-2 h-4 w-4" /> New Subfolder
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onRename(folder)}>
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDelete(folder)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {children}
        </div>
    );
};
