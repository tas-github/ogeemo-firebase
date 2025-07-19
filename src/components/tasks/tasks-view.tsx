
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Edit, Trash2, LoaderCircle, ArrowLeft, Eye, MoreVertical, FileText } from "lucide-react";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Button } from "@/components/ui/button";
import { type Event } from "@/types/calendar";
import { type Project } from "@/data/projects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import * as ProjectService from '@/services/project-service';
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
import { TaskBoard } from "@/components/tasks/TaskBoard";

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
  const [projectTemplates, setProjectTemplates] = useState<ProjectService.ProjectTemplate[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskToEdit, setTaskToEdit] = useState<Event | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [initialProjectData, setInitialProjectData] = useState<{name: string, description: string} | null>(null);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState<'todo' | 'inProgress' | 'done'>('todo');

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
  }, [user, toast]);

  useEffect(() => {
    try {
      const ideaDataString = sessionStorage.getItem('ogeemo-idea-to-project');
      if (ideaDataString) {
        sessionStorage.removeItem('ogeemo-idea-to-project');
        const ideaData = JSON.parse(ideaDataString);
        if (ideaData.title) {
          setInitialProjectData({ name: ideaData.title, description: ideaData.description || '' });
          setIsNewProjectOpen(true);
        }
      }
    } catch (error) {
      console.error("Could not process idea data from session storage", error);
    }
  }, []);
  
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

  const handleUpdateTask = async (updatedTaskData: Event) => {
    if (!user) return;
    try {
        const { id, userId, ...dataToUpdate } = updatedTaskData;
        await ProjectService.updateTask(id, dataToUpdate);
        setAllTasks(prev => prev.map(t => t.id === updatedTaskData.id ? updatedTaskData : t));
        toast({
            title: "Task Updated",
            description: `"${updatedTaskData.title}" has been updated.`,
        });
    } catch (error: any) {
        console.error("Failed to update task:", error);
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const handleEditTask = (task: Event) => {
    setTaskToEdit(task);
    setIsNewTaskOpen(true);
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'userId' | 'createdAt'>, tasks: ProjectService.PartialTask[]) => {
    if (!user) return;
    try {
        const newProjectData: Omit<Project, 'id' | 'createdAt'> = {
            ...projectData,
            userId: user.uid,
        };
        const newProject = await ProjectService.addProject(newProjectData);
        setProjects(prev => [newProject, ...prev]);
        setSelectedProjectId(newProject.id);

        if (tasks.length > 0) {
            const newTasksData: Omit<Event, 'id'>[] = tasks.map((task) => ({
                title: task.title,
                description: task.description,
                start: new Date(),
                end: newProject.dueDate || new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Default 1 day
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
            description: `"${projectData.name}" has been created with ${tasks.length} tasks.`,
        });
    } catch(error: any) {
        console.error("Failed to create project:", error);
        toast({ variant: "destructive", title: "Create Project Failed", description: error.message });
    }
  };
  
  const handleProjectSave = async (updatedProject: Project) => {
    if (!user) return;
    try {
        const { id, userId, createdAt, ...dataToUpdate } = updatedProject;
        await ProjectService.updateProject(id, dataToUpdate);
        setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
        
        toast({
            title: "Project Saved",
            description: `Changes to "${updatedProject.name}" have been saved.`,
        });
    } catch (error: any) {
        console.error("Failed to save project:", error);
        toast({ variant: "destructive", title: "Save Project Failed", description: error.message });
    }
  };
  
  const handleDeleteProject = async () => {
    if (!projectToDelete || !user) return;
    try {
      await ProjectService.deleteProject(projectToDelete.id);
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setAllTasks(prev => prev.filter(t => t.projectId !== projectToDelete.id));

      const remainingProjects = projects.filter(p => p.id !== projectToDelete.id);
      setSelectedProjectId(remainingProjects.length > 0 ? remainingProjects[0].id : null);
      
      toast({
        title: "Project Deleted",
        description: `"${projectToDelete.name}" and all its tasks have been deleted.`,
      });
    } catch (error: any) {
       console.error("Failed to delete project:", error);
       toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    } finally {
        setProjectToDelete(null);
    }
  };

  const handleSaveTemplate = async (name: string, steps: ProjectService.PartialTask[]) => {
    if (!user) return;
    try {
        const newTemplateData: Omit<ProjectService.ProjectTemplate, 'id'> = { name, steps, userId: user.uid };
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
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (isLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  const renderProjectHub = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Projects Hub</h2>
            <p className="text-muted-foreground">Manage your projects and templates from this central hub.</p>
          </div>
          <Button onClick={() => setIsNewProjectOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <Card>
                <CardHeader>
                    <CardTitle>Active Projects</CardTitle>
                    <CardDescription>All your current projects are listed here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                         {projects.map(project => (
                            <div key={project.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                <span className="font-semibold truncate pr-4">{project.name}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => setSelectedProjectId(project.id)}><Eye className="mr-2 h-4 w-4"/> View Project Board</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => { setProjectToEdit(project); setIsEditProjectOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit Project Details</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setProjectToDelete(project)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Project</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Project Templates</CardTitle>
                    <CardDescription>Reusable templates to kickstart your projects.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {projectTemplates.map(template => (
                             <div key={template.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground"/>
                                    <div>
                                        <p className="font-semibold text-sm">{template.name}</p>
                                        <p className="text-xs text-muted-foreground">{template.steps.length} steps</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem disabled><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                        <DropdownMenuItem disabled className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );

  const renderTaskBoard = () => {
      if (!selectedProject) return null;
      return (
          <div className="flex flex-col h-full">
              <div className="flex items-center justify-between py-4 flex-wrap gap-4">
                  <div>
                      <h2 className="text-2xl font-bold font-headline text-primary">{selectedProject.name}</h2>
                      <p className="text-muted-foreground">{selectedProject.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setSelectedProjectId(null)}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          All Projects
                      </Button>
                      <Button onClick={() => { setNewTaskDefaultStatus('todo'); setIsNewTaskOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> New Task
                      </Button>
                  </div>
              </div>
               <main className="flex-1 min-h-0">
                    <TaskBoard
                        tasks={allTasks.filter(task => task.projectId === selectedProjectId)}
                        onTaskStatusChange={handleUpdateTask}
                        onEditTask={handleEditTask}
                        onNewTask={(status) => {
                            setNewTaskDefaultStatus(status);
                            setIsNewTaskOpen(true);
                        }}
                    />
               </main>
          </div>
      );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 sm:p-6 flex flex-col h-full">
        <header className="text-center pb-4 shrink-0">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Projects Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Oversee your projects from start to finish. All tasks created here are automatically added to your calendar.
          </p>
        </header>

        {selectedProjectId ? renderTaskBoard() : renderProjectHub()}
        
      </div>

      {isNewTaskOpen && <NewTaskDialog 
          isOpen={isNewTaskOpen} 
          onOpenChange={(open) => {
            setIsNewTaskOpen(open);
            if (!open) setTaskToEdit(null);
          }} 
          onTaskCreate={handleCreateTask}
          onTaskUpdate={handleUpdateTask}
          eventToEdit={taskToEdit}
          projectId={selectedProjectId} 
          defaultStatus={newTaskDefaultStatus}
      />}
      
      {isNewProjectOpen && <NewProjectDialog
        isOpen={isNewProjectOpen}
        onOpenChange={(open) => {
            setIsNewProjectOpen(open);
            if (!open) {
                setInitialProjectData(null);
            }
        }}
        onProjectCreate={handleCreateProject}
        templates={projectTemplates}
        onSaveAsTemplate={handleSaveTemplate}
        initialName={initialProjectData?.name}
        initialDescription={initialProjectData?.description}
      />}
      
      {isEditProjectOpen && projectToEdit && <EditProjectDialog
        isOpen={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        project={projectToEdit}
        onProjectSave={(updatedProject) => handleProjectSave(updatedProject)}
      />}
      
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{projectToDelete?.name}" and all of its associated tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">Delete Project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndProvider>
  );
}
