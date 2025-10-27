
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjectById, getTasksForProject, updateTask, updateTaskPositions } from '@/services/project-service';
import { type Project, type Event as TaskEvent } from '@/types/calendar';
import { addDays, differenceInDays, format, startOfWeek, eachDayOfInterval } from 'date-fns';
import { useDrop, useDrag, XYCoord } from 'react-dnd';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const DAY_WIDTH_PX = 40;

const ItemTypes = {
  TASK: 'task',
};

interface DraggableUnscheduledTaskProps {
  task: TaskEvent;
}
const DraggableUnscheduledTask = ({ task }: DraggableUnscheduledTaskProps) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TASK,
        item: task,
        collect: monitor => ({ isDragging: !!monitor.isDragging() }),
    }));
    return (
        <div ref={drag} className={cn("p-2 border rounded-md bg-muted flex items-center gap-2 cursor-move", isDragging && 'opacity-50')}>
           <GripVertical className="h-4 w-4 text-muted-foreground" />
           <p className="text-sm">{task.title}</p>
        </div>
    );
};

interface DraggableTaskRowProps {
  task: TaskEvent;
  index: number;
  moveTask: (draggedId: string, hoverId: string) => void;
  children: React.ReactNode;
}

const DraggableTaskRow: React.FC<DraggableTaskRowProps> = ({ task, index, moveTask, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TASK,
    item: () => ({ ...task, index }),
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.TASK,
    hover: (item: TaskEvent & { index: number }) => {
      if (!ref.current || item.id === task.id) return;
      moveTask(item.id, task.id);
    },
  });

  drag(drop(ref));

  return (
    <div ref={ref} className={cn("flex items-center", isDragging && "opacity-20")}>
      {children}
    </div>
  );
};


const Taskbar = ({ task, startDate, totalDays }: { task: TaskEvent, startDate: Date, totalDays: number }) => {
  if (!task.start || !task.end) return null;

  const leftOffsetDays = differenceInDays(task.start, startDate);
  const durationDays = differenceInDays(task.end, task.start) + 1;

  if (leftOffsetDays + durationDays <= 0 || leftOffsetDays >= totalDays) return null; 

  const left = Math.max(leftOffsetDays, 0);
  const width = Math.min(durationDays, totalDays - left);


  const style = {
    left: `${left * DAY_WIDTH_PX}px`,
    width: `${width * DAY_WIDTH_PX}px`,
  };

  return (
    <div style={style} className="absolute h-8 top-1/2 -translate-y-1/2 flex items-center bg-primary/80 rounded-lg px-2 text-white text-xs z-10">
      <p className="truncate">{task.title}</p>
    </div>
  );
};


export function ProjectTimelineView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewStartDate, setViewStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [zoomLevel, setZoomLevel] = useState<'week' | 'month' | 'quarter'>('month');

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const loadData = useCallback(async () => {
    if (!user || !projectId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [projectData, tasksData] = await Promise.all([
        getProjectById(projectId),
        getTasksForProject(projectId),
      ]);
      setProject(projectData);
      setTasks(tasksData.sort((a,b) => a.position - b.position));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load project data', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, user, toast]);

  useEffect(() => {
    if (projectId) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [projectId, loadData]);
  
  const handleDropTaskOnTimeline = async (task: TaskEvent, date: Date) => {
    const duration = task.end && task.start ? differenceInDays(task.end, task.start) : 0;
    const newEnd = addDays(date, duration);
    
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, start: date, end: newEnd } : t));
    
    try {
        await updateTask(task.id, { start: date, end: newEnd });
        toast({ title: 'Task Scheduled', description: `"${task.title}" has been moved.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update task schedule.' });
        loadData(); // Revert on failure
    }
  };

  const { days, totalDays, timeIntervals } = useMemo(() => {
    let start = viewStartDate;
    let end: Date;
    if (zoomLevel === 'week') {
      end = addDays(start, 6);
    } else if (zoomLevel === 'quarter') {
      end = addDays(start, 89);
    } else { // month
      end = addDays(start, 29);
    }
    const days = eachDayOfInterval({ start, end });
    const totalDays = days.length;
    
    const intervals = [];
    if (zoomLevel === 'week') {
        for(let i=0; i < totalDays; i++) {
            intervals.push({ label: format(days[i], 'EEE d'), colSpan: 1});
        }
    } else if (zoomLevel === 'month') {
         for(let i=0; i < totalDays; i+=7) {
            intervals.push({ label: `Week of ${format(days[i], 'MMM d')}`, colSpan: 7});
        }
    } else { // quarter
         let currentMonth = -1;
         let currentMonthLabel = '';
         let currentColSpan = 0;

         for (const day of days) {
            const month = format(day, 'MMMM yyyy');
            if (month !== currentMonthLabel) {
                if (currentMonthLabel) {
                    intervals.push({ label: currentMonthLabel, colSpan: currentColSpan });
                }
                currentMonthLabel = month;
                currentColSpan = 1;
            } else {
                currentColSpan++;
            }
         }
         if (currentMonthLabel) {
            intervals.push({ label: currentMonthLabel, colSpan: currentColSpan });
        }
    }

    return { days, totalDays, timeIntervals: intervals };
  }, [viewStartDate, zoomLevel]);

  const sortedTasks = useMemo(() => tasks.sort((a,b) => a.position - b.position), [tasks]);
  const scheduledTasks = sortedTasks.filter(t => t.start && t.end);
  const unscheduledTasks = sortedTasks.filter(t => !t.start);
  
  const moveDate = (amount: number) => {
    const daysToMove = zoomLevel === 'week' ? 7 : zoomLevel === 'month' ? 30 : 90;
    setViewStartDate(prev => addDays(prev, amount * daysToMove));
  };
  
    const moveTask = useCallback(async (draggedId: string, hoverId: string) => {
        const dragTask = tasks.find(t => t.id === draggedId);
        const hoverTask = tasks.find(t => t.id === hoverId);

        if (!dragTask || !hoverTask || dragTask.id === hoverTask.id) {
            return;
        }

        let newTasks = [...tasks];
        const dragIndex = newTasks.findIndex(t => t.id === dragId);
        
        // Remove the dragged task
        newTasks.splice(dragIndex, 1);
        
        // Find the index of the hover task in the new array
        const hoverIndex = newTasks.findIndex(t => t.id === hoverId);
        
        // Re-insert the dragged task
        newTasks.splice(hoverIndex, 0, dragTask);

        const tasksToUpdate = newTasks.map((task, index) => ({
            id: task.id,
            position: index,
            status: task.status, // Keep original status
        }));
        
        // Optimistic UI update
        setTasks(newTasks.map((task, index) => ({ ...task, position: index })));

        try {
            await updateTaskPositions(tasksToUpdate);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to reorder tasks", description: error.message });
            setTasks(tasks); // Revert on failure
        }
    }, [tasks, toast]);

  
  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin" /></div>;
  }

  if (!projectId) {
    return <div className="text-center p-8">Please select a project to view its timeline.</div>;
  }
  
  const DateCell = ({ day }: { day: Date }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: ItemTypes.TASK,
      drop: (item: TaskEvent) => handleDropTaskOnTimeline(item, day),
      collect: monitor => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }), [day]);

    return (
        <div ref={drop} className={cn("h-full border-r", isOver && canDrop && 'bg-primary/20')} />
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => moveDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"}><CalendarIcon className="mr-2 h-4 w-4" />{format(viewStartDate, "PPP")}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={viewStartDate} onSelect={date => date && setViewStartDate(date)} initialFocus /></PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => moveDate(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
         <div className="flex items-center gap-2">
            <Button variant={zoomLevel === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setZoomLevel('week')}>Week</Button>
            <Button variant={zoomLevel === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setZoomLevel('month')}>Month</Button>
            <Button variant={zoomLevel === 'quarter' ? 'default' : 'outline'} size="sm" onClick={() => setZoomLevel('quarter')}>Quarter</Button>
        </div>
      </header>
      
      <div className="grid grid-cols-[250px_1fr] gap-4">
        <div>
          <h3 className="font-semibold mb-2">Tasks ({tasks.length})</h3>
          <div className="space-y-2 p-2 border rounded-lg h-[60vh] overflow-y-auto">
            {unscheduledTasks.map(task => (
                <DraggableUnscheduledTask key={task.id} task={task} />
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
            <div style={{width: `${totalDays * DAY_WIDTH_PX}px`}}>
                <div className="sticky top-0 z-20 bg-background">
                     <div className="flex">
                        {timeIntervals.map((interval, i) => (
                             <div key={i} className="text-center text-sm font-semibold border-b p-1" style={{width: `${interval.colSpan * DAY_WIDTH_PX}px`}}>
                                {interval.label}
                             </div>
                        ))}
                    </div>
                     <div className="flex">
                        {days.map((day, i) => (
                             <div key={i} className="text-center text-xs text-muted-foreground border-r border-b" style={{width: `${DAY_WIDTH_PX}px`}}>
                                {format(day, 'd')}
                             </div>
                        ))}
                    </div>
                </div>

                <div className="relative">
                     {/* Rows for tasks */}
                    {scheduledTasks.map((task, index) => (
                        <DraggableTaskRow key={task.id} index={index} task={task} moveTask={moveTask}>
                           <div className="w-full relative h-10 border-b">
                                <Taskbar task={task} startDate={viewStartDate} totalDays={totalDays}/>
                            </div>
                        </DraggableTaskRow>
                    ))}
                    {/* Grid background for dropping unscheduled tasks */}
                     <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}>
                        {days.map((day, i) => <DateCell key={i} day={day} />)}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
