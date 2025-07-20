
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const ProjectStepsView = dynamic(
  () => import('@/components/tasks/project-steps-view').then((mod) => mod.ProjectStepsView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Project Steps...</p>
        </div>
      </div>
    ),
  }
);

export default function ProjectStepsPage() {
  return <ProjectStepsView />;
}
