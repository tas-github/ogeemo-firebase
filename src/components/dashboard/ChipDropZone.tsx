
'use client';

import React from 'react';
import { useDrop } from 'react-dnd';
import { CardContent } from '@/components/ui/card';
import { type ActionChipData } from '@/data/actions';
import { DraggableItemTypes } from './ActionChip';
import { cn } from '@/lib/utils';

interface ChipDropZoneProps {
  frame: 'quick' | 'more';
  children: React.ReactNode;
  onDrop: (item: ActionChipData) => void;
}

export function ChipDropZone({ frame, children, onDrop }: ChipDropZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DraggableItemTypes.ACTION_CHIP,
    drop: (item: ActionChipData) => onDrop(item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  return (
    <CardContent
      ref={drop}
      className={cn(
        "min-h-[100px] flex flex-wrap gap-2 transition-colors",
        isOver && canDrop && "bg-primary/10 ring-2 ring-primary"
      )}
    >
      {children}
    </CardContent>
  );
}
