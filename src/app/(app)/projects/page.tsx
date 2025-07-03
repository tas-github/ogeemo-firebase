
import dynamic from 'next/dynamic';
import { ProjectsSkeleton } from '@/components/tasks/projects-skeleton';

const TasksView = dynamic(
  () => import('@/components/tasks/tasks-view').then((mod) => mod.TasksView),
  {
    ssr: false,
    loading: () => <ProjectsSkeleton />,
  }
);

export default function ProjectsPage() {
  return <TasksView />;
}
