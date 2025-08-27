
"use client"

import * as React from "react"
import { format, addDays, set } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Settings, Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarShadCN } from "@/components/ui/calendar"
import { useAuth } from "@/context/auth-context"
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableEvent } from './DraggableEvent';
import { useDrop } from 'react-dnd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Event } from '@/types/calendar';

// Define a type for our draggable item
interface DraggedEvent extends Event {
  sourceSlot: string;
}

const TimeSlotContainer = ({ 
  slotKey, 
  events, 
  slotsInHour, 
  onDropEvent 
}: { 
  slotKey: string; 
  events: Event[]; 
  slotsInHour: number; 
  onDropEvent: (item: DraggedEvent, targetSlot: string) => void 
}) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: 'event',
    drop: (item: DraggedEvent) => onDropEvent(item, slotKey),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      className="flex-1 border-l border-black p-2 space-y-2 bg-white min-h-[5rem]"
    >
      {events.map((event) => (
        <DraggableEvent key={event.id} event={event} sourceSlot={slotKey} />
      ))}
    </div>
  );
};


export function CalendarView() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [numberOfDays, setNumberOfDays] = React.useState<number>(1);
  const [slotsInHour, setSlotsInHour] = React.useState(4); // State for number of slots
  const [eventsBySlot, setEventsBySlot] = React.useState<Record<string, Event[]>>({
    // Initial sample data
    [set(new Date(), { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString()]: [
        { id: '1', title: 'Task Title 1' } as Event,
        { id: '2', title: 'Task Title 2' } as Event,
    ],
    [set(new Date(), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString()]: [
        { id: '3', title: 'Task Title 3' } as Event,
    ],
  });

  const { user } = useAuth();
  
  const daysInView = React.useMemo(() => {
    if (!date) return [];
    return Array.from({ length: numberOfDays }, (_, i) => addDays(date, i));
  }, [date, numberOfDays]);

  const viewTitle = React.useMemo(() => {
    if (!date) return "Select a date";
    if (daysInView.length === 1) return format(date, 'EEEE, MMMM d, yyyy');
    if (daysInView.length > 1) {
        const start = daysInView[0];
        const end = daysInView[daysInView.length - 1];
        if (start.getFullYear() !== end.getFullYear()) {
            return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
        }
        if (start.getMonth() !== end.getMonth()) {
             return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
        }
        return `${format(start, 'MMMM d')} – ${format(end, 'd, yyyy')}`;
    }
    return format(date, 'PPP');
  }, [date, daysInView]);
  
  const handlePrev = () => {
    if (!date) return;
    const newDate = addDays(date, -numberOfDays);
    setDate(newDate);
  };
  
  const handleNext = () => {
    if (!date) return;
    const newDate = addDays(date, numberOfDays);
    setDate(newDate);
  };
  
  const handleToday = () => {
    setDate(new Date());
    setNumberOfDays(1);
  };

  const handleDropEvent = React.useCallback((item: DraggedEvent, targetSlot: string) => {
    setEventsBySlot(prev => {
        const newEvents = { ...prev };
        const sourceSlot = item.sourceSlot;
        
        // Remove from source if it exists
        if (newEvents[sourceSlot]) {
            newEvents[sourceSlot] = newEvents[sourceSlot].filter(event => event.id !== item.id);
        }

        // Add to target
        if (!newEvents[targetSlot]) {
            newEvents[targetSlot] = [];
        }
        // Avoid adding duplicates if already there
        if (!newEvents[targetSlot].some(event => event.id === item.id)) {
            newEvents[targetSlot].push({ ...item });
        }
        
        return newEvents;
    });
  }, []);

  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM

  return (
    <>
      <div className="h-full flex flex-col p-4 sm:p-6">
        <header className="shrink-0 space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Calendar</h1>
            <p className="text-muted-foreground">Manage your schedule, events and appointments.</p>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
            <h2 className="text-xl font-semibold font-headline text-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost">{viewTitle}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarShadCN mode="single" selected={date} onSelect={setDate} />
                </PopoverContent>
              </Popover>
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}><span className="sr-only">Previous period</span><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}><span className="sr-only">Next period</span><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" className="h-8 py-1" onClick={handleToday}>Today</Button>
                <Button className="h-8 py-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="days-select" className="text-sm">Show:</Label>
                <Select
                  value={String(numberOfDays)}
                  onValueChange={(value) => setNumberOfDays(Number(value))}
                >
                  <SelectTrigger id="days-select" className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(dayCount => (
                      <SelectItem key={dayCount} value={String(dayCount)}>
                        {dayCount} day{dayCount > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">Settings</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                       <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Calendar Settings</h4>
                                <p className="text-sm text-muted-foreground">
                                Adjust the start and end times for your daily view.
                                </p>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 mt-4 overflow-auto">
          <DndProvider backend={HTML5Backend}>
            <div className="p-4 border border-black">
              {/* Day Headers */}
              <div className="flex sticky top-0 bg-background z-10">
                <div className="w-20 flex-shrink-0 border-b border-black" />
                <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${numberOfDays}, 1fr)` }}>
                  {daysInView.map(day => (
                    <div key={day.toString()} className="text-center font-semibold p-2 border-l border-b border-black">
                      {format(day, 'EEE d')}
                    </div>
                  ))}
                </div>
              </div>
              {/* Hourly Rows */}
              {hours.map(hour => (
                <div key={hour} className="flex min-h-[6rem]">
                  {/* Gutter */}
                  <div className="w-20 flex-shrink-0 border-r border-black p-2 flex flex-col items-center justify-start text-right">
                    <span className="font-semibold text-xs">{format(set(new Date(), { hours: hour }), 'h a')}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 mt-1">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {[...Array(12).keys()].map(i => i + 1).map(num => (
                          <DropdownMenuItem key={num} onSelect={() => setSlotsInHour(num)}>
                            {num} Slot{num > 1 ? 's' : ''}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Time Slot Container Grid */}
                  <div className="flex-1 grid border-b border-black" style={{ gridTemplateColumns: `repeat(${numberOfDays}, 1fr)` }}>
                    {daysInView.map(day => {
                        const slotDate = set(day, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 });
                        const slotKey = slotDate.toISOString();
                        const currentEvents = eventsBySlot[slotKey] || [];
                        return (
                            <TimeSlotContainer
                                key={slotKey}
                                slotKey={slotKey}
                                events={currentEvents}
                                slotsInHour={slotsInHour}
                                onDropEvent={handleDropEvent}
                            />
                        )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </DndProvider>
        </main>
        
      </div>
    </>
  );
}
