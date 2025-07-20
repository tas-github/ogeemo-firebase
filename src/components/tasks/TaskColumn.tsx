
"use client";

import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type Event as TaskEvent, type TaskStatus } from '@/types/calendar';
import { TaskCard } from './TaskCard';
import { NewTaskDialog } from './NewTaskDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { addTask } from '@/services/project-service';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: TaskEvent[];
  projectId: string;
  onMoveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => void;
  onTaskCreated: (newTask: TaskEvent) => void;
  onTaskUpdated: (updatedTask: TaskEvent) => void;
}

const statusTitles: Record<TaskStatus, string> = {
  todo: 'To Do',
  inProgress: 'In Progress',
  done: 'Done',
};

export function TaskColumn({ status, tasks, projectId, onMoveTask, onTaskCreated, onTaskUpdated }: TaskColumnProps) {
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item: TaskEvent) => onMoveTask(item.id, status, tasks.length), // Drop at the end
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));
  
  const handleTaskCreate = async (taskData: Omit<TaskEvent, 'id' | 'userId'>) => {
    if (!user) { toast({ variant: 'destructive', title: 'Not authenticated' }); return; }
    try {
        const newTask = await addTask({ ...taskData, userId: user.uid });
        onTaskCreated(newTask);
        toast({ title: "Task Created", description: `"${newTask.title}" has been added.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to create task', description: error.message });
    }
  };

  return (
    <>
      <Card ref={drop} className={cn("flex flex-col h-full", isOver && canDrop && "bg-primary/10")}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{statusTitles[status]} ({tasks.length})</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsNewTaskDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-2 overflow-hidden">
          <ScrollArea className="h-full pr-3">
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onMoveTask={onMoveTask}
                  onTaskUpdated={onTaskUpdated}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <NewTaskDialog
        isOpen={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        onTaskCreate={handleTaskCreate}
        projectId={projectId}
        defaultStatus={status}
      />
    </>
  );
}
