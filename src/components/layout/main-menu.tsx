
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
  Clock,
  DatabaseBackup,
  AreaChart,
  BarChart3,
  Bell,
  Bug,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useNavigation } from "@/context/navigation-context";

export function MainMenu() {
  const pathname = usePathname();
  const { setIsNavigating } = useNavigation();

  const isActive = (path: string) => {
    if (path.endsWith('...')) {
      return pathname.startsWith(path.slice(0, -3));
    }
    return pathname === path;
  };

  const handleNavigate = () => {
    if (pathname === location.pathname) {
      setIsNavigating(true);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/dashboard")}
          tooltip="Dashboard"
        >
          <Link href="/dashboard" onClick={handleNavigate}>
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
          <Link href="/action-manager" onClick={handleNavigate}>
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
          <Link href="/ogeemail" onClick={handleNavigate}>
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
          <Link href="/contacts" onClick={handleNavigate}>
            <Contact />
            <span>Contacts</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/tasks")} tooltip="Projects">
          <Link href="/tasks" onClick={handleNavigate}>
            <Briefcase />
            <span>Projects</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/calendar")} tooltip="Calendar">
          <Link href="/calendar" onClick={handleNavigate}>
            <Calendar />
            <span>Calendar</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/files")} tooltip="Files">
          <Link href="/files" onClick={handleNavigate}>
            <Folder />
            <span>Files</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/ideas")} tooltip="Ideas">
          <Link href="/ideas" onClick={handleNavigate}>
            <Lightbulb />
            <span>Ideas</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/research")} tooltip="Research">
          <Link href="/research" onClick={handleNavigate}>
            <FlaskConical />
            <span>Research</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/accounting...")} tooltip="Accounting">
          <Link href="/accounting" onClick={handleNavigate}>
            <Calculator />
            <span>Accounting</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/google")} tooltip="Google">
          <Link href="/google" onClick={handleNavigate}>
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
        <SidebarMenuButton asChild isActive={isActive("/time")} tooltip="Time">
          <Link href="/time" onClick={handleNavigate}>
            <Clock />
            <span>Time</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/backup")} tooltip="Backup">
          <Link href="/backup" onClick={handleNavigate}>
            <DatabaseBackup />
            <span>Backup</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/new-dashboard")} tooltip="Dashboard">
          <Link href="/new-dashboard" onClick={handleNavigate}>
            <AreaChart />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/reports")} tooltip="Reports">
          <Link href="/reports" onClick={handleNavigate}>
            <BarChart3 />
            <span>Reports</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/alerts")} tooltip="Alerts">
          <Link href="/alerts" onClick={handleNavigate}>
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
          <Link href="/test-chat" onClick={handleNavigate}>
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
          <Link href="/sandbox" onClick={handleNavigate}>
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
          <Link href="/data" onClick={handleNavigate}>
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
          <Link href="/forms" onClick={handleNavigate}>
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
          <Link href="/settings" onClick={handleNavigate}>
            <Settings />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
