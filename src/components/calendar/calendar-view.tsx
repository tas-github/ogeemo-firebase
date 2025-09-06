
"use client"

import * as React from "react"
import { format, addDays, startOfDay, set, getMinutes, getHours, isSameDay, addMinutes, differenceInMilliseconds } from "date-fns"
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, MoreVertical, BookOpen, Pencil, Trash2, Plus, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getTasksForUser, addTask, updateTask, deleteAllTasksForUser, deleteTask } from "@/services/project-service"
import { type Event } from "@/types/calendar-types"
import { Label } from "../ui/label"
import Link from "next/link"
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
import { Input } from "@/components/ui/input";
import { CalendarEvent, ItemTypes } from "./CalendarEvent"
import { NewTaskDialog } from "../tasks/NewTaskDialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Droppable } from './Droppable';

export function CalendarView() {
    const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
    const [dayCount, setDayCount] = React.useState<number>(1);
    const [events, setEvents] = React.useState<Event[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [startHour, setStartHour] = React.useState(8);
    const [endHour, setEndHour] = React.useState(17);
    
    const [isMakeItHappenDialogOpen, setIsMakeItHappenDialogOpen] = React.useState(false);
    const [eventToEdit, setEventToEdit] = React.useState<Event | null>(null);
    const [eventToDelete, setEventToDelete] = React.useState<Event | null>(null);
    const [hourSlots, setHourSlots] = React.useState<Record<number, number>>({});

    const { user } = useAuth();
    const { toast } = useToast();

    const dayOptions = Array.from({ length: 7 }, (_, i) => i + 1);

    const loadEvents = React.useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const fetchedTasks = await getTasksForUser(user.uid);
            setEvents(fetchedTasks);
        } catch (error: any)
        {
            toast({ variant: 'destructive', title: 'Failed to load events', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);
    
    React.useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handlePrev = () => setCurrentDate(prev => addDays(prev, -dayCount));
    const handleNext = () => setCurrentDate(prev => addDays(prev, dayCount));
    const handleToday = () => setCurrentDate(new Date());

    const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: format(set(new Date(), { hours: i }), 'h a') }));

    const visibleHours = React.useMemo(() => {
        return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
    }, [startHour, endHour]);
    
    const handleEventCreated = (newEvent: Event) => {
        setEvents(prev => [...prev, newEvent]);
        loadEvents(); // Reload to get the latest state
    };

    const handleEventUpdated = (updatedEvent: Event) => {
        setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
        setEventToEdit(null);
        loadEvents(); // Reload to get the latest state
    };
    
    const handleEventDrop = React.useCallback(async (item: Event, newStartTime: Date) => {
        const duration = differenceInMilliseconds(item.end, item.start);
        const newEndTime = new Date(newStartTime.getTime() + duration);

        const updatedEvent = { ...item, start: newStartTime, end: newEndTime };
        
        // Optimistic UI update
        setEvents(prev => prev.map(e => e.id === item.id ? updatedEvent : e));

        try {
            await updateTask(item.id, { start: newStartTime, end: newEndTime });
            toast({ title: 'Event Rescheduled', description: `"${item.title}" moved to ${format(newStartTime, 'PPp')}` });
        } catch (error: any) {
            // Revert on failure
            setEvents(prev => prev.map(e => e.id === item.id ? item : e));
            toast({ variant: 'destructive', title: 'Failed to move event', description: error.message });
        }
    }, [toast]);
    
    const handleConfirmDelete = async () => {
        if (!eventToDelete) return;
        try {
            await deleteTask(eventToDelete.id);
            setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
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

    const TimeSlot = ({ date, hour, slotIndex, totalSlots }: { date: Date, hour: number, slotIndex: number, totalSlots: number }) => {
        const slotDurationMinutes = 60 / totalSlots;
        const slotStartMinute = slotIndex * slotDurationMinutes;
        const slotStart = set(date, { hours: hour, minutes: slotStartMinute, seconds: 0, milliseconds: 0 });
        const slotEnd = addMinutes(slotStart, slotDurationMinutes);

        const eventsInSlot = events.filter(e => 
            isSameDay(e.start, date) &&
            e.start >= slotStart &&
            e.start < slotEnd
        );

        return (
            <Droppable
                type={ItemTypes.EVENT}
                onDrop={(item: Event) => handleEventDrop(item, slotStart)}
                canDrop={() => eventsInSlot.length === 0}
                className="h-8 border border-black rounded-md m-1 flex items-center justify-between p-1"
            >
                <div className="flex-1 flex items-center h-full">
                    {eventsInSlot.map(event => (
                        <CalendarEvent
                            key={event.id}
                            event={event}
                            onEdit={() => { setEventToEdit(event); setIsMakeItHappenDialogOpen(true); }}
                            onDelete={() => setEventToDelete(event)}
                        />
                    ))}
                </div>
            </Droppable>
        );
    };

    return (
        <>
            <div className="p-4 sm:p-6 flex flex-col h-full">
                <header className="text-center mb-6 print:hidden">
                    <h1 className="text-3xl font-bold font-headline text-primary">
                    Calendar
                    </h1>
                    <p className="text-muted-foreground">
                    Manage your schedule, events and appointments.
                    </p>
                </header>
                
                <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
                        <div />
                        <div className="flex-1 flex justify-center items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] justify-center text-center font-normal",
                                            !currentDate && "text-muted-foreground"
                                        )}
                                    >
                                        <ChevronLeft onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="h-4 w-4" />
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        <span className="mx-2">{format(currentDate, "PPP")}</span>
                                        <ChevronRight onClick={(e) => { e.stopPropagation(); handleNext(); }} className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentDate} onSelect={(date) => date && setCurrentDate(date)} initialFocus /></PopoverContent>
                            </Popover>
                            <Button variant="outline" onClick={handleToday}>Today</Button>
                            <Select value={String(dayCount)} onValueChange={(value) => setDayCount(Number(value))}>
                                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {dayOptions.map(day => (
                                        <SelectItem key={day} value={String(day)}>{day} Day{day > 1 ? 's' : ''}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={() => { setEventToEdit(null); setIsMakeItHappenDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Add Event
                            </Button>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                            <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Settings"><Settings className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="w-80"><div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">Display Settings</h4><p className="text-sm text-muted-foreground">Set the visible hours for your calendar day.</p></div><div className="grid gap-2"><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="start-time">Start Time</Label><Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}><SelectTrigger id="start-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="end-time">End Time</Label><Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}><SelectTrigger id="end-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div></div></PopoverContent></Popover>
                        </div>
                    </div>
                    
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                        {visibleDates.map((date) => (
                            <div key={date.toISOString()} className="h-8 flex items-center justify-center border border-black">
                                <p className="text-xs font-semibold text-center">{format(date, 'cccc, LLL do')}</p>
                            </div>
                        ))}
                    </div>
                    
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="relative">
                            {visibleHours.map(hour => {
                                const slots = hourSlots[hour] || 1;

                                return (
                                    <div key={hour} className="flex my-1 border border-black">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <div className="w-[4.5rem] flex-shrink-0 p-1 border-r border-black flex flex-col items-center justify-center cursor-pointer">
                                                    <span className="text-xs text-muted-foreground">{format(new Date(0, 0, 0, hour), 'h a')}</span>
                                                    <ChevronDown className="h-6 w-6 text-black" />
                                                </div>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(numSlots => (
                                                    <DropdownMenuItem key={numSlots} onSelect={() => handleSetHourSlots(hour, numSlots)}>
                                                        {numSlots} slots ({Math.round(60 / numSlots)} min each)
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))`}}>
                                             {visibleDates.map((date, dateIndex) => {
                                                
                                                return (
                                                    <div key={date.toISOString()} className="relative border-l border-black p-1">
                                                        {Array.from({ length: slots }, (_, i) => (
                                                            <TimeSlot 
                                                                key={i}
                                                                date={date}
                                                                hour={hour}
                                                                slotIndex={i}
                                                                totalSlots={slots}
                                                            />
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <NewTaskDialog
                isOpen={isMakeItHappenDialogOpen}
                onOpenChange={setIsMakeItHappenDialogOpen}
                onTaskCreate={handleEventCreated}
                onTaskUpdate={handleEventUpdated}
                eventToEdit={eventToEdit}
                initialMode="task"
                defaultValues={{ isScheduled: true }}
            />

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
