
'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { format } from 'date-fns';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { type Event } from '@/types/calendar-types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';

// Define item type for react-dnd
export const ItemTypes = {
  EVENT: 'event',
};

interface CalendarEventProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}

export function CalendarEvent({ event, onEdit, onDelete }: CalendarEventProps) {
  const startTime = format(event.start, 'h:mm a');

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
        'bg-primary/20 text-black',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex-1 overflow-hidden">
        <p className="truncate">
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
            <DropdownMenuItem onSelect={() => onDelete(event)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
