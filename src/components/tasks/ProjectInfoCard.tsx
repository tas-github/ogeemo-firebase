
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type Project } from "@/data/projects";
import { type Event } from "@/types/calendar";

interface ProjectInfoCardProps {
  project: Project;
  tasks: Event[];
}

export function ProjectInfoCard({ project, tasks }: ProjectInfoCardProps) {
  if (!project) {
    return null;
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(task => task.status === 'done').length;
  const completionPercentage = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

  return (
    <Card className="col-span-1 md:col-span-3">
      <CardHeader>
        <CardTitle>{project.name} Overview</CardTitle>
        {project.description && (
            <CardDescription>{project.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium">Progress</p>
            <p className="text-sm text-muted-foreground">{doneTasks} / {totalTasks} tasks completed</p>
          </div>
          <Progress value={completionPercentage} />
          <p className="text-right text-sm font-bold mt-1">{Math.round(completionPercentage)}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
