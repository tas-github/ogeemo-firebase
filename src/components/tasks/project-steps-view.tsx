
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Plus, Trash2, MoreVertical, Save, LoaderCircle } from "lucide-react";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProjectById, updateProject, type Project, type ProjectStep } from '@/services/project-service';

export function ProjectStepsView() {
    const [project, setProject] = useState<Project | null>(null);
    const [steps, setSteps] = useState<ProjectStep[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const hasUnsavedChanges = useRef(false);

    const loadProject = useCallback(async (projectId: string) => {
        setIsLoading(true);
        try {
            const fetchedProject = await getProjectById(projectId);
            if (fetchedProject) {
                setProject(fetchedProject);
                setSteps(fetchedProject.steps || []);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find the specified project.' });
                router.push('/projects');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load project', description: error.message });
        } finally {
            setIsLoading(false);
            hasUnsavedChanges.current = false;
        }
    }, [router, toast]);

    useEffect(() => {
        const projectId = sessionStorage.getItem('selectedProjectId');
        if (projectId) {
            loadProject(projectId);
        } else {
            toast({ variant: 'destructive', title: 'No Project Selected', description: 'Please create or select a project first.' });
            router.push('/projects');
        }
    }, [loadProject, router, toast]);

    const handleSaveChanges = useCallback(async () => {
        if (!project || !hasUnsavedChanges.current) return;
        setIsSaving(true);
        try {
            await updateProject(project.id, { steps: steps });
            hasUnsavedChanges.current = false;
            toast({ title: 'Project Steps Saved', description: 'Your changes have been saved successfully.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setIsSaving(false);
        }
    }, [project, steps, toast]);

    // Auto-save on unmount/navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges.current) {
                // This message is often ignored by modern browsers, but it's good practice
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasUnsavedChanges.current) {
                handleSaveChanges();
            }
        };
    }, [handleSaveChanges]);

    const handleAddStep = () => {
        const newStep: ProjectStep = {
            id: `temp-${Date.now()}`,
            title: '',
            durationHours: 1,
            isCompleted: false,
        };
        setSteps(prev => [...prev, newStep]);
        hasUnsavedChanges.current = true;
    };

    const handleUpdateStep = (id: string, field: keyof Omit<ProjectStep, 'id'>, value: string | number | boolean) => {
        setSteps(prev => prev.map(step => step.id === id ? { ...step, [field]: value } : step));
        hasUnsavedChanges.current = true;
    };

    const handleDeleteStep = (id: string) => {
        setSteps(prev => prev.filter(step => step.id !== id));
        hasUnsavedChanges.current = true;
    };
    
    const handleSaveAndContinue = async () => {
        await handleSaveChanges();
        router.push('/projects');
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!project) {
        return null; // or a more robust error component
    }

    return (
        <div className="p-4 sm:p-6 flex flex-col items-center justify-start h-full">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold font-headline text-primary">Define Steps for: {project.name}</CardTitle>
                            <CardDescription>
                                Break down your project into manageable steps. This will help you create tasks later.
                            </CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/projects">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Project Manager
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-3 p-2 border rounded-lg">
                                <span className="font-mono text-sm text-muted-foreground">{index + 1}.</span>
                                <Checkbox
                                    checked={step.isCompleted}
                                    onCheckedChange={(checked) => handleUpdateStep(step.id, 'isCompleted', !!checked)}
                                />
                                <Input
                                    value={step.title}
                                    onChange={(e) => handleUpdateStep(step.id, 'title', e.target.value)}
                                    placeholder="Enter step description..."
                                    className="flex-1"
                                />
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={step.durationHours}
                                        onChange={(e) => handleUpdateStep(step.id, 'durationHours', Number(e.target.value))}
                                        className="w-20"
                                        min="0"
                                    />
                                    <Label className="text-sm text-muted-foreground">hours</Label>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteStep(step.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Step
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" onClick={handleAddStep}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Step
                    </Button>
                </CardContent>
                <CardContent className="flex justify-end gap-2 border-t pt-6">
                    <Button onClick={handleSaveAndContinue} disabled={isSaving}>
                        {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? "Saving..." : "Save and Continue"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
