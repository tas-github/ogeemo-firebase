
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { NewProjectDialog } from "@/components/tasks/NewProjectDialog";
import { EditProjectDialog } from "@/components/tasks/EditProjectDialog";
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


export default function TasksPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem('projects');
      if (storedProjects) {
        let projectsFromStorage = JSON.parse(storedProjects);
        const projectOne = projectsFromStorage.find((p: Project) => p.id === 'proj-1');
        if (projectOne && projectOne.name === 'General Tasks') {
            projectOne.name = 'Project List';
            localStorage.setItem('projects', JSON.stringify(projectsFromStorage));
        }
        setProjects(projectsFromStorage);
      } else {
        setProjects(initialProjects);
        localStorage.setItem('projects', JSON.stringify(initialProjects));
      }
    } catch (error) => {
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
      } catch (error) => {
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
    } catch (error) => {
      console.error("Could not read calendar events from localStorage", error);
      setAllTasks(initialEvents);
    }
  }, []);

  useEffect(() => {
    if (allTasks.length > 0) {
      try {
        localStorage.setItem('calendarEvents', JSON.stringify(allTasks));
      } catch (error) => {
        console.error("Could not write calendar events to localStorage", error);
      }
    }
  }, [allTasks]);
  
  const tasksForSelectedProject = allTasks.filter(task => task.projectId === selectedProjectId);

  const handleCreateTask = (newEvent: Event) => {
    setAllTasks(prev => [newEvent, ...prev]);
  };

  type PartialTask = { title: string; description: string };

  const handleCreateProject = (projectName: string, projectDescription: string, tasks: PartialTask[]) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      description: projectDescription,
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);

    const newTasks: Event[] = tasks.map((task, index) => ({
      id: `task-${newProject.id}-${Date.now()}-${index}`,
      title: task.title,
      description: task.description,
      start: new Date(),
      end: new Date(new Date().getTime() + 30 * 60000), // Default 30 min duration
      attendees: [],
      status: 'todo',
      projectId: newProject.id,
    }));

    setAllTasks(prev => [...prev, ...newTasks]);

    toast({
      title: "Project Created",
      description: `"${projectName}" has been created with ${tasks.length} tasks.`,
    });
  };
  
  const handleProjectSave = (updatedProject: Project, newTasks: Event[]) => {
    setProjects(prevProjects => prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    const otherProjectTasks = allTasks.filter(t => t.projectId !== updatedProject.id);
    setAllTasks([...otherProjectTasks, ...newTasks]);

    toast({
      title: "Project Saved",
      description: `Changes to "${updatedProject.name}" have been saved.`,
    });
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="text-center pb-4 border-b shrink-0">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Project Task Manager
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          All projects are multiple tasks. Tasks entered here get entered into your calendar automatically.
        </p>
      </header>

      <div className="flex items-center justify-between py-4 flex-wrap gap-4">
        <Select value={selectedProjectId ?? ''} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[250px] bg-primary text-primary-foreground hover:bg-primary/90 border-primary [&>svg]:opacity-100">
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
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsNewProjectOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Project
            </Button>
            <Button onClick={() => {}} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <FileText className="mr-2 h-4 w-4" />
                Project Templates
            </Button>
            <Button onClick={() => setIsEditProjectOpen(true)} disabled={!selectedProjectId} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
            <Button onClick={() => setIsNewTaskOpen(true)} disabled={!selectedProjectId}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
            </Button>
        </div>
      </div>

      <main className="flex-1 min-h-0">
        {selectedProject && selectedProject.id !== 'proj-1' ? (
          <ProjectInfoCard project={selectedProject} tasks={tasksForSelectedProject} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center max-w-2xl">
              <h3 className="text-xl font-semibold">Welcome to Your Integrated Workspace</h3>
              <p className="text-muted-foreground mt-2">
                Here, projects, tasks, and your calendar work together seamlessly. Every project is a collection of tasks, and every task you create can be instantly added to your calendar. This integration helps you visualize your workload, manage deadlines, and ensure nothing falls through the cracks. Select a project to get started, or create a new one to begin organizing your work.
              </p>
            </div>
          </div>
        )}
      </main>

      <NewTaskDialog isOpen={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} onTaskCreate={handleCreateTask} projectId={selectedProjectId} />
      <NewProjectDialog isOpen={isNewProjectOpen} onOpenChange={setIsNewProjectOpen} onProjectCreate={handleCreateProject} />
      <EditProjectDialog
        isOpen={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        project={selectedProject}
        tasks={tasksForSelectedProject}
        onProjectSave={handleProjectSave}
      />
    </div>
  );
}
