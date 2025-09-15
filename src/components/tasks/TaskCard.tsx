
"use client";

import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { MoreVertical, Edit, Trash2, FolderGit2 } from 'lucide-react';
import { type Event as TaskEvent } from '@/types/calendar-types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Checkbox } from '../ui/checkbox';

interface TaskCardProps {
  task: TaskEvent;
  onMoveCard: (dragId: string, hoverId: string) => void;
  onTaskUpdate: (task: TaskEvent) => void;
  onTaskDelete: (taskId: string) => void;
  isSelected: boolean;
  onToggleSelect: (taskId: string, event?: React.MouseEvent) => void;
}

export function TaskCard({ task, onMoveCard, onTaskUpdate, onTaskDelete, isSelected, onToggleSelect }: TaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: task,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'task',
    hover(item: TaskEvent, monitor) {
      if (!ref.current || item.id === task.id) return;
      onMoveCard(item.id, task.id);
    },
  });

  drag(drop(ref));
  
  const handleEdit = () => {
      router.push(`/time?eventId=${task.id}`);
  };

  return (
    <>
      <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
        <Card className={cn("group", isSelected && "bg-primary/20 border-primary")}>
          <CardContent className="p-3 flex items-start gap-2">
            <Checkbox
              checked={isSelected}
              onClick={(e) => onToggleSelect(task.id, e)}
              onKeyDown={(e) => {
                if (e.key === ' ') {
                   onToggleSelect(task.id, e as unknown as React.MouseEvent);
                }
              }}
              className="mt-1"
              aria-label={`Select task ${task.title}`}
            />
            <div className="flex-1 cursor-pointer" onClick={handleEdit}>
              <p className="font-semibold text-sm">{task.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" /> Edit / View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onTaskDelete(task.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
