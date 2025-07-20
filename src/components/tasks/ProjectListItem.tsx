
"use client";

import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GripVertical, MoreVertical, Pencil, Trash2, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Project } from '@/types/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';

interface ProjectListItemProps {
  project: Project;
  taskCount: number;
  completedTaskCount: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  index: number;
  onMoveProject: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

interface DragItem {
  id: string;
  index: number;
}

export function ProjectListItem({ project, taskCount, completedTaskCount, isSelected, onSelect, index, onMoveProject, onEdit, onDelete }: ProjectListItemProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'project',
    item: { id: project.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'project',
    hover(item: DragItem, monitor) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      
      onMoveProject(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));
  
  const progress = taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0;

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Card
        className={cn(
          "cursor-pointer hover:bg-accent/50 group",
          isSelected && "bg-accent"
        )}
        onClick={() => onSelect(project.id)}
      >
        <CardContent className="p-3 flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold truncate">{project.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progress} className="h-2 w-full" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">{completedTaskCount}/{taskCount}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100 flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onSelect={() => onEdit(project)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                    <BarChart2 className="mr-2 h-4 w-4" /> Status Report
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDelete(project)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </div>
  );
}
