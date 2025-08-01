
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mail, Briefcase, ListTodo, Calendar, Clock, Contact, Beaker, Calculator, Folder, Wand2, MessageSquare, HardHat, Contact2, Share2, Users2, PackageSearch, Megaphone, Landmark, DatabaseBackup, BarChart3, HeartPulse, Bell, Bug, Database, FilePlus2, LogOut, Settings, Plus, Mic, Lightbulb } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { ActionChip } from './ActionChip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import type { LucideIcon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const OgeemoChatDialog = dynamic(() => import('@/components/ogeemail/ogeemo-chat-dialog'), {
  loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});

export interface ActionChipData {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const ACTION_CHIPS_STORAGE_KEY = 'ogeemo-action-chips';

const defaultChips: ActionChipData[] = [
  { id: 'default-chip-1', label: 'OgeeMail', icon: Mail, href: '/ogeemail' },
  { id: 'default-chip-2', label: 'Contacts', icon: Contact, href: '/contacts' },
  { id: 'default-chip-3', label: 'Projects', icon: Briefcase, href: '/projects' },
  { id: 'default-chip-4', label: 'Files', icon: Folder, href: '/files' },
];

const availableActions: Omit<ActionChipData, 'id'>[] = [
    { label: 'OgeeMail', icon: Mail, href: '/ogeemail' },
    { label: 'Communications', icon: MessageSquare, href: '/communications' },
    { label: 'Contacts', icon: Contact, href: '/contacts' },
    { label: 'Projects', icon: Briefcase, href: '/projects' },
    { label: 'Tasks', icon: ListTodo, href: '/tasks' },
    { label: 'Calendar', icon: Calendar, href: '/calendar' },
    { label: 'Files', icon: Folder, href: '/files' },
    { label: 'Ideas', icon: Lightbulb, href: '/ideas' },
    { label: 'Research', icon: Beaker, href: '/research' },
    { label: 'Accounting', icon: Calculator, href: '/accounting' },
    { label: 'Time', icon: Clock, href: '/time' },
    { label: 'HR Manager', icon: Contact2, href: '/hr-manager' },
    { label: 'Social Media', icon: Share2, href: '/social-media-manager' },
    { label: 'CRM', icon: Users2, href: '/crm' },
    { label: 'Inventory', icon: PackageSearch, href: '/inventory-manager' },
    { label: 'Marketing', icon: Megaphone, href: '/marketing-manager' },
    { label: 'Legal Hub', icon: Landmark, href: '/legal-hub' },
    { label: 'Google', icon: Wand2, href: '/google' },
    { label: 'Backup', icon: DatabaseBackup, href: '/backup' },
    { label: 'Reports', icon: BarChart3, href: '/reports' },
    { label: 'Hytexercise', icon: HeartPulse, href: '/hytexercise' },
    { label: 'Alerts', icon: Bell, href: '/alerts' },
    { label: 'My Worker', icon: HardHat, href: '/my-worker' },
    { label: 'Test Chat', icon: Bug, href: '/test-chat' },
    { label: 'Sandbox', icon: Beaker, href: '/sandbox' },
    { label: 'Debug', icon: HardHat, href: '/debug' },
    { label: 'Data', icon: Database, href: '/data' },
    { label: 'Forms', icon: FilePlus2, href: '/forms' },
];

export function DashboardView() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userChips, setUserChips] = useState<ActionChipData[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const savedChipsRaw = localStorage.getItem(ACTION_CHIPS_STORAGE_KEY);
    if (savedChipsRaw) {
        try {
            const saved = JSON.parse(savedChipsRaw);
            setUserChips(saved);
        } catch (error) {
            console.error("Failed to parse saved chips, reverting to default:", error);
            localStorage.setItem(ACTION_CHIPS_STORAGE_KEY, JSON.stringify(defaultChips));
            setUserChips(defaultChips);
        }
    } else {
        setUserChips(defaultChips);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(ACTION_CHIPS_STORAGE_KEY, JSON.stringify(userChips));
    }
  }, [userChips, isClient]);
  
  const addChipFromMenu = (chipToAdd: Omit<ActionChipData, 'id'>) => {
    setUserChips(prevChips => {
        const exists = prevChips.some(c => c.label === chipToAdd.label);
        if (exists) {
            toast({
                variant: 'destructive',
                title: 'Action already exists',
                description: `The "${chipToAdd.label}" action is already on your dashboard.`,
            });
            return prevChips;
        }
        const newChip: ActionChipData = {
            id: `chip-${Date.now()}`,
            ...chipToAdd,
        };
        return [...prevChips, newChip];
    });
  };

  const handleDeleteChip = useCallback((chipId: string) => {
    setUserChips(prevChips => prevChips.filter(c => c.id !== chipId));
  }, []);
  
  const availableChipsForMenu = availableActions.filter(
    (availChip) => !userChips.some((userChip) => userChip.label === availChip.label)
  );

  if (!isClient) {
    return (
        <div className="p-4 sm:p-6 space-y-6">
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="h-24" />
                <div className="h-24" />
                <div className="h-24" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="h-64" />
                <div className="h-64" />
            </div>
        </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <header className="text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Action Manager</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
                Your command center. Start a timer, log an event, or chat with the assistant.
            </p>
        </header>

        <Button onClick={() => setIsChatOpen(true)} className="w-full text-left p-6 h-auto bg-primary/10 text-primary hover:bg-primary/20 border-2 border-primary/20">
            <Mic className="h-5 w-5 mr-3" />
            <span className="text-lg">Tell me what to do...</span>
        </Button>
        
        <div className="grid grid-cols-1 gap-6 items-start">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-primary font-headline">Your Favorite Actions</CardTitle>
                    <CardDescription className="max-w-prose mx-auto">
                        Click the 'Add Action' button to add new shortcuts to your dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent
                    className="min-h-[100px] flex flex-wrap gap-2 justify-center"
                >
                    {userChips.map((chip, index) => (
                        <ActionChip key={chip.id} chip={chip} onDelete={handleDeleteChip} isDeletable={true} />
                    ))}
                </CardContent>
                 <CardFooter className="flex-col sm:flex-row justify-center items-center gap-4">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Action
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-96">
                            <ScrollArea className="h-full">
                                {availableChipsForMenu.length > 0 ? (
                                    availableChipsForMenu.map((chip, index) => (
                                        <DropdownMenuItem key={index} onSelect={() => addChipFromMenu(chip)}>
                                            <chip.icon className="mr-2 h-4 w-4" />
                                            <span>{chip.label}</span>
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    <DropdownMenuItem disabled>All actions have been added</DropdownMenuItem>
                                )}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            </Card>
        </div>
      </div>
      {isChatOpen && <OgeemoChatDialog isOpen={isChatOpen} onOpenChange={setIsChatOpen} />}
    </>
  );
}
