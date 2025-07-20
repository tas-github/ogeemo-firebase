
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const ProjectPlanningView = dynamic(
  () => import('@/components/tasks/project-planning-view').then((mod) => mod.ProjectPlanningView),
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
  return <ProjectPlanningView projectId={params.projectId} />;
}
