
"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { useDrag, useDrop } from 'react-dnd';
import { Button } from "@/components/ui/button";
import { type MenuItem } from '@/lib/menu-items';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface DraggableMenuItemProps {
  item: MenuItem;
  index: number;
  isActive: boolean;
  moveMenuItem: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export function DraggableMenuItem({ item, index, isActive, moveMenuItem }: DraggableMenuItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = item.icon;

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'MENU_ITEM',
    item: () => ({ id: item.href, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'MENU_ITEM',
    hover(draggedItem: DragItem, monitor) {
      if (!ref.current) return;
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      moveMenuItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={preview}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative"
    >
      <div ref={ref} className="flex items-center">
        <Button
          asChild
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 pl-8",
            "h-10 text-base text-white bg-primary border-b-4 border-black hover:bg-primary/90 active:mt-1 active:border-b-2"
          )}
        >
          <Link href={item.href}>
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        </Button>
        <GripVertical
          className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 cursor-grab"
        />
      </div>
    </div>
  );
}
