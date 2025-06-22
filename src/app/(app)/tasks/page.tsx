
"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { type Event } from "@/types/calendar";
import { initialEvents } from "@/data/events";

function TaskItem({
  title,
  description,
}: {
  title: string;
  description:string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function TasksPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<Event[]>([]);

  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem('calendarEvents');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents).map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }));
        setAllTasks(parsedEvents);
      } else {
        setAllTasks(initialEvents);
        localStorage.setItem('calendarEvents', JSON.stringify(initialEvents));
      }
    } catch (error) {
      console.error("Could not read calendar events from localStorage", error);
      setAllTasks(initialEvents);
    }
  }, []);

  useEffect(() => {
    if (allTasks.length > 0) {
      try {
        localStorage.setItem('calendarEvents', JSON.stringify(allTasks));
      } catch (error) {
        console.error("Could not write calendar events to localStorage", error);
      }
    }
  }, [allTasks]);
  
  const tasksByStatus = {
    todo: allTasks.filter(task => task.status === 'todo'),
    inProgress: allTasks.filter(task => task.status === 'inProgress'),
    done: allTasks.filter(task => task.status === 'done'),
  };

  const handleCreateTask = (newEvent: Event) => {
    setAllTasks(prev => [newEvent, ...prev]);
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 border-b shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Project Manager
          </h1>
          <p className="text-muted-foreground">
            Oversee your projects from start to finish.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            All projects are multiple tasks. Tasks entered here get entered into your calendar automatically.
          </p>
        </div>
        <Button onClick={() => setIsNewTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
        </Button>
      </header>
      <main className="flex-1 grid md:grid-cols-3 gap-6 py-6 min-h-0">
        {/* To Do Column */}
        <Card className="flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>To Do</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4 pt-0">
            {tasksByStatus.todo.map(task => (
              <TaskItem
                key={task.id}
                title={task.title}
                description={task.description}
              />
            ))}
          </CardContent>
        </Card>

        {/* In Progress Column */}
        <Card className="flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>In Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4 pt-0">
            {tasksByStatus.inProgress.map(task => (
               <TaskItem
                key={task.id}
                title={task.title}
                description={task.description}
              />
            ))}
          </CardContent>
        </Card>

        {/* Done Column */}
        <Card className="flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>Done</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4 pt-0">
            {tasksByStatus.done.map(task => (
              <TaskItem
                key={task.id}
                title={task.title}
                description={task.description}
              />
            ))}
          </CardContent>
        </Card>
      </main>
      <NewTaskDialog isOpen={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} onTaskCreate={handleCreateTask} />
    </div>
  );
}
