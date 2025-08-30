
'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const ItemTypes = {
  ADD_EVENT: 'addEvent',
};

export function DraggableAddEventButton() {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ADD_EVENT,
    item: { type: ItemTypes.ADD_EVENT },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Button
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="w-full cursor-move"
    >
      <Plus className="mr-2 h-4 w-4" />
      Drag to Add Event
    </Button>
  );
}
