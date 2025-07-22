
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LoaderCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getProjectById, type Project } from '@/services/project-service';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export function ProjectPlanningView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        async function loadProject() {
            setIsLoading(true);
            try {
                const projectData = await getProjectById(projectId);
                if (!projectData) {
                    setError("Project not found.");
                } else {
                    setProject(projectData);
                }
            } catch (err: any) {
                setError("Failed to load project details.");
                toast({ variant: 'destructive', title: 'Error', description: err.message });
            } finally {
                setIsLoading(false);
            }
        }

        loadProject();
    }, [projectId, user, toast]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading Project...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                     <CardContent className="p-6">
                        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                        <h2 className="mt-4 text-xl font-semibold">Could not load project</h2>
                        <p className="mt-2 text-muted-foreground">{error || "The project could not be found."}</p>
                        <Button asChild className="mt-6">
                            <Link href="/projects">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to All Projects
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="relative">
                <div className="absolute left-0 top-0">
                    <Button asChild variant="outline">
                        <Link href="/projects">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to All Projects
                        </Link>
                    </Button>
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline text-primary">Project: {project.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        Planning and progress view coming soon.
                    </p>
                </div>
            </header>
        </div>
    );
}
