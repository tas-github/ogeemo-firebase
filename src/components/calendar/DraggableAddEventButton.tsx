
"use client";

import React from 'react';
import { useDrag } from 'react-dnd';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ItemTypes } from './DraggableEvent';

export const DraggableAddEventButton = () => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.NEW_EVENT_BUTTON,
        item: { type: ItemTypes.NEW_EVENT_BUTTON },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
            <Button className="h-8 py-1">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
            </Button>
        </div>
    );
};
