
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoaderCircle, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getProjectById, type Project, type ProjectStep } from '@/services/project-service';

export function ProjectPlanningView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    const loadProject = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedProject = await getProjectById(projectId);
            if (fetchedProject) {
                setProject(fetchedProject);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find the specified project.' });
                router.push('/projects');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load project', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [projectId, router, toast]);

    useEffect(() => {
        loadProject();
    }, [loadProject]);

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

    const totalSteps = project.steps?.length || 0;
    const completedSteps = project.steps?.filter(s => s.isCompleted).length || 0;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return (
        <div className="p-4 sm:p-6 flex flex-col items-center h-full">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold font-headline text-primary">{project.name}</CardTitle>
                            <CardDescription>
                                Project Planning and Progress
                            </CardDescription>
                        </div>
                        <div className='flex gap-2'>
                            <Button asChild>
                                <Link href="/projects">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Projects
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold">Project Description</h3>
                        <p className="text-sm text-muted-foreground mt-1">{project.description || 'No description provided.'}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold">Project Steps</h3>
                        <div className="space-y-2 mt-2">
                            {project.steps && project.steps.length > 0 ? project.steps.map(step => (
                                <div key={step.id} className="flex items-center gap-3 p-2 border rounded-lg bg-muted/50">
                                    <Checkbox checked={step.isCompleted} disabled />
                                    <span className="flex-1">{step.title}</span>
                                    <span className="text-sm text-muted-foreground">{step.durationHours} hrs</span>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No steps defined for this project.</p>
                            )}
                        </div>
                         <Button asChild variant="link" className="px-0">
                            <Link href={`/projects/steps`}>
                                Edit Steps
                            </Link>
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
