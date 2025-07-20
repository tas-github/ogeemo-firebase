
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

// This view has been consolidated into the main project tasks view.
// For now, let's keep the route but use the same component, we can differentiate later if needed.
const ProjectTasksView = dynamic(
  () => import('@/components/tasks/project-tasks-view').then((mod) => mod.ProjectTasksView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Project Plan...</p>
        </div>
      </div>
    ),
  }
);

export default function ProjectPlanningPage({ params }: { params: { projectId: string } }) {
  return <ProjectTasksView projectId={params.projectId} />;
}
