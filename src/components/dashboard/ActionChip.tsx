
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDrag } from 'react-dnd';
import { Button } from '@/components/ui/button';
import { type ActionChipData } from '@/components/dashboard/dashboard-view';
import { cn } from '@/lib/utils';
import { X, Wand2 } from 'lucide-react';

export const DraggableItemTypes = {
  ACTION_CHIP: 'actionChip',
};

interface ActionChipProps {
  chip: ActionChipData;
  onDelete?: (chipId: string) => void;
  isDeletable?: boolean;
}

export const ActionChip = React.forwardRef<HTMLDivElement, ActionChipProps>(
  ({ chip, onDelete, isDeletable = true }, ref) => {
    const router = useRouter();
    const { icon: IconComponent, href, label } = chip;
    const Icon = typeof IconComponent === 'function' ? IconComponent : Wand2;

    const [{ isDragging }, drag] = useDrag(() => ({
      type: DraggableItemTypes.ACTION_CHIP,
      item: chip,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    const handleClick = (e: React.MouseEvent) => {
      // Prevent navigation if the delete button is clicked
      if ((e.target as HTMLElement).closest('[data-delete-chip]')) {
        return;
      }
      router.push(href);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(chip.id);
    };
    
    const combinedRef = (node: HTMLDivElement) => {
        drag(node);
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    };

    return (
      <div
        ref={combinedRef}
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
