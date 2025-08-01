
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLoading } from "@/context/loading-context";
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
  LogOut,
  MessageSquare,
  HardHat,
  Clock,
  Contact2,
  Share2,
  Users2,
  PackageSearch,
  Megaphone,
  Landmark,
  ListTodo,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function MainMenu() {
  const pathname = usePathname();
  const { showLoading } = useLoading();

  const isActive = (path: string) => {
    if (path.endsWith('...')) {
      return pathname.startsWith(path.slice(0, -3));
    }
    return pathname === path;
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // If the link is the current page or an external link, do nothing.
    if (pathname === href || href.startsWith('http')) {
      return;
    }
    showLoading();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/action-manager")} tooltip="Action Manager">
          <Link href="/action-manager" onClick={(e) => handleClick(e, "/action-manager")}>
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
          <Link href="/ogeemail" onClick={(e) => handleClick(e, "/ogeemail")}>
            <Mail />
            <span>OgeeMail</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/communications")} tooltip="Communications">
          <Link href="/communications" onClick={(e) => handleClick(e, "/communications")}>
            <MessageSquare />
            <span>Communications</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/contacts")}
          tooltip="Contacts"
        >
          <Link href="/contacts" onClick={(e) => handleClick(e, "/contacts")}>
            <Contact />
            <span>Contacts</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/projects...")} tooltip="Projects">
          <Link href="/projects" onClick={(e) => handleClick(e, "/projects")}>
            <Briefcase />
            <span>Projects</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/tasks")} tooltip="Tasks">
          <Link href="/tasks" onClick={(e) => handleClick(e, "/tasks")}>
            <ListTodo />
            <span>Tasks</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/calendar")} tooltip="Calendar">
          <Link href="/calendar" onClick={(e) => handleClick(e, "/calendar")}>
            <Calendar />
            <span>Calendar</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/files")} tooltip="Files">
          <Link href="/files" onClick={(e) => handleClick(e, "/files")}>
            <Folder />
            <span>Files</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/ideas")} tooltip="Ideas">
          <Link href="/ideas" onClick={(e) => handleClick(e, "/ideas")}>
            <Lightbulb />
            <span>Ideas</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/research")} tooltip="Research">
          <Link href="/research" onClick={(e) => handleClick(e, "/research")}>
            <FlaskConical />
            <span>Research</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/accounting...")} tooltip="Accounting">
          <Link href="/accounting" onClick={(e) => handleClick(e, "/accounting")}>
            <Calculator />
            <span>Accounting</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/time")} tooltip="Time">
          <Link href="/time" onClick={(e) => handleClick(e, "/time")}>
            <Clock />
            <span>Time</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/hr-manager")} tooltip="HR Manager">
          <Link href="/hr-manager" onClick={(e) => handleClick(e, "/hr-manager")}>
            <Contact2 />
            <span>HR Manager</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/social-media-manager")} tooltip="Social Media Manager">
          <Link href="/social-media-manager" onClick={(e) => handleClick(e, "/social-media-manager")}>
            <Share2 />
            <span>Social Media</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/crm")} tooltip="CRM">
          <Link href="/crm" onClick={(e) => handleClick(e, "/crm")}>
            <Users2 />
            <span>CRM</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/inventory-manager")} tooltip="Inventory Manager">
          <Link href="/inventory-manager" onClick={(e) => handleClick(e, "/inventory-manager")}>
            <PackageSearch />
            <span>Inventory</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/marketing-manager")} tooltip="Marketing Manager">
          <Link href="/marketing-manager" onClick={(e) => handleClick(e, "/marketing-manager")}>
            <Megaphone />
            <span>Marketing</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/legal-hub")} tooltip="Legal Hub">
          <Link href="/legal-hub" onClick={(e) => handleClick(e, "/legal-hub")}>
            <Landmark />
            <span>Legal Hub</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/google")} tooltip="Google">
          <Link href="/google" onClick={(e) => handleClick(e, "/google")}>
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
        <SidebarMenuButton asChild isActive={isActive("/backup")} tooltip="Backup">
          <Link href="/backup" onClick={(e) => handleClick(e, "/backup")}>
            <DatabaseBackup />
            <span>Backup</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/reports...")} tooltip="Reports">
          <Link href="/reports" onClick={(e) => handleClick(e, "/reports")}>
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
          <Link href="/hytexercise" onClick={(e) => handleClick(e, "/hytexercise")}>
            <HeartPulse />
            <span>Hytexercise</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive("/alerts")} tooltip="Alerts">
          <Link href="/alerts" onClick={(e) => handleClick(e, "/alerts")}>
            <Bell />
            <span>Alerts</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/my-worker")}
          tooltip="My Worker"
        >
          <Link href="/my-worker" onClick={(e) => handleClick(e, "/my-worker")}>
            <HardHat />
            <span>My Worker</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/test-chat")}
          tooltip="Test Chat"
        >
          <Link href="/test-chat" onClick={(e) => handleClick(e, "/test-chat")}>
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
          <Link href="/sandbox" onClick={(e) => handleClick(e, "/sandbox")}>
            <Beaker />
            <span>Sandbox</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/debug")}
          tooltip="Debug"
        >
          <Link href="/debug" onClick={(e) => handleClick(e, "/debug")}>
            <HardHat />
            <span>Debug</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/data")}
          tooltip="Data"
        >
          <Link href="/data" onClick={(e) => handleClick(e, "/data")}>
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
          <Link href="/forms" onClick={(e) => handleClick(e, "/forms")}>
            <FilePlus2 />
            <span>Forms</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/logout")}
          tooltip="Logout"
        >
          <Link href="/logout" onClick={(e) => handleClick(e, "/logout")}>
            <LogOut />
            <span>Logout</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive("/settings")}
          tooltip="Settings"
        >
          <Link href="/settings" onClick={(e) => handleClick(e, "/settings")}>
            <Settings />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
