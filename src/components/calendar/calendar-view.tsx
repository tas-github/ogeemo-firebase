
"use client"

import * as React from "react"
import { format, addDays, startOfDay, set, differenceInMinutes, addMinutes, getMinutes, getHours, isSameDay, eachDayOfInterval } from "date-fns"
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon } from "lucide-react"
import { useDrop } from 'react-dnd';

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarShadCN } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getTasksForUser, updateTask, type Project } from "@/services/project-service"
import { getContacts, type Contact } from "@/services/contact-service";
import { type Event } from "@/types/calendar-types"
import { Label } from "../ui/label"
import { DraggableEvent, ItemTypes as EventItemTypes } from './DraggableEvent';
import { DraggableAddEventButton, ItemTypes as AddItemTypes } from './DraggableAddEventButton';
import { NewTaskDialog } from '../tasks/NewTaskDialog';

const minuteHeight = 2; // Each minute is 2px high, so an hour is 120px

export function CalendarView() {
    const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
    const [dayCount, setDayCount] = React.useState<number>(1);
    const [events, setEvents] = React.useState<Event[]>([]);
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [contacts, setContacts] = React.useState<Contact[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [startHour, setStartHour] = React.useState(8);
    const [endHour, setEndHour] = React.useState(17);
    
    const [eventToEdit, setEventToEdit] = React.useState<Event | null>(null);
    const [isNewEventDialogOpen, setIsNewEventDialogOpen] = React.useState(false);
    const [newEventInitialData, setNewEventInitialData] = React.useState<Partial<Event>>({});
    
    const { user } = useAuth();
    const { toast } = useToast();

    const loadEvents = React.useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [fetchedTasks, fetchedContacts] = await Promise.all([
                getTasksForUser(user.uid),
                getContacts(user.uid)
            ]);
            setEvents(fetchedTasks.filter(task => task.isScheduled && task.start && task.end));
            setContacts(fetchedContacts);
        } catch (error: any)
        {
            toast({ variant: 'destructive', title: 'Failed to load events', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);
    
    React.useEffect(() => {
        const handleTasksUpdate = () => {
            loadEvents();
        };
        window.addEventListener('tasksUpdated', handleTasksUpdate);
        loadEvents();
        return () => {
            window.removeEventListener('tasksUpdated', handleTasksUpdate);
        };
    }, [loadEvents]);

    const handleTaskUpdate = (updatedTask: Event, isNew: boolean) => {
        if (isNew) {
             setEvents(prev => [...prev, updatedTask]);
        } else {
             setEvents(prev => prev.map(e => e.id === updatedTask.id ? updatedTask : e));
        }
    };

    const handlePrev = () => setCurrentDate(prev => addDays(prev, -dayCount));
    const handleNext = () => setCurrentDate(prev => addDays(prev, dayCount));
    const handleToday = () => setCurrentDate(new Date());

    const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: format(set(new Date(), { hours: i }), 'h a') }));

    const handleDropOnSlot = async (item: Event | { type: string }, day: Date, hour: number, minutes: number) => {
        const dropTime = set(day, { hours: hour, minutes, seconds: 0, milliseconds: 0 });

        if (item.type === AddItemTypes.ADD_EVENT) {
            setEventToEdit(null);
            setNewEventInitialData({
                start: dropTime,
                end: addMinutes(dropTime, 60),
            });
            setIsNewEventDialogOpen(true);
        } else {
            const droppedEvent = item as Event;
            const duration = differenceInMinutes(droppedEvent.end!, droppedEvent.start!);
            const newEnd = addMinutes(dropTime, duration);

            const updatedEvent = { ...droppedEvent, start: dropTime, end: newEnd };
            
            // Optimistic update
            setEvents(prev => prev.map(e => e.id === droppedEvent.id ? updatedEvent : e));

            try {
                await updateTask(droppedEvent.id, { start: dropTime, end: newEnd });
                toast({ title: "Event Updated", description: `"${droppedEvent.title}" moved to ${format(dropTime, 'PP p')}.` });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Failed to move event', description: error.message });
                setEvents(prev => prev.map(e => e.id === droppedEvent.id ? droppedEvent : e)); // Revert on failure
            }
        }
    };

    const days = eachDayOfInterval({
        start: startOfDay(currentDate),
        end: startOfDay(addDays(currentDate, dayCount - 1))
    });
    
    return (
        <>
            <div className="p-4 sm:p-6 flex flex-col h-full">
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold font-headline text-primary">Calendar</h1>
                    <p className="text-muted-foreground">Manage your schedule, events and appointments.</p>
                </header>
                 <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
                        <div className="flex items-center gap-2">
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(currentDate, "PPP")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CalendarShadCN mode="single" selected={currentDate} onSelect={(date) => date && setCurrentDate(date)} initialFocus/>
                                </PopoverContent>
                            </Popover>
                             <Button variant="outline" size="icon" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
                            <Button variant="outline" onClick={handleToday}>Today</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-48"><DraggableAddEventButton /></div>
                            <Select value={String(dayCount)} onValueChange={(val) => setDayCount(Number(val))}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Day View</SelectItem>
                                    <SelectItem value="3">3-Day View</SelectItem>
                                    <SelectItem value="7">Week View</SelectItem>
                                </SelectContent>
                            </Select>
                             <Popover>
                                <PopoverTrigger asChild><Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button></PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                    <div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">Settings</h4><p className="text-sm text-muted-foreground">Adjust visible hours.</p></div>
                                        <div className="grid gap-2">
                                            <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="start-hour">Start</Label><Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent>{hourOptions.map(h => <SelectItem key={`start-${h.value}`} value={h.value}>{h.label}</SelectItem>)}</SelectContent></Select></div>
                                            <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="end-hour">End</Label><Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}><SelectTrigger className="col-span-2"><SelectValue/></SelectTrigger><SelectContent>{hourOptions.map(h => <SelectItem key={`end-${h.value}`} value={h.value}>{h.label}</SelectItem>)}</SelectContent></Select></div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    {/* Calendar Body */}
                    <div className="flex-1 mt-2 overflow-auto border-t border-black">
                        <div className="h-full w-full flex" style={{ minWidth: `${80 + days.length * 200}px` }}>
                            {/* Time gutter */}
                            <div className="w-24 shrink-0 border-r border-black">
                                {Array.from({ length: endHour - startHour + 1 }).map((_, i) => <div key={`time-label-${i}`} className="relative h-[120px] border-b border-black text-right pr-2"><span className="absolute top-0 right-2 -translate-y-1/2 text-sm text-muted-foreground">{format(set(new Date(), { hours: startHour + i }), 'h a')}</span></div>)}
                            </div>
                            {/* Day columns */}
                            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
                                {days.map(day => (
                                    <div key={day.toString()} className="relative border-r border-black last:border-r-0">
                                        {Array.from({ length: (endHour - startHour) * 4 }).map((_, i) => {
                                            const hour = startHour + Math.floor(i / 4);
                                            const minutes = (i % 4) * 15;
                                            const [, drop] = useDrop(() => ({ accept: [EventItemTypes.EVENT, AddItemTypes.ADD_EVENT], drop: (item) => handleDropOnSlot(item, day, hour, minutes) }));
                                            return <div key={`${hour}-${minutes}`} ref={drop} className="h-[30px] border-b border-gray-200 last:border-b-0" />;
                                        })}
                                        {events.filter(e => isSameDay(e.start!, day)).map(event => {
                                            const top = (getHours(event.start!) * 60 + getMinutes(event.start!) - startHour * 60) * minuteHeight;
                                            const height = differenceInMinutes(event.end!, event.start!) * minuteHeight;
                                            return <DraggableEvent key={event.id} event={event} style={{ top, height }} onClick={() => { setEventToEdit(event); setIsNewEventDialogOpen(true); }} />;
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <NewTaskDialog 
                isOpen={isNewEventDialogOpen}
                onOpenChange={setIsNewEventDialogOpen}
                onTaskUpdate={handleTaskUpdate}
                eventToEdit={eventToEdit}
                contacts={contacts}
                projects={projects}
                initialMode="event"
                initialData={newEventInitialData}
            />
        </>
    );
}
