
'use client';

import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const ProjectTimelineView = dynamic(
  () => import('@/components/tasks/project-timeline-view').then((mod) => mod.ProjectTimelineView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Project Timeline...</p>
        </div>
      </div>
    ),
  }
);

export default function ProjectTimelinePage({ params }: { params: { projectId: string } }) {
  // A placeholder projectId is used to satisfy the route until a specific project is selected.
  const projectIdToShow = params.projectId === 'placeholder' ? '' : params.projectId;
  return (
     <div className="h-full flex flex-col">
       <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Timeline for Project: {projectIdToShow}</h1>
      </div>
      <div className="flex-1 min-h-0">
        <ProjectTimelineView projectId={projectIdToShow} />
      </div>
    </div>
  );
}
