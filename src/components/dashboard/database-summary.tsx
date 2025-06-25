"use client";

import { useState } from "react";
import { Sparkles, LoaderCircle } from "lucide-react";

import { summarizeDatabase } from "@/ai/flows/summarize-database";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function DatabaseSummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary(null);
    try {
      // In a real app, you would dynamically fetch these descriptions from your backend.
      const databaseDescription =
        "A Firebase database for the Ogeemo platform, a comprehensive tool for managing business operations including contacts, projects, tasks, and files.";
      const collectionsDescription = `
        - projects: 2 documents. Manages high-level projects and initiatives.
        - tasks: 15 documents. Stores individual tasks, appointments, and calendar events, linked to projects.
        - contacts: 6 documents. Contains information about clients, leads, and personal contacts.
        - contactFolders: 3 documents. Organizes contacts into user-defined groups.
        - files: 10 documents. Metadata for user-uploaded files.
        - fileFolders: 7 documents. Organizes files into a hierarchical structure.
      `;

      const result = await summarizeDatabase({
        databaseDescription,
        collectionsDescription,
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("Error summarizing database:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate summary. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-headline">
          AI-Powered Database Summary
        </CardTitle>
        <CardDescription>
          Click the button to generate an executive summary of your database
          contents and statistics.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Button onClick={handleGenerateSummary} disabled={isLoading}>
          {isLoading ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Generating..." : "Generate Summary"}
        </Button>
        {isLoading && (
          <div className="w-full space-y-2 rounded-lg border bg-secondary/30 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        )}
        {summary && (
          <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-card p-4 text-card-foreground">
            <p>{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
