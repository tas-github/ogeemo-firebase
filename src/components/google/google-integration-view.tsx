
'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Mail, FileText, Sheet as SheetIcon, Contact, Presentation, Calendar, MessageSquare, Video, LayoutPanelTop, Map, Sparkles } from "lucide-react";

function GoogleDriveIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
            <path d="M16 16.5l-4-4-4 4"></path>
            <path d="M16 16.5l4 4 4-4"></path>
            <path d="M8 8.5l-4 4-4-4"></path>
            <path d="M16 16.5l-4-4-4 4"></path>
            <path d="M22 10.5L12 2 2 10.5"></path>
            <path d="M2 10.5l10 8.5 10-8.5"></path>
        </svg>
    )
}

const workspaceLinks = [
    { name: "Drive", href: "https://drive.google.com/", icon: GoogleDriveIcon },
    { name: "Gmail", href: "https://mail.google.com/", icon: Mail },
    { name: "Docs", href: "https://docs.google.com/", icon: FileText },
    { name: "Sheets", href: "https://sheets.google.com/", icon: SheetIcon },
    { name: "Slides", href: "https://slides.google.com/", icon: Presentation },
    { name: "Calendar", href: "https://calendar.google.com/", icon: Calendar },
    { name: "Contacts", href: "https://contacts.google.com/", icon: Contact },
    { name: "Chat", href: "https://chat.google.com/", icon: MessageSquare },
    { name: "Meet", href: "https://meet.google.com/", icon: Video },
    { name: "Sites", href: "https://sites.google.com/", icon: LayoutPanelTop },
    { name: "Maps", href: "https://maps.google.com/", icon: Map },
    { name: "Gemini", href: "https://gemini.google.com/app", icon: Sparkles },
];

export function GoogleIntegrationView() {

  return (
    <div className="p-4 sm:p-6 flex items-center justify-center h-full">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Google Integration</CardTitle>
          <CardDescription>
            Quickly access your Google Workspace apps.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div>
              <h3 className="text-lg font-semibold mb-2">Google Workspace Shortcuts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open your Google apps in a new tab to access your documents, email, and other files.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {workspaceLinks.map(link => (
                    <Button asChild key={link.name} variant="outline">
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                            <link.icon /> {link.name} <ExternalLink className="ml-auto h-3 w-3" />
                        </a>
                    </Button>
                ))}
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
