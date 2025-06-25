
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseSummary } from "@/components/dashboard/database-summary";
import { Briefcase, ListTodo, Contact } from "lucide-react";
import { initialProjects } from "@/data/projects";
import { getInitialEvents } from "@/data/events";
import { mockContacts } from "@/data/contacts";

export default function DashboardPage() {
  const totalProjects = initialProjects.length;
  const allTasks = getInitialEvents();
  const pendingTasks = allTasks.filter(task => task.projectId && (task.status === 'todo' || task.status === 'inProgress')).length;
  const totalContacts = mockContacts.length;


  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Dashboard</h1>
        <p className="text-muted-foreground">An at-a-glance overview of your key metrics.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              All active and planned projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">Across all folders</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <DatabaseSummary />
      </div>
    </div>
  );
}
