
'use client';

import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const ProjectTasksView = dynamic(
  () => import('@/components/tasks/project-tasks-view').then((mod) => mod.ProjectTasksView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Project Workspace...</p>
        </div>
      </div>
    ),
  }
);

export default function ProjectTaskPage({ params }: { params: { projectId: string } }) {
  return (
    <div className="h-full flex flex-col">
      {/* ProjectHeader will be added in a subsequent step */}
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Project: {params.projectId}</h1>
      </div>
      <div className="flex-1 min-h-0">
        <ProjectTasksView projectId={params.projectId} />
      </div>
    </div>
  );
}
