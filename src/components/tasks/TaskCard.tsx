
"use client";

import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { type Event as TaskEvent } from '@/types/calendar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';
import { NewTaskDialog } from './NewTaskDialog';
import { deleteTask } from '@/services/project-service';
import { useToast } from '@/hooks/use-toast';

interface TaskCardProps {
  task: TaskEvent;
  onMoveCard: (dragId: string, hoverId: string) => void;
  onTaskUpdate: (task: TaskEvent) => void;
  onTaskDelete: (taskId: string) => void;
}

export function TaskCard({ task, onMoveCard, onTaskUpdate, onTaskDelete }: TaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

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
  
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
        try {
            await deleteTask(task.id);
            onTaskDelete(task.id);
            toast({ title: "Task Deleted" });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to delete task' });
        }
    }
  };

  return (
    <>
      <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
        <Card className="group">
          <CardContent className="p-3 flex items-start gap-2">
            <div className="flex-1">
              <p className="font-semibold text-sm">{task.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleDelete} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      </div>

      <NewTaskDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskUpdate={onTaskUpdate}
        eventToEdit={task}
        projectId={task.projectId}
      />
    </>
  );
}
