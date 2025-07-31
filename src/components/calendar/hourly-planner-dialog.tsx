
"use client";

import React, { useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { type Event } from '@/types/calendar';
import { format, set, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface HourlyPlannerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedDate: Date;
  selectedHour: number;
  events: Event[];
  timeSlotIncrement: number;
  onEventUpdate: (eventId: string, newStart: Date) => void;
  onTimeSlotClick: (time: Date) => void;
}

const DraggableEvent = ({ event, onEventClick }: { event: Event; onEventClick: () => void }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'event-in-dialog',
        item: event,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            onClick={onEventClick}
            className="p-2 bg-primary/20 border border-primary/50 rounded-lg cursor-move text-primary text-xs"
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            <p className="font-bold truncate">{event.title}</p>
            <p className="opacity-80 truncate">{format(event.start, 'p')} - {format(event.end, 'p')}</p>
        </div>
    );
};

const TimeSlot = ({ time, onDrop, children, onClick }: { time: Date; onDrop: (event: Event) => void; children: React.ReactNode; onClick: () => void; }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: 'event-in-dialog',
        drop: (item: Event) => onDrop(item),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));

    return (
        <div ref={drop} className={cn("flex gap-4 border-b py-2 pl-2", isOver && canDrop && "bg-accent")}>
            <time className="w-16 text-right text-sm text-muted-foreground pt-1">{format(time, 'p')}</time>
            <div className="flex-1 min-h-[40px]" onClick={onClick}>
                {children}
            </div>
        </div>
    );
};


export function HourlyPlannerDialog({
  isOpen,
  onOpenChange,
  selectedDate,
  selectedHour,
  events,
  timeSlotIncrement,
  onEventUpdate,
  onTimeSlotClick,
}: HourlyPlannerDialogProps) {

  const slots = useMemo(() => {
    const startOfHour = set(selectedDate, { hours: selectedHour, minutes: 0, seconds: 0, milliseconds: 0 });
    return Array.from({ length: 60 / timeSlotIncrement }, (_, i) => addMinutes(startOfHour, i * timeSlotIncrement));
  }, [selectedHour, selectedDate, timeSlotIncrement]);

  const handleDrop = (event: Event, newTime: Date) => {
    onEventUpdate(event.id, newTime);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
        <DialogHeader className="p-4 border-b text-center relative">
          <DialogTitle className="text-3xl font-bold font-headline text-primary">Hourly Planner</DialogTitle>
          <DialogDescription>{format(set(selectedDate, { hours: selectedHour }), 'MMMM d, yyyy @ h a')}</DialogDescription>
           <DialogClose asChild className="absolute right-4 top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </Button>
            </DialogClose>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="px-4 sm:px-6 py-4 max-w-4xl mx-auto">
                {slots.map(slot => {
                    const slotEvents = events.filter(e => e.start >= slot && e.start < addMinutes(slot, timeSlotIncrement));
                    return (
                        <TimeSlot key={slot.toISOString()} time={slot} onDrop={(item) => handleDrop(item, slot)} onClick={() => onTimeSlotClick(slot)}>
                            <div className="space-y-1">
                                {slotEvents.map(event => (
                                    <DraggableEvent key={event.id} event={event} onEventClick={() => { /* Placeholder for editing */ }} />
                                ))}
                                {slotEvents.length === 0 && (
                                     <Button variant="ghost" size="sm" className="w-full justify-start h-full text-muted-foreground hover:text-foreground">
                                        <Plus className="h-4 w-4 mr-2" /> Add event
                                    </Button>
                                )}
                            </div>
                        </TimeSlot>
                    )
                })}
            </div>
          </ScrollArea>
        </div>
         <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
