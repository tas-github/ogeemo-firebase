
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getProjectById, type Project } from '@/services/project-service';

interface ProjectPlanningViewProps {
  projectId: string;
}

export function ProjectPlanningView({ projectId }: ProjectPlanningViewProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function loadProject() {
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
        }
        loadProject();
    }, [projectId, router, toast]);
    
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
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary">{project.name}</h1>
                    <p className="text-muted-foreground">Project Planning and Progress</p>
                </div>
                <Button asChild>
                    <Link href="/projects">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Project Hub
                    </Link>
                </Button>
            </header>
            
            <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Content for project planning will go here.</p>
            </div>
        </div>
    );
}
