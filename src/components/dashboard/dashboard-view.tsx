
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mail, Briefcase, ListTodo, Calendar, Clock, Contact, Beaker, Calculator, Folder, Wand2, MessageSquare, HardHat, Contact2, Share2, Users2, PackageSearch, Megaphone, Landmark, DatabaseBackup, BarChart3, HeartPulse, Bell, Bug, Database, FilePlus2, LogOut, Settings, Plus, Mic, Lightbulb, SortAsc } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ActionChip } from './ActionChip';
import { ChipDropZone } from './ChipDropZone';
import { useToast } from '@/hooks/use-toast';
import type { LucideIcon } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


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
  const [availableChips, setAvailableChips] = useState<ActionChipData[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [isManageMode, setIsManageMode] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedChipsRaw = localStorage.getItem(ACTION_CHIPS_STORAGE_KEY);
    let initialUserChips = defaultChips;
    if (savedChipsRaw) {
        try {
            initialUserChips = JSON.parse(savedChipsRaw);
        } catch (error) {
            console.error("Failed to parse saved chips, reverting to default:", error);
            localStorage.setItem(ACTION_CHIPS_STORAGE_KEY, JSON.stringify(defaultChips));
        }
    }
    setUserChips(initialUserChips);
  }, []);

  useEffect(() => {
    const available = allAvailableActions
        .filter(availChip => !userChips.some(userChip => userChip.label === availChip.label))
        .map(chip => ({ ...chip, id: `avail-${chip.label}` }));
    setAvailableChips(available);

    if (isClient && isManageMode) {
      localStorage.setItem(ACTION_CHIPS_STORAGE_KEY, JSON.stringify(userChips));
    }
  }, [userChips, isClient, isManageMode]);
  
  const handleDeleteChip = useCallback((chipId: string) => {
    const chipToRemove = userChips.find(c => c.id === chipId);
    if (chipToRemove) {
        setUserChips(prevChips => prevChips.filter(c => c.id !== chipId));
    }
  }, [userChips]);

  const handleDropOnFavorites = useCallback((droppedChip: ActionChipData) => {
    if (!userChips.some(c => c.label === droppedChip.label)) {
        setUserChips(prev => [...prev, { ...droppedChip, id: `user-chip-${Date.now()}` }]);
    }
  }, [userChips]);

  const handleDropOnAvailable = useCallback((droppedChip: ActionChipData) => {
    if (userChips.some(c => c.label === droppedChip.label)) {
        setUserChips(prev => prev.filter(c => c.label !== droppedChip.label));
    }
  }, [userChips]);

  const moveChipInList = useCallback((dragIndex: number, hoverIndex: number, listType: 'user' | 'available') => {
    const list = listType === 'user' ? userChips : availableChips;
    const setList = listType === 'user' ? setUserChips : setAvailableChips;

    const draggedChip = list[dragIndex];
    setList(
      update(list, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, draggedChip],
        ],
      }),
    );
  }, [userChips, availableChips]);

  const sortChipsAlphabetically = (listType: 'user' | 'available') => {
    const list = listType === 'user' ? userChips : availableChips;
    const setList = listType === 'user' ? setUserChips : setAvailableChips;
    const sortedList = [...list].sort((a, b) => a.label.localeCompare(b.label));
    setList(sortedList);
    toast({ title: `${listType === 'user' ? 'Favorite' : 'Available'} actions sorted.` });
  };

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
    <DndProvider backend={HTML5Backend}>
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
                        {isManageMode ? "Drag actions to reorder them or move them between lists." : "Click an action to get started."}
                    </CardDescription>
                </div>
                <Button onClick={() => setIsManageMode(!isManageMode)}>
                    {isManageMode ? "Done Managing" : "Manage Actions"}
                </Button>
            </CardHeader>
            <ChipDropZone onDrop={handleDropOnFavorites} chips={userChips}>
                {userChips.map((chip, index) => (
                    <ActionChip
                        key={chip.id}
                        chip={chip}
                        index={index}
                        onDelete={handleDeleteChip}
                        onMove={(dragIndex, hoverIndex) => moveChipInList(dragIndex, hoverIndex, 'user')}
                        isDeletable={isManageMode}
                    />
                ))}
            </ChipDropZone>
        </Card>

        {isManageMode && (
            <Card className="animate-in fade-in-50 duration-300">
                <CardHeader className="flex-row justify-between items-center">
                    <div>
                        <CardTitle>Available Actions</CardTitle>
                        <CardDescription>Drag an action from here to your dashboard to add it. Drag an action from your dashboard here to remove it.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => sortChipsAlphabetically('available')}>
                        <SortAsc className="mr-2 h-4 w-4" /> Sort A-Z
                    </Button>
                </CardHeader>
                <ChipDropZone onDrop={handleDropOnAvailable} chips={availableChips}>
                    {availableChips.map((chip, index) => (
                         <ActionChip
                            key={chip.id}
                            chip={chip}
                            index={index}
                            onMove={(dragIndex, hoverIndex) => moveChipInList(dragIndex, hoverIndex, 'available')}
                            isDeletable={false}
                         />
                    ))}
                </ChipDropZone>
            </Card>
        )}

      </div>
      {isChatOpen && <OgeemoChatDialog isOpen={isChatOpen} onOpenChange={setIsChatOpen} />}
    </DndProvider>
  );
}
