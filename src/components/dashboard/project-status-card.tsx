
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, AlertTriangle, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getProjects, type Project } from '@/services/project-service';

export function ProjectStatusCard() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        async function loadProjects() {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const fetchedProjects = await getProjects(user.uid);
                setProjects(fetchedProjects);
            } catch (err) {
                console.error("Failed to fetch projects:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        }
        loadProjects();
    }, [user]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-24">
                    <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading projects...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center h-24 text-destructive">
                    <AlertTriangle className="h-6 w-6 mr-2" />
                    <p>Error: {error}</p>
                </div>
            );
        }
        
        if (projects.length === 0) {
            return (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                    <p>No projects found.</p>
                </div>
            )
        }

        return (
            <ul className="space-y-2">
                {projects.map(project => (
                    <li key={project.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                       <Briefcase className="h-4 w-4 text-primary" />
                       <span className="text-sm font-medium">{project.name}</span>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>A live list of projects from the Project Manager.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}
