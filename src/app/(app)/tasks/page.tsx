
'use client';

import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';
import { ACTION_ITEMS_PROJECT_ID } from '@/components/tasks/project-tasks-view';

const ProjectTasksView = dynamic(
  () => import('@/components/tasks/project-tasks-view').then((mod) => mod.ProjectTasksView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Workflow...</p>
        </div>
      </div>
    ),
  }
);

export default function WorkflowPage() {
  return <ProjectTasksView projectId={ACTION_ITEMS_PROJECT_ID} />;
}
