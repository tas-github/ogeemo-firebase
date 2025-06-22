
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  FilePlus2,
  LayoutDashboard,
  Mail,
  Settings,
  Wand2,
  Beaker,
  Contact,
  ListTodo,
  Calendar,
  Folder,
  Lightbulb,
  FlaskConical,
  Calculator,
  Briefcase,
  Clock,
  DatabaseBackup,
  AreaChart,
  BarChart3,
  Bell,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path.endsWith('...')) {
      return pathname.startsWith(path.slice(0, -3));
    }
    return pathname === path;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard")}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/action-manager")}
                  tooltip="Action Manager"
                >
                  <Link href="/action-manager">
                    <Wand2 />
                    <span>Action Manager</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/ogeemail...")}
                  tooltip="OgeeMail"
                >
                  <Link href="/ogeemail">
                    <Mail />
                    <span>OgeeMail</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/contacts")}
                  tooltip="Contacts"
                >
                  <Link href="/contacts">
                    <Contact />
                    <span>Contacts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/tasks")} tooltip="Tasks">
                  <Link href="/tasks">
                    <ListTodo />
                    <span>Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/calendar")} tooltip="Calendar">
                  <Link href="/calendar">
                    <Calendar />
                    <span>Calendar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/files")} tooltip="Files">
                  <Link href="/files">
                    <Folder />
                    <span>Files</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/ideas")} tooltip="Ideas">
                  <Link href="/ideas">
                    <Lightbulb />
                    <span>Ideas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/research")} tooltip="Research">
                  <Link href="/research">
                    <FlaskConical />
                    <span>Research</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/accounting")} tooltip="Accounting">
                  <Link href="/accounting">
                    <Calculator />
                    <span>Accounting</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/google")} tooltip="Google">
                  <Link href="/google">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 14a6 6 0 0 1-6 6h-1a6 6 0 1 1 5-10l-2 2h3" />
                    </svg>
                    <span>Google</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/projects")} tooltip="Projects">
                  <Link href="/projects">
                    <Briefcase />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/time")} tooltip="Time">
                  <Link href="/time">
                    <Clock />
                    <span>Time</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/backup")} tooltip="Backup">
                  <Link href="/backup">
                    <DatabaseBackup />
                    <span>Backup</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/new-dashboard")} tooltip="Dashboard">
                  <Link href="/new-dashboard">
                    <AreaChart />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/reports")} tooltip="Reports">
                  <Link href="/reports">
                    <BarChart3 />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/alerts")} tooltip="Alerts">
                  <Link href="/alerts">
                    <Bell />
                    <span>Alerts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/sandbox")}
                  tooltip="Sandbox"
                >
                  <Link href="/sandbox">
                    <Beaker />
                    <span>Sandbox</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/data")}
                  tooltip="Data"
                >
                  <Link href="/data">
                    <Database />
                    <span>Data</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/forms")}
                  tooltip="Forms"
                >
                  <Link href="/forms">
                    <FilePlus2 />
                    <span>Forms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/settings")}
                  tooltip="Settings"
                >
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <UserNav />
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-auto">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1 text-center">
                {pathname === '/sandbox' && <h1 className="text-xl font-semibold">Sandbox</h1>}
                </div>
            </header>
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>

      </div>
    </SidebarProvider>
  );
}
