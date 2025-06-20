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
      // In a real app, you would dynamically fetch or derive these descriptions.
      const databaseDescription =
        "A Firebase database for a modern e-commerce platform. It manages products, customer orders, user accounts, and inventory.";
      const collectionsDescription = `
        - users: 1,523 documents. Stores customer profile information, shipping addresses, and order history.
        - products: 8,450 documents. Contains details about each product, including name, description, price, and images.
        - orders: 12,345 documents. Contains information about each customer order, including items, quantities, and payment status.
        - inventory: 8,450 documents. Tracks stock levels for each product.
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
      <CardHeader>
        <CardTitle className="font-headline">
          AI-Powered Database Summary
        </CardTitle>
        <CardDescription>
          Click the button to generate an executive summary of your database
          contents and statistics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateSummary} disabled={isLoading}>
          {isLoading ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Generating..." : "Generate Summary"}
        </Button>
        {isLoading && (
          <div className="space-y-2 rounded-lg border bg-secondary/30 p-4">
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
