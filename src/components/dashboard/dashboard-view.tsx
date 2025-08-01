
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mail, Briefcase, ListTodo, Calendar, Clock, Contact, Beaker, Calculator, Folder, Wand2, MessageSquare, HardHat, Contact2, Share2, Users2, PackageSearch, Megaphone, Landmark, DatabaseBackup, BarChart3, HeartPulse, Bell, Bug, Database, FilePlus2, LogOut, Settings, Plus, Mic, Lightbulb } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ActionChip } from './ActionChip';
import { ChipDropZone } from './ChipDropZone';
import { useToast } from '@/hooks/use-toast';
import type { LucideIcon } from 'lucide-react';

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

const allAvailableActions: Omit<ActionChipData, 'id'>[] = [
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
  const [isManageMode, setIsManageMode] = useState(false);

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
  
  const handleDeleteChip = useCallback((chipId: string) => {
    setUserChips(prevChips => prevChips.filter(c => c.id !== chipId));
  }, []);

  const handleDropOnFavorites = (droppedChip: ActionChipData) => {
    // If the chip is already in userChips, do nothing (it's just reordering, which we don't handle yet)
    // If it's not, add it.
    if (!userChips.some(chip => chip.label === droppedChip.label)) {
      setUserChips(prevChips => [...prevChips, { ...droppedChip, id: `chip-${Date.now()}` }]);
    }
  };

  const handleDropOnAvailable = (droppedChip: ActionChipData) => {
    // If the chip is in userChips, remove it.
    setUserChips(prevChips => prevChips.filter(chip => chip.label !== droppedChip.label));
  };
  
  const availableChipsForDisplay = allAvailableActions
    .filter(availChip => !userChips.some(userChip => userChip.label === availChip.label))
    .map(chip => ({ ...chip, id: `avail-${chip.label}` }));

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
        
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <div>
                    <CardTitle className="text-2xl text-primary font-headline">Your Action Dashboard</CardTitle>
                    <CardDescription className="max-w-prose">
                        {isManageMode ? "Drag actions between 'Your Favorite Actions' and 'Available Actions' to customize." : "Click an action to get started."}
                    </CardDescription>
                </div>
                <Button onClick={() => setIsManageMode(!isManageMode)}>
                    {isManageMode ? "Done Managing" : "Manage Actions"}
                </Button>
            </CardHeader>
            <ChipDropZone onDrop={handleDropOnFavorites}>
                {userChips.map((chip) => (
                    <ActionChip key={chip.id} chip={chip} onDelete={handleDeleteChip} isDeletable={isManageMode} />
                ))}
            </ChipDropZone>
        </Card>

        {isManageMode && (
            <Card className="animate-in fade-in-50 duration-300">
                <CardHeader>
                    <CardTitle>Available Actions</CardTitle>
                    <CardDescription>Drag an action from here to your dashboard to add it. Drag an action from your dashboard here to remove it.</CardDescription>
                </CardHeader>
                <ChipDropZone onDrop={handleDropOnAvailable}>
                    {availableChipsForDisplay.map((chip) => (
                         <ActionChip key={chip.id} chip={chip} isDeletable={false} />
                    ))}
                </ChipDropZone>
            </Card>
        )}

      </div>
      {isChatOpen && <OgeemoChatDialog isOpen={isChatOpen} onOpenChange={setIsChatOpen} />}
    </>
  );
}
