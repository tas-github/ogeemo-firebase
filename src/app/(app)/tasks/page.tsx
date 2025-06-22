
"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { NewProjectDialog } from "@/components/tasks/NewProjectDialog";
import { type Event } from "@/types/calendar";
import { type Project } from "@/data/projects";
import { initialEvents } from "@/data/events";
import { initialProjects } from "@/data/projects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ProjectInfoCard } from "@/components/tasks/ProjectInfoCard";


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
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem('projects');
      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      } else {
        setProjects(initialProjects);
        localStorage.setItem('projects', JSON.stringify(initialProjects));
      }
    } catch (error) {
      console.error("Could not read projects from localStorage", error);
      setProjects(initialProjects);
    }
  }, []);
  
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);
  
  useEffect(() => {
    if (projects.length > 0) {
      try {
        localStorage.setItem('projects', JSON.stringify(projects));
      } catch (error) {
        console.error("Could not write projects to localStorage", error);
      }
    }
  }, [projects]);


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
  
  const tasksForSelectedProject = allTasks.filter(task => task.projectId === selectedProjectId);
  
  const tasksByStatus = {
    todo: tasksForSelectedProject.filter(task => task.status === 'todo'),
    inProgress: tasksForSelectedProject.filter(task => task.status === 'inProgress'),
    done: tasksForSelectedProject.filter(task => task.status === 'done'),
  };

  const handleCreateTask = (newEvent: Event) => {
    setAllTasks(prev => [newEvent, ...prev]);
  };

  const handleCreateProject = (projectName: string, projectDescription: string) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      description: projectDescription,
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    toast({
      title: "Project Created",
      description: `"${projectName}" has been created.`,
    });
  };
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 border-b shrink-0 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold font-headline text-primary">
              Project Manager
            </h1>
            <Select value={selectedProjectId ?? ''} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            All projects are multiple tasks. Tasks entered here get entered into your calendar automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsNewProjectOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
            </Button>
            <Button onClick={() => setIsNewTaskOpen(true)} disabled={!selectedProjectId}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
            </Button>
        </div>
      </header>
      <main className="flex-1 grid md:grid-cols-3 gap-6 py-6 min-h-0">
        {selectedProject && (
          <ProjectInfoCard project={selectedProject} tasks={tasksForSelectedProject} />
        )}

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
      <NewTaskDialog isOpen={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} onTaskCreate={handleCreateTask} projectId={selectedProjectId} />
      <NewProjectDialog isOpen={isNewProjectOpen} onOpenChange={setIsNewProjectOpen} onProjectCreate={handleCreateProject} />
    </div>
  );
}
