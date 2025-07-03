
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
  Calendar,
  Folder,
  Lightbulb,
  FlaskConical,
  Calculator,
  Briefcase,
  Users,
  DatabaseBackup,
  AreaChart,
  BarChart3,
  Bell,
  Bug,
  HeartPulse,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function MainMenu() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path.endsWith('...')) {
      return pathname.startsWith(path.slice(0, -3));
    }
    return pathname === path;
  };

  return (
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
        <SidebarMenuButton asChild isActive={isActive("/projects")} tooltip="Projects">
          <Link href="/projects">
            <Briefcase />
            <span>Projects</span>
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
        <SidebarMenuButton asChild isActive={isActive("/accounting...")} tooltip="Accounting">
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
        <SidebarMenuButton asChild isActive={isActive("/client-manager...")} tooltip="Client Manager">
          <Link href="/client-manager">
            <Users />
            <span>Client Manager</span>
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
        <SidebarMenuButton asChild isActive={isActive("/new-dashboard")} tooltip="Dashboard Manager">
          <Link href="/new-dashboard">
            <AreaChart />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/reports...")} tooltip="Reports">
          <Link href="/reports">
            <BarChart3 />
            <span>Reports</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/hytexercise")}
          tooltip="Hytexercise"
        >
          <Link href="/hytexercise">
            <HeartPulse />
            <span>Hytexercise</span>
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
          isActive={isActive("/test-chat")}
          tooltip="Test Chat"
        >
          <Link href="/test-chat">
            <Bug />
            <span>Test Chat</span>
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
  );
}
