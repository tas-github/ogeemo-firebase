
"use client";

import React from 'react';
import { useDrag } from 'react-dnd';
import { getHours, getMinutes, format, differenceInMinutes } from 'date-fns';
import { type Event } from '@/types/calendar';

export const ItemTypes = {
  EVENT: 'event',
  ZOOM_IN: 'zoom_in',
};

interface DraggableEventProps {
  event: Event;
  onEdit: (event: Event) => void;
  viewStartHour: number;
  hourBlockHeights: Record<number, number>;
}

export const DraggableEvent = ({ event, onEdit, viewStartHour, hourBlockHeights }: DraggableEventProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: event,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const getEventPositionAndHeight = (event: Event) => {
      const startHour = getHours(event.start);
      const startMinute = getMinutes(event.start);
      
      let top = 0;
      // Sum the heights of all full hours before the event's start hour
      for (let i = viewStartHour; i < startHour; i++) {
        top += hourBlockHeights[i] || 0;
      }
      
      // Add the proportional height for the minutes within the start hour
      const currentHourHeight = hourBlockHeights[startHour] || 120; // Default to 120px if not found
      top += (startMinute / 60) * currentHourHeight;
      
      const durationMinutes = differenceInMinutes(event.end, event.start);
      const PIXELS_PER_MINUTE = 2; // Fixed scale: 120px per 60 mins
      const height = durationMinutes * PIXELS_PER_MINUTE;

      return { top, height };
  };

  const { top, height } = getEventPositionAndHeight(event);
  
  return (
    <div
      ref={drag}
      className="absolute left-1 right-1 p-2 bg-primary/20 border border-primary/50 rounded-lg cursor-pointer text-left"
      style={{ top: `${top}px`, height: `${height}px`, opacity: isDragging ? 0.5 : 1 }}
      onClick={() => onEdit(event)}
    >
      <p className="font-bold text-xs truncate">{event.title}</p>
      <p className="text-xs opacity-80 truncate">{format(event.start, 'p')} - {format(event.end, 'p')}</p>
    </div>
  );
};
