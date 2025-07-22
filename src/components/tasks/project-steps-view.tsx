
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Textarea } from '../ui/textarea';

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
            description: '',
            durationHours: 1,
            isBillable: false,
            connectToCalendar: false,
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
        router.push(`/projects/${project?.id}/planning`);
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!project) {
        return null;
    }

    return (
        <div className="p-4 sm:p-6 flex flex-col items-center justify-start h-full">
            <Card className="w-full max-w-6xl">
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
                            <div key={step.id} className="grid grid-cols-12 items-start gap-4 p-3 border rounded-lg">
                               <div className="col-span-12 md:col-span-6 space-y-2">
                                    <Label htmlFor={`title-${step.id}`}>Step {index + 1}: Title</Label>
                                    <Input
                                        id={`title-${step.id}`}
                                        value={step.title}
                                        onChange={(e) => handleUpdateStep(step.id, 'title', e.target.value)}
                                        placeholder="Enter step title..."
                                    />
                                    <Label htmlFor={`desc-${step.id}`} className="mt-2">Description</Label>
                                    <Textarea
                                        id={`desc-${step.id}`}
                                        value={step.description}
                                        onChange={(e) => handleUpdateStep(step.id, 'description', e.target.value)}
                                        placeholder="Describe the step..."
                                        rows={2}
                                    />
                               </div>
                               <div className="col-span-12 md:col-span-5 space-y-4">
                                    <div className="flex items-end gap-2">
                                        <div className="space-y-2 flex-1">
                                            <Label htmlFor={`duration-${step.id}`}>Est. Duration</Label>
                                            <Input
                                                id={`duration-${step.id}`}
                                                type="number"
                                                value={step.durationHours}
                                                onChange={(e) => handleUpdateStep(step.id, 'durationHours', Number(e.target.value))}
                                                min="0"
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground pb-2">hours</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`billable-${step.id}`}
                                            checked={step.isBillable}
                                            onCheckedChange={(checked) => handleUpdateStep(step.id, 'isBillable', !!checked)}
                                        />
                                        <Label htmlFor={`billable-${step.id}`}>Billable</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`calendar-${step.id}`}
                                            checked={step.connectToCalendar}
                                            onCheckedChange={(checked) => handleUpdateStep(step.id, 'connectToCalendar', !!checked)}
                                        />
                                        <Label htmlFor={`calendar-${step.id}`}>Connect to Calendar</Label>
                                    </div>
                               </div>
                               <div className="col-span-12 md:col-span-1 flex justify-end items-start">
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
