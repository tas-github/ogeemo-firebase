
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  addDays,
  format,
  isSameDay,
  eachDayOfInterval,
  set,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Settings,
  Info,
  Columns,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { type Event, type Project } from '@/types/calendar-types';
import {
  getTasksForUser,
  updateTask,
} from '@/services/project-service';
import { CalendarEvent } from './CalendarEvent';
import { Droppable } from './Droppable';
import { type Contact } from '@/data/contacts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";


const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: i, label: format(set(new Date(), { hours: i }), 'h a') }));

const timeSlotOptions = Array.from({ length: 12 }, (_, i) => i + 1);


export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysToShow, setDaysToShow] = useState(1);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(18);
  const [slotsPerHour, setSlotsPerHour] = useState(1);

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const loadData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userEvents = await getTasksForUser(user.uid);
      setEvents(userEvents.filter((e) => e.isScheduled));
    } catch (error: any) {
      console.error('Failed to load calendar data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load calendar data.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  useEffect(() => {
    if (gridRef.current) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        if (currentHour >= startHour && currentHour < endHour) {
            const hourIndex = currentHour - startHour;
            const minuteOffset = (currentMinute / 60) * 48; // Base height per hour
            const scrollPosition = hourIndex * 48 + minuteOffset - (gridRef.current.offsetHeight / 2);
            gridRef.current.scrollTop = scrollPosition;
        }
    }
  }, [isLoading, startHour, endHour]);

  const handleDateChange = (date?: Date) => {
    if (date) {
      setCurrentDate(date);
    }
  };

  const handleNext = () => {
    setCurrentDate((prev) => addDays(prev, daysToShow));
  };

  const handlePrev = () => {
    setCurrentDate((prev) => addDays(prev, -daysToShow));
  };
  
  const handleEventDrop = async (
    item: Event,
    targetDate: Date,
    targetHour: number,
    targetMinute: number
  ) => {
    const originalEvents = events;
    const newStart = new Date(targetDate);
    newStart.setHours(targetHour, targetMinute, 0, 0);

    const duration = (item.end?.getTime() ?? 0) - (item.start?.getTime() ?? 0);
    const newEnd = new Date(newStart.getTime() + duration);

    const updatedEvent = { ...item, start: newStart, end: newEnd };

    setEvents((prev) => prev.map((e) => (e.id === item.id ? updatedEvent : e)));

    try {
      await updateTask(item.id, { start: newStart, end: newEnd });
      toast({
        title: 'Event Rescheduled',
        description: `"${item.title}" moved to ${format(newStart, 'PPp')}.`,
      });
    } catch (error: any) {
      setEvents(originalEvents);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not reschedule the event.',
      });
    }
  };

  const handleEditEvent = (event: Event) => {
    router.push(`/master-mind?eventId=${event.id}`);
  };
  
  const handleDeleteEvent = async (event: Event) => {
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      const originalEvents = events;
      setEvents(prev => prev.filter(e => e.id !== event.id));
      try {
          await updateTask(event.id, { isScheduled: false });
          toast({ title: 'Event Removed from Calendar', description: `"${event.title}" has been unscheduled.`});
      } catch (error: any) {
          setEvents(originalEvents);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not remove the event.' });
      }
    }
  };

  const handleToggleComplete = async (event: Event) => {
    const newStatus = event.status === 'done' ? 'todo' : 'done';
    const originalEvents = events;
    const updatedEvent = { ...event, status: newStatus };
    setEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e));
    try {
        await updateTask(event.id, { status: newStatus });
        toast({ title: newStatus === 'done' ? 'Task Completed' : 'Task Marked as To-Do' });
    } catch (error: any) {
        setEvents(originalEvents);
        toast({ variant: 'destructive', title: 'Update Failed' });
    }
  };

  const renderedDays = eachDayOfInterval({
    start: currentDate,
    end: addDays(currentDate, daysToShow - 1),
  });

  const visibleHours = hourOptions.filter(h => h.value >= startHour && h.value < endHour);
  
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full" ref={containerRef}>
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Calendar
        </h1>
        <p className="text-muted-foreground">
          Visually manage your time and tasks.
        </p>
      </header>

      <div
        ref={headerRef}
        className="flex-shrink-0 flex items-center justify-between flex-wrap gap-4 pb-4 border-b"
      >
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-64 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(currentDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-32">
            <select
              value={daysToShow}
              onChange={(e) => setDaysToShow(Number(e.target.value))}
              className="w-full h-8 pl-3 pr-8 text-sm border-input border rounded-md appearance-none bg-transparent"
            >
              <option value={1}>1 Day</option>
              <option value={3}>3 Days</option>
              <option value={5}>5 Days</option>
              <option value={7}>7 Days</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <Columns className="h-4 w-4" />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>View Hours</DropdownMenuLabel>
                <div className="p-2 space-y-2">
                    <div className="space-y-1">
                        <Label htmlFor="start-hour" className="text-xs">Start Time</Label>
                        <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
                            <SelectTrigger id="start-hour"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {hourOptions.map(h => <SelectItem key={`start-${h.value}`} value={String(h.value)} disabled={h.value >= endHour}>{h.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="end-hour" className="text-xs">End Time</Label>
                         <Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}>
                            <SelectTrigger id="end-hour"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {hourOptions.map(h => <SelectItem key={`end-${h.value}`} value={String(h.value)} disabled={h.value <= startHour}>{h.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/calendar/instructions">
              <Info className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-col flex-1 mt-2 overflow-auto" ref={gridRef}>
        <div className="sticky top-0 z-10 bg-background flex border-b border-black">
          <div className="w-40 shrink-0 border-r border-black" />
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysToShow}, 1fr)` }}>
            {renderedDays.map((day) => (
              <div key={day.toString()} className="flex items-center justify-center text-center py-2 border-r border-black last:border-r-0">
                <p className={cn("text-xs font-semibold", isSameDay(day, new Date()) && "text-primary")}>
                  {format(day, 'EEE')}
                </p>
                <p className={cn("text-lg font-bold ml-2", isSameDay(day, new Date()) && "text-primary")}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex min-h-0">
          <div className="w-40 shrink-0">
            {visibleHours.map((hour) => (
              <div key={hour.value} className="flex items-center justify-center text-xs text-muted-foreground border-r border-b border-black" style={{ height: `${48 * slotsPerHour}px` }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full h-full flex items-center justify-center hover:bg-muted/50">
                        {hour.label}
                        <ChevronDown className="ml-1 h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Slots per Hour</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={String(slotsPerHour)} onValueChange={(v) => setSlotsPerHour(Number(v))}>
                        {timeSlotOptions.map(slot => (
                            <DropdownMenuRadioItem key={slot} value={String(slot)}>{slot}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysToShow}, 1fr)` }}>
            {renderedDays.map(day => (
              <div key={day.toISOString()} className="border-r border-black last:border-r-0 h-full">
                {visibleHours.map((hour) => (
                  <div key={hour.value} className="border-b border-black h-full" style={{ height: `${48 * slotsPerHour}px` }}>
                    {/* Time slots will be rendered here */}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

