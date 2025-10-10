
"use client"

import * as React from "react"
import { format, addDays, startOfDay, set, isSameDay, addMinutes, differenceInMilliseconds, getHours, getMinutes } from "date-fns"
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, MoreVertical, Pencil, Trash2, Plus, ChevronDown, X, FilterX, Info, BookOpen, BellRing, BrainCircuit } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getTasksForUser, updateTask, deleteTask, getProjectById, type Project } from "@/services/project-service"
import { type Event, type TaskStatus } from "@/types/calendar-types"
import { Label } from "../ui/label"
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarEvent, ItemTypes as EventItemTypes } from "./CalendarEvent"
import { Droppable } from './Droppable';
import { CalendarSkeleton } from "./calendar-skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

const CALENDAR_DAY_COUNT_KEY = 'calendarDayCount';
const CALENDAR_START_HOUR_KEY = 'calendarStartHour';
const CALENDAR_END_HOUR_KEY = 'calendarEndHour';


export function CalendarView() {
    const [isClient, setIsClient] = React.useState(false);
    const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
    const [dayCount, setDayCount] = React.useState<number>(1);
    const [allEvents, setAllEvents] = React.useState<Event[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [startHour, setStartHour] = React.useState(8);
    const [endHour, setEndHour] = React.useState(17);
    
    const [eventToDelete, setEventToDelete] = React.useState<Event | null>(null);
    const [hourSlots, setHourSlots] = React.useState<Record<number, number>>({});
    
    const [filteredProject, setFilteredProject] = React.useState<Project | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

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

            const projectId = searchParams.get('projectId');
            if (projectId) {
                const project = await getProjectById(projectId);
                setFilteredProject(project);
            } else {
                setFilteredProject(null);
            }

        } catch (error: any)
        {
            toast({ variant: 'destructive', title: 'Failed to load events', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast, searchParams]);
    
    React.useEffect(() => {
        loadEvents();
    }, [loadEvents]);
    
    const events = React.useMemo(() => {
        if (filteredProject) {
            return allEvents.filter(event => event.projectId === filteredProject.id);
        }
        return allEvents;
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
            console.error("Failed to load calendar preferences:", error);
        }
    }, [isClient]);

    const handleDayCountChange = (value: string) => {
        const newDayCount = Number(value);
        setDayCount(newDayCount);
        try {
            localStorage.setItem(CALENDAR_DAY_COUNT_KEY, String(newDayCount));
        } catch (error) {
            console.error("Failed to save calendar preferences:", error);
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
    
    const handlePrev = () => setCurrentDate(prev => addDays(prev, -dayCount));
    const handleNext = () => setCurrentDate(prev => addDays(prev, dayCount));
    const handleToday = () => {
        setCurrentDate(new Date());
    };
    
    const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: format(set(new Date(), { hours: i }), 'h a') }));

    const visibleHours = React.useMemo(() => {
        return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
    }, [startHour, endHour]);
    
    const handleEventDrop = React.useCallback(async (item: Event, newStartTime: Date) => {
        if (!item.start || !item.end) return;
        const duration = differenceInMilliseconds(item.end, item.start);
        const newEndTime = new Date(newStartTime.getTime() + duration);

        const updatedEvent = { ...item, start: newStartTime, end: newEndTime };
        
        setAllEvents(prev => prev.map(e => e.id === item.id ? updatedEvent : e));

        try {
            await updateTask(item.id, { start: newStartTime, end: newEndTime });
            toast({ title: 'Event Rescheduled', description: `"${item.title}" moved to ${format(newStartTime, 'PPp')}` });
        } catch (error: any) {
            setAllEvents(prev => prev.map(e => e.id === item.id ? item : e));
            toast({ variant: 'destructive', title: 'Failed to move event', description: error.message });
        }
    }, [toast]);
    
    const handleAddNewEvent = (startTime: Date) => {
        const date = format(startTime, 'yyyy-MM-dd');
        const hour = getHours(startTime);
        const minute = getMinutes(startTime);
        router.push(`/master-mind?date=${date}&hour=${hour}&minute=${minute}`);
    };

    const handleConfirmDelete = async () => {
        if (!eventToDelete) return;
        try {
            await deleteTask(eventToDelete.id);
            setAllEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
            toast({ title: "Event Deleted" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to delete event', description: error.message });
        } finally {
            setEventToDelete(null);
        }
    };
    
    const handleSetHourSlots = (hour: number, slots: number) => {
        setHourSlots(prev => ({ ...prev, [hour]: slots }));
    };

    const handleEditEvent = (event: Event) => {
        router.push(`/master-mind?eventId=${event.id}`);
    };
    
    const handleToggleComplete = async (event: Event) => {
        const newStatus: TaskStatus = event.status === 'done' ? 'todo' : 'done';
        const updatedEvent = { ...event, status: newStatus };

        setAllEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e));
        
        try {
            await updateTask(event.id, { status: newStatus });
            toast({ title: `Task ${newStatus === 'done' ? 'completed' : 'reopened'}` });
        } catch (error: any) {
            setAllEvents(prev => prev.map(e => e.id === event.id ? event : e));
            toast({ variant: 'destructive', title: 'Failed to update task status' });
        }
    };

    const clearFilter = () => {
        setFilteredProject(null);
        router.push(pathname);
    };

    const TimeSlot = ({ date, hour, slotIndex, totalSlots }: { date: Date, hour: number, slotIndex: number, totalSlots: number }) => {
        const slotDurationMinutes = 60 / totalSlots;
        const slotStartMinute = slotIndex * slotDurationMinutes;
        const slotStart = set(date, { hours: hour, minutes: slotStartMinute, seconds: 0, milliseconds: 0 });
        
        const eventsInSlot = events
            .filter(e =>
                e.start &&
                isSameDay(e.start, date) &&
                getHours(e.start) === hour &&
                getMinutes(e.start) >= slotStartMinute &&
                getMinutes(e.start) < (slotStartMinute + slotDurationMinutes)
            )
            .sort((a, b) => a.start!.getTime() - b.start!.getTime());
        
        return (
            <div className="m-px border border-black p-1 bg-background flex flex-col space-y-1 min-h-[34px]">
                <Droppable
                    type={EventItemTypes.EVENT}
                    onDrop={(item) => handleEventDrop(item as Event, slotStart)}
                    className="w-full relative group flex-1"
                >
                    {eventsInSlot.length > 0 ? (
                        eventsInSlot.map(event => (
                            <CalendarEvent
                                key={event.id}
                                event={event}
                                onEdit={handleEditEvent}
                                onDelete={() => setEventToDelete(event)}
                                onToggleComplete={handleToggleComplete}
                            />
                        ))
                    ) : (
                        <>
                            <div className="w-full h-full relative" />
                            <button
                                className="absolute inset-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity pl-2 w-full text-left"
                                onClick={() => handleAddNewEvent(slotStart)}
                            >
                                <Plus className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </>
                    )}
                </Droppable>
            </div>
        );
    };
    
    if (!isClient) {
        return <CalendarSkeleton />;
    }

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
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/action-manager">
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close and go to Action Manager</span>
                            </Link>
                        </Button>
                    </div>
                </header>
                 <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between flex-wrap gap-4 pb-4">
                        <div />
                        <div className="flex-1 flex justify-center items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        
                                        className={cn(
                                            "w-[280px] justify-center text-center font-normal bg-card text-card-foreground border border-black",
                                            !currentDate && "text-muted-foreground"
                                        )}
                                    >
                                        <ChevronLeft onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="h-4 w-4" />
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        <span className="mx-2">{format(currentDate, "cccc, LLLL do")}</span>
                                        <ChevronRight onClick={(e) => { e.stopPropagation(); handleNext(); }} className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentDate} onSelect={(date) => date && setCurrentDate(date)} initialFocus /></PopoverContent>
                            </Popover>
                            <Button onClick={handleToday} className="bg-card text-card-foreground border border-black">Today</Button>
                            <Select value={String(dayCount)} onValueChange={handleDayCountChange}>
                                <SelectTrigger className="w-[110px] bg-card text-card-foreground border border-black"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {dayOptions.map(day => (
                                        <SelectItem key={day} value={String(day)}>{day} Day{day > 1 ? 's' : ''}</SelectItem>
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
                            <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Settings"><Settings className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="w-80 relative"><PopoverClose className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"><X className="h-4 w-4" /><span className="sr-only">Close</span></PopoverClose><div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">Display Settings</h4><p className="text-sm text-muted-foreground">Set the visible hours for your calendar day.</p></div><div className="grid gap-2"><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="start-time">Start Time</Label><Select value={String(startHour)} onValueChange={handleStartHourChange}><SelectTrigger id="start-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="end-time">End Time</Label><Select value={String(endHour)} onValueChange={handleEndHourChange}><SelectTrigger id="end-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div></div></PopoverContent></Popover>
                        </div>
                    </div>
                    
                    {filteredProject && (
                        <div className="py-2 px-4 bg-primary/10 text-primary-foreground rounded-md flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">
                                Viewing schedule for: <strong>{filteredProject.name}</strong>
                            </p>
                            <Button variant="ghost" size="sm" onClick={clearFilter} className="text-foreground hover:bg-background/20">
                                <FilterX className="mr-2 h-4 w-4" />
                                Clear Filter
                            </Button>
                        </div>
                    )}
                    
                    <div className="flex w-full justify-between items-center bg-background text-sm font-semibold">
                        <div className="m-px p-1 w-28 text-center invisible border border-transparent">Time</div>
                        {visibleDates.map((date) => (
                            <div key={date.toISOString()} className="flex-1 text-center p-1 m-px border border-black bg-card">
                                <p>{format(date, 'cccc, LLLL do')}</p>
                            </div>
                        ))}
                    </div>

                    <ScrollArea className="flex-1 min-h-0 bg-background">
                        <div className="flex flex-col">
                            {visibleHours.map((hour) => (
                                <div key={hour} className="flex">
                                    <div className="m-px p-1 border border-black bg-card w-28 flex items-center justify-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-full w-full p-1 text-xs text-muted-foreground group flex items-center justify-center">
                                                    <span>{format(new Date(0, 0, 0, hour), 'h a')}</span>
                                                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground/50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(numSlots => (
                                                    <DropdownMenuItem key={numSlots} onSelect={() => handleSetHourSlots(hour, numSlots)}>
                                                        {numSlots} slot{numSlots > 1 ? 's' : ''} ({Math.round(60 / numSlots)} min each)
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                                        {visibleDates.map((date) => (
                                            <div key={date.toISOString()} className="flex flex-col">
                                                {Array.from({ length: hourSlots[hour] || 1 }, (_, i) => (
                                                    <TimeSlot key={i} date={date} hour={hour} slotIndex={i} totalSlots={hourSlots[hour] || 1} />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                 </div>
            </div>
  
            <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the event "{eventToDelete?.title}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
