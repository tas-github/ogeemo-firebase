
"use client";

import React, { useRef, useState } from 'react';
import { useDrop, useDrag, DropTargetMonitor } from 'react-dnd';
import { format } from 'date-fns';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  index: number;
  onEdit: (task: Event) => void;
  moveTask: (dragIndex: number, hoverIndex: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onEdit, moveTask }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.TASK,
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
    },
    hover(item: Event & { index: number }, monitor: DropTargetMonitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      moveTask(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { ...task, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  
  drag(drop(ref));

  return (
    <div ref={ref} data-handler-id={handlerId}>
      <Card className={cn("mb-3 cursor-grab", isDragging && "opacity-50")}>
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
    </div>
  );
};

interface TaskColumnProps {
  status: 'todo' | 'inProgress' | 'done';
  title: string;
  tasks: Event[];
  onTaskDrop: (task: Event, newStatus: 'todo' | 'inProgress' | 'done') => void;
  onEditTask: (task: Event) => void;
  onNewTask: (status: 'todo' | 'inProgress' | 'done') => void;
  onTaskReorder: (draggedTask: Event, targetTask: Event) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ status, title, tasks, onTaskDrop, onEditTask, onNewTask, onTaskReorder }) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: Event) => {
      if (item.status !== status) {
        onTaskDrop(item, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const moveTask = (dragIndex: number, hoverIndex: number) => {
    const draggedTask = tasks[dragIndex];
    const targetTask = tasks[hoverIndex];
    onTaskReorder(draggedTask, targetTask);
  };

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
          {tasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} onEdit={onEditTask} moveTask={moveTask} />
          ))}
        </ScrollArea>
      </div>
    </div>
  );
};

interface TaskBoardProps {
  tasks: Event[];
  onTaskStatusChange: (task: Event, newStatus: 'todo' | 'inProgress' | 'done') => void;
  onEditTask: (task: Event) => void;
  onNewTask: (status: 'todo' | 'inProgress' | 'done') => void;
  onTaskReorder: (draggedTask: Event, targetTask: Event) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTaskStatusChange, onEditTask, onNewTask, onTaskReorder }) => {
  const todoTasks = tasks.filter((task) => task.status === 'todo').sort((a,b) => a.position - b.position);
  const inProgressTasks = tasks.filter((task) => task.status === 'inProgress').sort((a,b) => a.position - b.position);
  const doneTasks = tasks.filter((task) => task.status === 'done').sort((a,b) => a.position - b.position);

  return (
    <div className="flex gap-4 h-full">
      <TaskColumn
        status="todo"
        title="To Do"
        tasks={todoTasks}
        onTaskDrop={onTaskStatusChange}
        onEditTask={onEditTask}
        onNewTask={onNewTask}
        onTaskReorder={onTaskReorder}
      />
      <TaskColumn
        status="inProgress"
        title="In Progress"
        tasks={inProgressTasks}
        onTaskDrop={onTaskStatusChange}
        onEditTask={onEditTask}
        onNewTask={onNewTask}
        onTaskReorder={onTaskReorder}
      />
      <TaskColumn
        status="done"
        title="Done"
        tasks={doneTasks}
        onTaskDrop={onTaskStatusChange}
        onEditTask={onEditTask}
        onNewTask={onNewTask}
        onTaskReorder={onTaskReorder}
      />
    </div>
  );
};
