
'use client';

import * as React from 'react';
import {
  format,
  addDays,
  startOfDay,
  set,
  parseISO,
  differenceInMilliseconds,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar as CalendarIcon,
  X,
  Info,
  BookOpen,
  BellRing,
  BrainCircuit,
  Plus,
  ChevronDown,
  Save,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getTasksForUser,
  getProjectById,
  updateTask,
  deleteTask,
} from '@/services/project-service';
import type { Project } from '@/services/project-service';
import { type Event, type TaskStatus } from '@/types/calendar-types';
import { Label } from '../ui/label';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CalendarSkeleton } from './calendar-skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { CalendarEvent, ItemTypes } from './CalendarEvent';
import { useDrop } from 'react-dnd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CALENDAR_DAY_COUNT_KEY = 'calendarDayCount';
const CALENDAR_START_HOUR_KEY = 'calendarStartHour';
const CALENDAR_END_HOUR_KEY = 'calendarEndHour';

const BASE_SLOT_HEIGHT_PX = 30;

export function CalendarView() {
  const [isClient, setIsClient] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [dayCount, setDayCount] = React.useState<number>(1);
  const [allEvents, setAllEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [startHour, setStartHour] = React.useState(0);
  const [endHour, setEndHour] = React.useState(23);

  const [filteredProject, setFilteredProject] = React.useState<Project | null>(
    null
  );
  const [eventToDelete, setEventToDelete] = React.useState<Event | null>(null);
  const [hourSlots, setHourSlots] = React.useState<Record<number, number>>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const dayOptions = Array.from({ length: 30 }, (_, i) => i + 1);

  const loadEvents = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedTasks = await getTasksForUser(user.uid);
      setAllEvents(fetchedTasks);

      const projectId = searchParams ? searchParams.get('projectId') : null;
      if (projectId) {
        const project = await getProjectById(projectId);
        setFilteredProject(project);
      } else {
        setFilteredProject(null);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load events',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, searchParams]);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventsByDate = React.useMemo(() => {
    const eventMap: { [key: string]: Event[] } = {};
    const sourceEvents = filteredProject
      ? allEvents.filter((e) => e.projectId === filteredProject.id)
      : allEvents;

    sourceEvents.forEach((event) => {
      if (event.start) {
        const dateKey = format(event.start, 'yyyy-MM-dd');
        if (!eventMap[dateKey]) {
          eventMap[dateKey] = [];
        }
        eventMap[dateKey].push(event);
      }
    });

    for (const dateKey in eventMap) {
      eventMap[dateKey].sort((a, b) => a.start!.getTime() - b.start!.getTime());
    }

    return eventMap;
  }, [allEvents, filteredProject]);

  React.useEffect(() => {
    if (!isClient) return;
    try {
      const savedDayCount = localStorage.getItem(CALENDAR_DAY_COUNT_KEY);
      if (savedDayCount) setDayCount(parseInt(savedDayCount, 10));

      const savedStartHour = localStorage.getItem(CALENDAR_START_HOUR_KEY);
      if (savedStartHour) setStartHour(parseInt(savedStartHour, 10));

      const savedEndHour = localStorage.getItem(CALENDAR_END_HOUR_KEY);
      if (savedEndHour) setEndHour(parseInt(savedEndHour, 10));
    } catch (error) {
      console.error('Failed to load calendar preferences:', error);
    }
  }, [isClient]);

  const handleDayCountChange = (value: string) => {
    const newDayCount = Number(value);
    setDayCount(newDayCount);
    try {
      localStorage.setItem(CALENDAR_DAY_COUNT_KEY, String(newDayCount));
    } catch (error) {
      console.error('Failed to save calendar preferences:', error);
    }
  };

  const handleStartHourChange = (value: string) => {
    const newStartHour = Number(value);
    setStartHour(newStartHour);
    localStorage.setItem(CALENDAR_START_HOUR_KEY, value);
  };

  const handleEndHourChange = (value: string) => {
    const newEndHour = Number(value);
    setEndHour(newEndHour);
    localStorage.setItem(CALENDAR_END_HOUR_KEY, value);
  };

  const visibleDates = React.useMemo(() => {
    const start = startOfDay(currentDate);
    return Array.from({ length: dayCount }, (_, i) => addDays(start, i));
  }, [currentDate, dayCount]);

  const handlePrev = () => setCurrentDate((prev) => addDays(prev, -dayCount));
  const handleNext = () => setCurrentDate((prev) => addDays(prev, dayCount));
  const handleToday = () => setCurrentDate(new Date());

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: format(set(new Date(), { hours: i }), 'h a'),
  }));

  const handleEditEvent = (event: Event) => {
    router.push(`/master-mind?eventId=${event.id}`);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteTask(eventToDelete.id);
      toast({ title: 'Event Deleted' });
      loadEvents();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete event',
        description: error.message,
      });
    } finally {
      setEventToDelete(null);
    }
  };

  const handleToggleComplete = async (event: Event) => {
    const newStatus = event.status === 'done' ? 'todo' : 'done';
    try {
      await updateTask(event.id, { status: newStatus });
      toast({ title: `Task ${newStatus === 'done' ? 'completed' : 'reopened'}` });
      loadEvents();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to update task status' });
    }
  };

  const handleEventDrop = async (item: Event, newStartTime: Date) => {
    let durationMs: number;

    if (item.duration && item.duration > 0) {
      durationMs = item.duration * 1000;
    } else if (item.start && item.end) {
      durationMs = differenceInMilliseconds(item.end, item.start);
    } else {
      durationMs = 30 * 60 * 1000; // Default 30 minutes
    }

    if (isNaN(durationMs)) {
      toast({
        variant: 'destructive',
        title: 'Cannot move event',
        description: 'Event is missing duration data.',
      });
      return;
    }

    const newEndTime = new Date(newStartTime.getTime() + durationMs);

    try {
      await updateTask(item.id, { start: newStartTime, end: newEndTime });
      toast({
        title: 'Event Rescheduled',
        description: `"${item.title}" moved to ${format(newStartTime, 'PPp')}`,
      });
      loadEvents();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to move event',
        description: error.message,
      });
    }
  };

  const changeSlotsForHour = (hour: number, numSlots: number) => {
    setHourSlots((prev) => ({ ...prev, [hour]: numSlots }));
  };

  const TimeSlot = ({
    hour,
    slotIndex,
    totalSlots,
    date,
  }: {
    hour: number;
    slotIndex: number;
    totalSlots: number;
    date: Date;
  }) => {
    const slotStartMinute = slotIndex * (60 / totalSlots);
    const slotStart = set(date, {
      hours: hour,
      minutes: slotStartMinute,
      seconds: 0,
      milliseconds: 0,
    });

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: ItemTypes.EVENT,
      drop: (item: Event) => handleEventDrop(item, slotStart),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }));

    return (
      <div
        ref={drop as any}
        className={cn(
          'border-b border-black relative group',
          isOver && canDrop && 'bg-primary/10'
        )}
        style={{ height: `${BASE_SLOT_HEIGHT_PX}px` }}
      >
        <button
          className="absolute inset-0 flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            const dateStr = format(slotStart, 'yyyy-MM-dd');
            const hourStr = slotStart.getHours();
            const minuteStr = slotStart.getMinutes();
            router.push(
              `/master-mind?date=${dateStr}&hour=${hourStr}&minute=${minuteStr}`
            );
          }}
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    );
  };

  if (!isClient) {
    return <CalendarSkeleton />;
  }

  const slotOptions = [
    { slots: 1, label: '1 slot (60 min)' },
    { slots: 2, label: '2 slots (30 min)' },
    { slots: 3, label: '3 slots (20 min)' },
    { slots: 4, label: '4 slots (15 min)' },
    { slots: 6, label: '6 slots (10 min)' },
    { slots: 12, label: '12 slots (5 min)' },
  ];

  return (
    <>
      <div className="p-4 sm:p-6 flex flex-col h-full bg-background">
        <header className="relative text-center mb-6 print:hidden">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Calendar
          </h1>
          <p className="text-muted-foreground">
            Manage your schedule, events and appointments.
          </p>
          <div className="absolute top-0 right-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </header>
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4">
          <div />
          <div className="flex-1 flex justify-center items-center gap-2">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    'w-[280px] justify-center text-center font-normal bg-card text-card-foreground',
                    !currentDate && 'text-muted-foreground'
                  )}
                >
                  <ChevronLeft
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="h-4 w-4"
                  />
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="mx-2">
                    {format(currentDate, 'cccc, LLLL do')}
                  </span>
                  <ChevronRight
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="h-4 w-4"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => {
                    if (date) {
                      setCurrentDate(date);
                      setIsDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleToday} className="bg-card text-card-foreground">
              Today
            </Button>
            <Select value={String(dayCount)} onValueChange={handleDayCountChange}>
              <SelectTrigger className="w-[110px] bg-card text-card-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day} Day{day > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                    <Link href="/settings/rituals">
                      <BrainCircuit className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Planning Rituals</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                    <Link href="/calendar/reminders">
                      <BellRing className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Create a Reminder</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                    <Link href="/master-mind/gtd-instructions">
                      <BookOpen className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>The Ogeemo Method (TOM)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                    <Link href="/calendar/instructions">
                      <Info className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>How to use the calendar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">
                        Display Settings
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Set the visible hours for your calendar day.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="start-time">Start Time</Label>
                        <Select
                          value={String(startHour)}
                          onValueChange={handleStartHourChange}
                        >
                          <SelectTrigger
                            id="start-time"
                            className="col-span-2 h-8"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {hourOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="end-time">End Time</Label>
                        <Select
                          value={String(endHour)}
                          onValueChange={handleEndHourChange}
                        >
                          <SelectTrigger id="end-time" className="col-span-2 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {hourOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <PopoverClose asChild>
                      <Button>Save</Button>
                    </PopoverClose>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="flex h-full border-t border-l border-black">
              {/* Time Column */}
              <div className="w-24 flex-shrink-0 flex flex-col">
                <div className="h-10 border-b border-r border-black flex items-center justify-center" />{' '}
                {/* Spacer for header */}
                {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
                  const hour = startHour + i;
                  const numSlots = hourSlots[hour] || 1;
                  const hourRowHeight = numSlots * BASE_SLOT_HEIGHT_PX;
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center justify-center text-center border-b border-r border-black"
                      style={{ height: `${hourRowHeight}px` }}
                    >
                      <p className="text-xs text-muted-foreground select-none">
                        {format(new Date(0, 0, 0, hour), 'h a')}
                      </p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {slotOptions.map((opt) => (
                            <DropdownMenuItem
                              key={opt.slots}
                              onSelect={() => changeSlotsForHour(hour, opt.slots)}
                            >
                              {opt.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>

              {/* Day Columns */}
              <div
                className="flex-1 grid"
                style={{ gridTemplateColumns: `repeat(${dayCount}, 1fr)` }}
              >
                {visibleDates.map((date) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const todaysEvents = eventsByDate[dateKey] || [];
                  const isToday =
                    format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <div
                      key={dateKey}
                      className={cn(
                        'relative border-r border-black',
                        isToday && 'bg-primary/5'
                      )}
                    >
                      <div className="text-center flex flex-col justify-center border-b border-black h-10">
                        {dayCount === 1 ? (
                          <p className="font-semibold text-sm">
                            {format(date, 'cccc, LLLL do')}
                          </p>
                        ) : (
                          <>
                            <p className="font-semibold text-sm">
                              {format(date, 'EEE')}
                            </p>
                            <p className="text-xs">{format(date, 'd')}</p>
                          </>
                        )}
                      </div>

                      <div className="relative">
                        {/* Hour background lines */}
                        {Array.from({ length: endHour - startHour + 1 }).map(
                          (_, i) => {
                            const hour = startHour + i;
                            const numSlots = hourSlots[hour] || 1;
                            return (
                              <div
                                key={i}
                                className="flex flex-col"
                                style={{
                                  height: `${numSlots * BASE_SLOT_HEIGHT_PX}px`,
                                }}
                              >
                                {Array.from({ length: numSlots }).map(
                                  (_, slotIndex) => (
                                    <TimeSlot
                                      key={slotIndex}
                                      hour={hour}
                                      slotIndex={slotIndex}
                                      totalSlots={numSlots}
                                      date={date}
                                    />
                                  )
                                )}
                              </div>
                            );
                          }
                        )}

                        {/* Events */}
                        {todaysEvents.map((event) => {
                          if (!event.start || !event.end) return null;

                          const visibleStart = new Date(event.start);
                          if (visibleStart.getHours() < startHour) {
                            visibleStart.setHours(startHour, 0, 0, 0);
                          }

                          const visibleEnd = new Date(event.end);
                          if (
                            visibleEnd.getHours() > endHour ||
                            (visibleEnd.getHours() === endHour &&
                              visibleEnd.getMinutes() > 0)
                          ) {
                            visibleEnd.setHours(endHour + 1, 0, 0, 0);
                          }

                          if (
                            visibleEnd <= visibleStart ||
                            visibleStart.getHours() > endHour
                          )
                            return null;

                          let topPosition = 0;
                          const eventStartHour = visibleStart.getHours();

                          for (let h = startHour; h < eventStartHour; h++) {
                            const slotsInHour = hourSlots[h] || 1;
                            topPosition += slotsInHour * BASE_SLOT_HEIGHT_PX;
                          }

                          const eventStartMinute = visibleStart.getMinutes();
                          const slotsInEventHour = hourSlots[eventStartHour] || 1;
                          const minuteOffset =
                            (eventStartMinute / 60) *
                            (slotsInEventHour * BASE_SLOT_HEIGHT_PX);
                          topPosition += minuteOffset;

                          const durationMinutes =
                            differenceInMilliseconds(visibleEnd, visibleStart) /
                            (1000 * 60);
                          
                          let height = 0;
                          let currentHour = visibleStart.getHours();
                          let currentMinute = visibleStart.getMinutes();
                          let minutesRemaining = durationMinutes;

                          while (minutesRemaining > 0 && currentHour <= endHour) {
                            const slotsThisHour = hourSlots[currentHour] || 1;
                            const minutesPerSlot = 60 / slotsThisHour;
                            const minutesLeftInHour = 60 - currentMinute;
                            const minutesToProcess = Math.min(
                              minutesRemaining,
                              minutesLeftInHour
                            );

                            height +=
                              (minutesToProcess / minutesPerSlot) *
                              BASE_SLOT_HEIGHT_PX;

                            minutesRemaining -= minutesToProcess;
                            currentHour++;
                            currentMinute = 0;
                          }

                          if (height <= 0) return null;

                          return (
                            <div
                              key={event.id}
                              style={{
                                top: `${topPosition}px`,
                                height: `${height}px`,
                              }}
                              className="absolute left-0 right-0 flex items-center"
                            >
                              <CalendarEvent
                                event={event}
                                onEdit={handleEditEvent}
                                onDelete={() => setEventToDelete(event)}
                                onToggleComplete={handleToggleComplete}
                                className="w-full"
                                style={{ height: '25px' }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event "{eventToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
