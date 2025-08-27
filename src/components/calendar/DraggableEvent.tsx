
"use client";

import React from 'react';
import { useDrag } from 'react-dnd';
import { type Event } from '@/types/calendar';
import { cn } from '@/lib/utils';

export const ItemTypes = {
  EVENT: 'event',
};

interface DraggableEventProps {
  event: Event;
  sourceSlot: string; // e.g., '2024-08-20T08:00:00.000Z'
}

export const DraggableEvent = ({ event, sourceSlot }: DraggableEventProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: { ...event, sourceSlot },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={cn(
        "p-2 bg-tan border border-black rounded-lg cursor-pointer text-black truncate",
        isDragging ? 'opacity-50' : 'opacity-100'
      )}
      style={{ lineHeight: '1.2' }} // Ensure single line of text is centered vertically
    >
      <p className="text-sm truncate">{event.title}</p>
    </div>
  );
};
