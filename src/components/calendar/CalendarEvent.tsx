
'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { format } from 'date-fns';
import { MoreVertical, Pencil, Trash2, CheckCircle, Briefcase, Clock, PlayCircle } from 'lucide-react';
import { type Event } from '@/types/calendar-types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';
import Link from 'next/link';

// Define item type for react-dnd
export const ItemTypes = {
  EVENT: 'event',
};

interface CalendarEventProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onToggleComplete: (event: Event) => void;
}

export function CalendarEvent({ event, onEdit, onDelete, onToggleComplete }: CalendarEventProps) {
  const startTime = format(event.start, 'h:mm a');
  const isCompleted = event.status === 'done';

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: event,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={cn(
        'w-full h-full rounded-md p-1 text-xs transition-opacity group flex items-center justify-between cursor-move',
        isCompleted ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-black',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex-1 overflow-hidden" onClick={() => onEdit(event)}>
        <p className={cn("truncate", isCompleted && "line-through")}>
          <span className="font-bold">{event.title}</span> {startTime}
        </p>
      </div>
      
      <div className="flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Event options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => onEdit(event)}>
              <Pencil className="mr-2 h-4 w-4" /> Open / Edit
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href={`/time?eventId=${event.id}&startTimer=true`}>
                    <PlayCircle className="mr-2 h-4 w-4" /> Start Timer
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href={`/time?logTimeFor=${event.id}`}>
                    <Clock className="mr-2 h-4 w-4" /> Log Actual Time
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleComplete(event)}>
                <CheckCircle className="mr-2 h-4 w-4" /> 
                {isCompleted ? "Mark as Not Completed" : "Mark as Completed"}
            </DropdownMenuItem>
            {event.projectId && (
                <DropdownMenuItem asChild>
                    <Link href={`/projects/${event.projectId}/tasks`}>
                        <Briefcase className="mr-2 h-4 w-4" /> Go to Project
                    </Link>
                </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onDelete(event)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
