
"use client";

import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { format } from 'date-fns';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Event } from '@/types/calendar';
import { cn } from '@/lib/utils';

const ItemTypes = {
  TASK: 'task',
};

interface TaskCardProps {
  task: Event;
  onEdit: (task: Event) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: task,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <Card ref={drag} className={cn("mb-3 cursor-grab", isDragging && "opacity-50")}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-sm leading-tight pr-2">{task.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">{format(task.end, 'MMM d')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

interface TaskColumnProps {
  status: 'todo' | 'inProgress' | 'done';
  title: string;
  tasks: Event[];
  onTaskStatusChange: (task: Event) => void;
  onEditTask: (task: Event) => void;
  onNewTask: (status: 'todo' | 'inProgress' | 'done') => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ status, title, tasks, onTaskStatusChange, onEditTask, onNewTask }) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: Event) => {
      if (item.status !== status) {
        onTaskStatusChange({ ...item, status });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div ref={drop} className={cn("flex-1 h-full bg-muted/50 rounded-lg", isOver && canDrop && "bg-primary/10")}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">{title} <Badge variant="secondary" className="ml-2">{tasks.length}</Badge></h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNewTask(status)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </ScrollArea>
      </div>
    </div>
  );
};

interface TaskBoardProps {
  tasks: Event[];
  onTaskStatusChange: (task: Event) => void;
  onEditTask: (task: Event) => void;
  onNewTask: (status: 'todo' | 'inProgress' | 'done') => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTaskStatusChange, onEditTask, onNewTask }) => {
  const todoTasks = tasks.filter((task) => task.status === 'todo');
  const inProgressTasks = tasks.filter((task) => task.status === 'inProgress');
  const doneTasks = tasks.filter((task) => task.status === 'done');

  return (
    <div className="flex gap-4 h-full">
      <TaskColumn
        status="todo"
        title="To Do"
        tasks={todoTasks}
        onTaskStatusChange={onTaskStatusChange}
        onEditTask={onEditTask}
        onNewTask={onNewTask}
      />
      <TaskColumn
        status="inProgress"
        title="In Progress"
        tasks={inProgressTasks}
        onTaskStatusChange={onTaskStatusChange}
        onEditTask={onEditTask}
        onNewTask={onNewTask}
      />
      <TaskColumn
        status="done"
        title="Done"
        tasks={doneTasks}
        onTaskStatusChange={onTaskStatusChange}
        onEditTask={onEditTask}
        onNewTask={onNewTask}
      />
    </div>
  );
};
