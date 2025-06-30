
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Edit, FileText, ChevronDown, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type Event } from "@/types/calendar";
import { type Project } from "@/data/projects";
import { type ProjectTemplate, type PartialTask } from "@/data/project-templates";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { ProjectInfoCard } from "@/components/tasks/ProjectInfoCard";
import * as ProjectService from '@/services/project-service';

const DialogLoader = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <LoaderCircle className="h-10 w-10 animate-spin text-white" />
    </div>
);

const NewTaskDialog = dynamic(() => import('@/components/tasks/NewTaskDialog'), {
    loading: () => <DialogLoader />,
});

const NewProjectDialog = dynamic(() => import('@/components/tasks/NewProjectDialog'), {
    loading: () => <DialogLoader />,
});

const EditProjectDialog = dynamic(() => import('@/components/tasks/EditProjectDialog'), {
    loading: () => <DialogLoader />,
});


export function TasksView() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [templateToApply, setTemplateToApply] = useState<PartialTask[] | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function loadData(userId: string) {
        setIsLoading(true);
        try {
            const [fetchedProjects, fetchedTasks, fetchedTemplates] = await Promise.all([
                ProjectService.getProjects(userId),
                ProjectService.getTasks(userId),
                ProjectService.getProjectTemplates(userId),
            ]);
            setProjects(fetchedProjects);
            setAllTasks(fetchedTasks);
            setProjectTemplates(fetchedTemplates);

            if (fetchedProjects.length > 0 && !selectedProjectId) {
                setSelectedProjectId(fetchedProjects[0].id);
            }
        } catch (error: any) {
            console.error("Failed to load project data:", error);
            toast({
                variant: "destructive",
                title: "Failed to load data",
                description: error.message || "Could not retrieve data from the database.",
            });
        } finally {
            setIsLoading(false);
        }
    }
    if (user) {
        loadData(user.uid);
    } else {
      setIsLoading(false);
    }
  }, [user, toast, selectedProjectId]);
  
  const tasksForSelectedProject = allTasks.filter(task => task.projectId === selectedProjectId);

  const handleCreateTask = async (taskData: Omit<Event, 'id' | 'userId'>) => {
    if (!user) return;
    try {
        const newTask = await ProjectService.addTask({...taskData, userId: user.uid});
        setAllTasks(prev => [newTask, ...prev]);
         toast({
            title: "Task Created",
            description: `"${newTask.title}" has been successfully created.`,
        });
    } catch (error: any) {
        console.error("Failed to create task:", error);
        toast({ variant: "destructive", title: "Create Task Failed", description: error.message });
    }
  };

  const handleCreateProject = async (projectName: string, projectDescription: string, tasks: PartialTask[]) => {
    if (!user) return;
    try {
        const newProjectData: Omit<Project, 'id'> = {
            name: projectName,
            description: projectDescription,
            userId: user.uid,
        };
        const newProject = await ProjectService.addProject(newProjectData);
        setProjects(prev => [...prev, newProject]);
        setSelectedProjectId(newProject.id);

        if (tasks.length > 0) {
            const newTasksData: Omit<Event, 'id'>[] = tasks.map((task) => ({
                title: task.title,
                description: task.description,
                start: new Date(),
                end: new Date(new Date().getTime() + 30 * 60 * 1000), // Default 30 min duration
                attendees: [],
                status: 'todo',
                projectId: newProject.id,
                userId: user.uid,
            }));
            const addedTasks = await ProjectService.addMultipleTasks(newTasksData);
            setAllTasks(prev => [...prev, ...addedTasks]);
        }
        toast({
            title: "Project Created",
            description: `"${projectName}" has been created with ${tasks.length} tasks.`,
        });
    } catch(error: any) {
        console.error("Failed to create project:", error);
        toast({ variant: "destructive", title: "Create Project Failed", description: error.message });
    }
  };
  
  const handleProjectSave = async (updatedProject: Project, updatedTasks: Event[]) => {
    if (!user) return;
    try {
        await ProjectService.updateProject(updatedProject.id, {
            name: updatedProject.name,
            description: updatedProject.description,
        });
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        
        const otherProjectTasks = allTasks.filter(t => t.projectId !== updatedProject.id);
        setAllTasks([...otherProjectTasks, ...updatedTasks]);

        // In a real scenario, you'd have a more robust way of batch updating tasks.
        // For simplicity here, we assume tasks are just replaced.
        
        toast({
            title: "Project Saved",
            description: `Changes to "${updatedProject.name}" have been saved.`,
        });
    } catch (error: any) {
        console.error("Failed to save project:", error);
        toast({ variant: "destructive", title: "Save Project Failed", description: error.message });
    }
  };

  const handleSaveTemplate = async (name: string, steps: PartialTask[]) => {
    if (!user) return;
    try {
        const newTemplateData: Omit<ProjectTemplate, 'id'> = { name, steps, userId: user.uid };
        const newTemplate = await ProjectService.addProjectTemplate(newTemplateData);
        setProjectTemplates(prev => [...prev, newTemplate]);
        toast({
            title: "Template Saved",
            description: `"${name}" has been saved as a new project template.`,
        });
    } catch (error: any) {
        console.error("Failed to save template:", error);
        toast({ variant: "destructive", title: "Save Template Failed", description: error.message });
    }
  };
  
  const handleSelectTemplate = (template: ProjectTemplate) => {
    setTemplateToApply(template.steps);
    setIsNewProjectOpen(true);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (isLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="text-center pb-4 border-b shrink-0">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Projects Manager
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Oversee your projects from start to finish. All tasks created here are automatically added to your calendar.
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <FileText className="mr-2 h-4 w-4" />
                    Project Templates
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Apply a Template</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {projectTemplates.map((template) => (
                    <DropdownMenuItem key={template.id} onSelect={() => handleSelectTemplate(template)}>
                        {template.name}
                    </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
        {selectedProject ? (
          <ProjectInfoCard project={selectedProject} tasks={tasksForSelectedProject} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center max-w-2xl">
              <h3 className="text-xl font-semibold">Welcome to Your Integrated Workspace</h3>
              <p className="text-muted-foreground mt-2">
                Create or select a project to get started.
              </p>
            </div>
          </div>
        )}
      </main>

      {isNewTaskOpen && <NewTaskDialog isOpen={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} onTaskCreate={handleCreateTask} projectId={selectedProjectId} />}
      
      {isNewProjectOpen && <NewProjectDialog
        isOpen={isNewProjectOpen}
        onOpenChange={(open) => {
            setIsNewProjectOpen(open);
            if (!open) setTemplateToApply(null);
        }}
        onProjectCreate={handleCreateProject}
        templates={projectTemplates}
        onSaveAsTemplate={handleSaveTemplate}
        initialTasks={templateToApply}
      />}
      
      {isEditProjectOpen && selectedProject && <EditProjectDialog
        isOpen={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        project={selectedProject}
        tasks={tasksForSelectedProject}
        onProjectSave={handleProjectSave}
        templates={projectTemplates}
        onSaveAsTemplate={handleSaveTemplate}
      />}
    </div>
  );
}
