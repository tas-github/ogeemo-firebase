'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDrag, useDrop, XYCoord } from 'react-dnd';
import { Button } from '@/components/ui/button';
import { type ActionChipData } from '@/components/dashboard/dashboard-view';
import { cn } from '@/lib/utils';
import { X, Wand2 } from 'lucide-react';

export const DraggableItemTypes = {
  ACTION_CHIP: 'actionChip',
};

interface ActionChipProps {
  chip: ActionChipData;
  index: number;
  onDelete?: (chipId: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  isDeletable?: boolean;
}

export const ActionChip = React.forwardRef<HTMLDivElement, ActionChipProps>(
  ({ chip, index, onDelete, onMove, isDeletable = true }, ref) => {
    const router = useRouter();
    const localRef = useRef<HTMLDivElement>(null);
    const { icon: IconComponent, href, label } = chip;
    const Icon = typeof IconComponent === 'function' ? IconComponent : Wand2;

    const [{ isDragging }, drag] = useDrag({
      type: DraggableItemTypes.ACTION_CHIP,
      item: { ...chip, index },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    });
    
    const [, drop] = useDrop({
        accept: DraggableItemTypes.ACTION_CHIP,
        hover(item: ActionChipData & { index: number }, monitor) {
            if (!localRef.current) return;
            
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) return;
            
            onMove(dragIndex, hoverIndex);
            item.index = hoverIndex;
        }
    });

    const handleClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-delete-chip]')) {
        return;
      }
      router.push(href);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(chip.id);
    };
    
    drag(drop(localRef));

    return (
      <div
        ref={localRef}
        className={cn(
          'relative group',
          isDragging && 'opacity-50'
        )}
      >
        <Button
          variant="secondary"
          className="w-40 justify-start cursor-move"
          onClick={handleClick}
        >
          <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
        {isDeletable && onDelete && (
          <button
            data-delete-chip
            onClick={handleDelete}
            className="absolute -top-1 -right-1 h-5 w-5 bg-muted-foreground text-muted rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`Delete ${label} chip`}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);

ActionChip.displayName = 'ActionChip';
