
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
import { ArrowRight, Info, X, Menu, Layers, LayoutDashboard, Save } from "lucide-react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useSidebarView } from "@/context/sidebar-view-context";


function InfoPanel({ onHide }: { onHide: () => void }) {
    return (
        <Card className="w-full max-w-4xl mb-6 animate-in fade-in-50 duration-300">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex-1 text-center">
                    <CardTitle className="font-bold">Managing the Manager</CardTitle>
                    <CardDescription>Your central hub for controlling your Ogeemo workspace.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onHide} className="shrink-0 h-6 w-6">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Hide panel</span>
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="font-bold">What is the Action Manager?</AccordionTrigger>
                        <AccordionContent>
                            The Action Manager is your central hub for controlling your Ogeemo workspace. From here, you can access tools to organize your sidebar menu and manage your favorite action shortcuts.
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
                        <p className="text-sm text-muted-foreground mt-1 mb-3">Organize the shortcuts that appear in your sidebar's "Favorite Actions" view.</p>
                        <Button asChild className="h-6 px-2 py-1 text-xs">
                           <Link href="/action-manager/manage">Go to Manager <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </div>
                     <div>
                        <h4 className="font-semibold">Organize Your Main Menu</h4>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">Sort your sidebar's "Full Menu" view alphabetically or create a custom drag-and-drop order.</p>
                        <Button asChild className="h-6 px-2 py-1 text-xs">
                           <Link href="/a-z-sort">Go to Sorter <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function MenuViewInstructionPanel({ onHide }: { onHide: () => void }) {
    const { setView } = useSidebarView();
    return (
        <Card className="w-full md:w-3/4 lg:w-1/2 mt-6 animate-in fade-in-50 duration-300">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex-1 text-center">
                    <CardTitle>Setting Your Sidebar Menu View</CardTitle>
                    <CardDescription>Instructions on how to use the different menu views.</CardDescription>
                </div>
                 <Button variant="ghost" size="icon" onClick={onHide} className="shrink-0 h-6 w-6">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Hide panel</span>
                </Button>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    The main sidebar on the left has three view modes, accessible via the icons at the top. Use these views to navigate Ogeemo in the way that best suits your workflow.
                </p>
                <Accordion type="single" collapsible className="w-full mt-4">
                    <AccordionItem value="item-1">
                        <AccordionTrigger onClick={() => setView('fullMenu')}>
                            <div className="flex items-center gap-2">
                                <Menu className="h-4 w-4" /> Full Menu
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            This view displays all available managers and tools. You can sort this list alphabetically or create a custom drag-and-drop order using the "Organize Your Main Menu" tool.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger onClick={() => setView('grouped')}>
                             <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4" /> Groups
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            This view organizes the managers into logical categories like Workspace, Relationships, and Operations. This is helpful for finding tools based on the type of work you're doing.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger onClick={() => setView('dashboard')}>
                             <div className="flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4" /> Favorite Actions
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            This view displays your custom "Action Chips" for quick access to your most-used pages and tools. You can add, remove, and reorder these shortcuts using the "Manage Your Favorite Actions" tool.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2">
                                <Save className="h-4 w-4" /> Save Default View
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            Click the "Save" icon in the view switcher at the top of the sidebar to set your currently selected view (Full Menu, Groups, or Favorite Actions) as the default whenever you log in.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
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
  
  const handleToggleMenuViewPanel = () => {
    updatePreferences({ showMenuViewInstructions: !preferences.showMenuViewInstructions });
  };
  
  if (isLoading || !isClient) {
    return (
        <div className="p-4 sm:p-6 flex flex-col items-center">
            <header className="mb-6 text-center">
                <Skeleton className="h-8 w-64 mx-auto" />
                <Skeleton className="h-4 w-80 mx-auto mt-2" />
            </header>
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
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
                  Your central command for all Ogeemo actions.
              </p>
              <div className="mt-4">
                <LayoutDashboard className="h-10 w-10 text-primary mx-auto" />
              </div>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2">
              <Button asChild className="bg-slate-900 text-white hover:bg-slate-900/90 h-6 px-2 py-1 text-xs">
                  <Link href="/action-manager/manage">Manage Dashboard</Link>
              </Button>
              <Button onClick={handleToggleInfoPanel} className="bg-slate-900 text-white hover:bg-slate-900/90 h-6 px-2 py-1 text-xs">
                <Info className="mr-2 h-4 w-4" /> Info
              </Button>
            </div>
        </header>
        
        {preferences.showDashboardFrame && <InfoPanel onHide={() => updatePreferences({ showDashboardFrame: false })} />}
        
        <div className="w-full max-w-4xl space-y-6 flex flex-col items-center">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-primary/40">
                    <CardHeader className="text-center">
                        <CardTitle>Manage Your Favorite Actions</CardTitle>
                        <CardDescription>Organize the shortcuts that appear in your sidebar's "Favorite Actions" view.</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                         <Button asChild className="bg-[#3DD5C0] hover:bg-[#3DD5C0]/90 text-slate-900 h-6 px-2 py-1 text-xs border-b-4 border-black/20 active:mt-1 active:border-b-2">
                           <Link href="/action-manager/manage">Go to Manager <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
                 <Card className="border-2 border-primary/40">
                    <CardHeader className="text-center">
                        <CardTitle>Organize Your Main Menu</CardTitle>
                        <CardDescription>Sort your sidebar's "Full Menu" view alphabetically or create a custom drag-and-drop order.</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button asChild className="bg-[#3DD5C0] hover:bg-[#3DD5C0]/90 text-slate-900 h-6 px-2 py-1 text-xs border-b-4 border-black/20 active:mt-1 active:border-b-2">
                           <Link href="/a-z-sort">Go to Sorter <ArrowRight className="ml-2 h-4 w-4"/></Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            
            <Button onClick={handleToggleMenuViewPanel} className="bg-[#3DD5C0] hover:bg-[#3DD5C0]/90 text-slate-900 h-6 px-2 py-1 text-xs border-b-4 border-black/20 active:mt-1 active:border-b-2">Set Your Menu View</Button>

            {preferences.showMenuViewInstructions && <MenuViewInstructionPanel onHide={() => updatePreferences({ showMenuViewInstructions: false })} />}

            <Card className="w-full md:w-3/4 lg:w-1/2 border-2 border-primary/40 bg-muted/30">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-primary">From Vision to Command</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>The greatest empires are not built by chance, but by deliberate action. Every task you manage and every project you complete is a step towards your goal. This is your command center—lead the way.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
