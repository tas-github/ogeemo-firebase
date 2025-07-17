
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, ListTodo, Contact, Activity, Clock } from 'lucide-react';
import { initialProjects } from '@/data/projects';
import { getInitialEvents } from '@/data/events';
import { mockContacts } from '@/data/contacts';
import { type Event } from '@/types/calendar';
import { ActionManagerCard } from './action-manager-card';

export function NewDashboardView() {
  const tasks = React.useMemo(() => getInitialEvents(), []);
  
  const projectTaskData = initialProjects
    .map(project => ({
      name: project.name,
      tasks: tasks.filter(task => task.projectId === project.id).length,
    }))
    .filter(p => p.tasks > 0);

  const recentActivities: (Event & { type: 'task' })[] = tasks
    .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())
    .slice(0, 5)
    .map(task => ({ ...task, type: 'task' }));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <div className="flex flex-col">
            <h1 className="text-3xl font-bold font-headline text-primary">Dashboard Manager</h1>
            <p className="text-muted-foreground">An enhanced, interactive overview of your workspace.</p>
        </div>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{initialProjects.length}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{tasks.filter(t => t.status !== 'done').length}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Contact className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{mockContacts.length}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-destructive">{tasks.filter(t => new Date(t.end) < new Date() && t.status !== 'done').length}</div>
              </CardContent>
          </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Tasks per Project</CardTitle>
                    <CardDescription>A breakdown of tasks across your active projects.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={projectTaskData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>A feed of the latest actions in your workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentActivities.map(activity => (
                            <div key={activity.id} className="flex items-center">
                                <Activity className="h-5 w-5 mr-4 text-primary"/>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {activity.status === 'done' ? 'Completed' : 'Updated'} in "{initialProjects.find(p => p.id === activity.projectId)?.name || 'Project List'}"
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-3">
           <ActionManagerCard />
        </div>
      </div>
    </div>
  );
}
