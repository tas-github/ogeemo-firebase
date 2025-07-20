
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, ListTodo, Contact, Activity, Clock } from 'lucide-react';
import { mockContacts } from '@/data/contacts';
import { ActionManagerCard } from './action-manager-card';
import { Skeleton } from '../ui/skeleton';

export function NewDashboardView() {
  
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="text-center">
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
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Project Manager is being rebuilt.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">0</div>
                   <p className="text-xs text-muted-foreground">Project Manager is being rebuilt.</p>
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
                  <div className="text-2xl font-bold text-destructive">0</div>
                   <p className="text-xs text-muted-foreground">Project Manager is being rebuilt.</p>
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
                    <div className="h-[350px] w-full flex flex-col items-center justify-center bg-muted rounded-lg">
                        <p className="text-muted-foreground">Project data is unavailable.</p>
                        <p className="text-xs text-muted-foreground">This component is being rebuilt.</p>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>A feed of the latest actions in your workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="h-48 flex flex-col items-center justify-center bg-muted rounded-lg">
                        <p className="text-muted-foreground">Activity feed is unavailable.</p>
                        <p className="text-xs text-muted-foreground">This component is being rebuilt.</p>
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
