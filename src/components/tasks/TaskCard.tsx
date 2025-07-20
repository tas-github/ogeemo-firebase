
"use client";

import React, { useRef, useState } from 'react';
import { useDrag, useDrop, type XYCoord } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { type Event as TaskEvent, type TaskStatus } from '@/types/calendar';
import { NewTaskDialog } from './NewTaskDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { updateTask } from '@/services/project-service';

interface TaskCardProps {
  task: TaskEvent;
  index: number;
  onMoveTask: (draggedId: string, newStatus: TaskStatus, newPosition: number) => void;
  onTaskUpdated: (updatedTask: TaskEvent) => void;
}

interface DragItem {
  id: string;
  index: number;
  status: TaskStatus;
}

export function TaskCard({ task, index, onMoveTask, onTaskUpdated }: TaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { id: task.id, index, status: task.status || 'todo' } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'task',
    hover(item: DragItem, monitor) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragStatus = item.status;
      const hoverStatus = task.status || 'todo';

      if (dragIndex === hoverIndex && dragStatus === hoverStatus) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragStatus === hoverStatus) {
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      }
      
      onMoveTask(item.id, hoverStatus, hoverIndex);
      item.index = hoverIndex;
      item.status = hoverStatus;
    },
  });

  drag(drop(ref));
  
  const handleTaskUpdate = async (updatedData: Omit<TaskEvent, 'userId'>) => {
    if (!user) { toast({ variant: 'destructive', title: 'Not authenticated' }); return; }
    try {
        await updateTask(updatedData.id, updatedData);
        onTaskUpdated({ ...updatedData, userId: user.uid });
        toast({ title: "Task Updated", description: `"${updatedData.title}" has been saved.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to update task', description: error.message });
    }
  };

  return (
    <>
      <Card
        ref={ref}
        className="cursor-pointer"
        style={{ opacity: isDragging ? 0.5 : 1 }}
        onClick={() => setIsEditDialogOpen(true)}
      >
        <CardContent className="p-3">
          <p className="text-sm font-medium">{task.title}</p>
        </CardContent>
      </Card>
      <NewTaskDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        eventToEdit={task}
        onTaskUpdate={handleTaskUpdate}
        projectId={task.projectId}
      />
    </>
  );
}
