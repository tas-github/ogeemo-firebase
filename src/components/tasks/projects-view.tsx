
"use client";

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Briefcase,
  ListChecks,
  Inbox,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  cta: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, href, cta }) => (
  <Card className="flex flex-col">
    <CardHeader>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex-1" />
    <CardFooter>
      <Button asChild className="w-full">
        <Link href={href}>
          {cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

export function ProjectsView() {
  const features = [
    { icon: Briefcase, title: "Project List", description: "A comprehensive list of every project. Use this view to edit project details.", href: "/projects/all", cta: "View Project List" },
    { icon: ListChecks, title: "Status Board", description: "A Kanban-style board to visualize project status and quickly assess your workload.", href: "/project-status", cta: "Go to Status Board" },
    { icon: Inbox, title: "Action Items", description: "Your universal inbox for tasks that haven't been assigned to a specific project yet.", href: "/tasks", cta: "Open Action Items" },
    { icon: CalendarIcon, title: "Calendar View", description: "See all scheduled project tasks and events in a visual, drag-and-drop calendar.", href: "/calendar", cta: "Open Calendar" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Project Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your central command for managing projects and tasks, from high-level planning to daily execution.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
}
