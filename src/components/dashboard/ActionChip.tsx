
'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDrag, useDrop, XYCoord } from 'react-dnd';
import { Button } from '@/components/ui/button';
import { type ActionChipData } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { Wand2, X } from 'lucide-react';

export const DraggableItemTypes = {
  ACTION_CHIP: 'actionChip',
};

interface ActionChipProps {
  chip: ActionChipData;
  index: number;
  onDelete?: () => void;
  onMove?: (dragIndex: number, hoverIndex: number) => void;
}

export const ActionChip = React.forwardRef<HTMLDivElement, ActionChipProps>(
  ({ chip, index, onDelete, onMove }, ref) => {
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
        if (!localRef.current || !onMove) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;

        if (dragIndex === hoverIndex) {
          return;
        }

        const hoverBoundingRect = localRef.current.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;

        // You might need more sophisticated logic here depending on layout (e.g., grid)
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        if (dragIndex < hoverIndex && hoverClientY < hoverBoundingRect.height / 2) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientY > hoverBoundingRect.height / 2) {
          return;
        }
        
        onMove(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    });
    
    drag(drop(localRef));
    
    const handleClick = (e: React.MouseEvent) => {
      if (!href) return;
      
      const hrefValue = typeof href === 'string' ? href : href.pathname;

      if (hrefValue && (hrefValue.startsWith('http://') || hrefValue.startsWith('https://'))) {
        window.open(hrefValue, '_blank', 'noopener,noreferrer');
      } else if (typeof href === 'string') {
        router.push(href);
      } else if (typeof href === 'object' && href.pathname) {
        const query = new URLSearchParams(href.query as Record<string, string>).toString();
        const url = query ? `${href.pathname}?${query}` : href.pathname;
        router.push(url);
      }
    };
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.();
    }

    return (
      <div
        ref={localRef}
        className={cn(
          'relative group',
          isDragging && 'opacity-50'
        )}
      >
        <Button
          onClick={handleClick}
          className={cn(
            "w-48 justify-start border-b-4 border-primary/70 bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            "active:mt-1 active:border-b-2 active:border-primary/90",
            !href && "cursor-default active:mt-0 active:border-b-4",
            "border-blue-800"
          )}
        >
          <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
        {onDelete && (
             <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
            >
                <X className="h-3 w-3" />
                <span className="sr-only">Delete {label}</span>
            </Button>
        )}
      </div>
    );
  }
);

ActionChip.displayName = 'ActionChip';
