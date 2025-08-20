
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info, X } from "lucide-react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";


function InfoPanel({ onHide }: { onHide: () => void }) {
    return (
        <Card className="w-full max-w-4xl mb-6 animate-in fade-in-50 duration-300">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex-1 text-center">
                    <CardTitle>Managing the Manager</CardTitle>
                    <CardDescription>Your central hub for customizing your Ogeemo workspace.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onHide} className="shrink-0">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Hide panel</span>
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="font-bold">What is the Action Manager?</AccordionTrigger>
                        <AccordionContent>
                            The Action Manager is your central hub for controlling and customizing your Ogeemo workspace. From here, you can access tools to organize your sidebar menu and manage your favorite action shortcuts.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="font-bold">How to use the Action Manager</AccordionTrigger>
                        <AccordionContent>
                            Use the tools below to organize your sidebar menu and manage the action shortcuts that appear in your "Favorite Actions" view.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3" className="border-b-0">
                        <AccordionTrigger className="font-bold">Select Menu Views</AccordionTrigger>
                        <AccordionContent>
                            Use the icons at the top of the main sidebar to switch between different menu views: Full Menu, Groups, and Favorite Actions. The tools on this page let you customize the 'Full Menu' and 'Favorite Actions' views.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold">Manage Your Favorite Actions</h4>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">Customize the shortcuts that appear in your sidebar's "Favorite Actions" view.</p>
                        <Button asChild>
                           <Link href="/action-manager/manage">Go to Manager <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </div>
                     <div>
                        <h4 className="font-semibold">Organize Your Main Menu</h4>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">Sort your sidebar's "Full Menu" view alphabetically or create a custom drag-and-drop order.</p>
                        <Button asChild>
                           <Link href="/a-z-sort">Go to Sorter <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ActionManagerPage() {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleToggleInfoPanel = () => {
    updatePreferences({ showDashboardFrame: !preferences.showDashboardFrame });
  };
  
  if (isLoading || !isClient) {
    return (
        <div className="p-4 sm:p-6 flex flex-col items-center">
            <header className="mb-6 text-center">
                <Skeleton className="h-8 w-64 mx-auto" />
                <Skeleton className="h-4 w-80 mx-auto mt-2" />
            </header>
            <Skeleton className="h-96 w-full max-w-4xl" />
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 flex flex-col items-center">
        <header className="mb-6 relative flex items-center justify-center text-center w-full max-w-4xl">
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-headline text-primary">
                  Action Manager
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                  Your central command for all business activities.
              </p>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2">
              <Button asChild>
                  <Link href="/action-manager/manage">Manage Dashboard</Link>
              </Button>
              <Button onClick={handleToggleInfoPanel}>
                <Info className="mr-2 h-4 w-4" /> Info
              </Button>
            </div>
        </header>
        
        {preferences.showDashboardFrame && <InfoPanel onHide={() => updatePreferences({ showDashboardFrame: false })} />}
        
    </div>
  );
}
