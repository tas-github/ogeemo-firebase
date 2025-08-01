
'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog";
import { Mail, Briefcase, ListTodo, Calendar, Clock, Contact, Beaker, Calculator, Folder, Wand2, MessageSquare, HardHat, Contact2, Share2, Users2, PackageSearch, Megaphone, Landmark, DatabaseBackup, BarChart3, HeartPulse, Bell, Bug, Database, FilePlus2, LogOut, Settings, Mic, Lightbulb, SortAsc, Trash2, UserPlus } from 'lucide-react';
import { type ActionChipData } from '@/types/calendar';
import { useAuth } from '@/context/auth-context';
import { getActionChips, updateActionChips, addActionChip, type ManagerOption } from '@/services/project-service';
import { ActionChip } from './ActionChip';
import { ChipDropZone } from './ChipDropZone';
import AddActionDialog from './AddActionDialog';

const OgeemoChatDialog = dynamic(() => import('@/components/ogeemail/ogeemo-chat-dialog'), {
  loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});

export function DashboardView() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userChips, setUserChips] = useState<ActionChipData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isAddActionDialogOpen, setIsAddActionDialogOpen] = useState(false);

  useEffect(() => {
    async function loadChips() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const chips = await getActionChips(user.uid);
        setUserChips(chips);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Could not load actions", description: error.message });
      } finally {
        setIsLoading(false);
      }
    }
    loadChips();
  }, [user, toast]);
  
  const moveChipInList = useCallback(async (dragIndex: number, hoverIndex: number) => {
    const draggedChip = userChips[dragIndex];
    const reorderedChips = update(userChips, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, draggedChip],
      ],
    });
    
    setUserChips(reorderedChips);

    if (user) {
        try {
            await updateActionChips(user.uid, reorderedChips);
        } catch(e) {
            toast({ variant: 'destructive', title: 'Failed to save order' });
            // Revert optimistic update
            setUserChips(userChips);
        }
    }
  }, [userChips, user, toast]);

  const handleActionAdded = (newChip: ActionChipData) => {
    setUserChips(prev => [...prev, newChip]);
  };
  
  if (isLoading) {
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
                        Click an action to get started or add a new one.
                    </CardDescription>
                </div>
                <Button onClick={() => setIsAddActionDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Action
                </Button>
            </CardHeader>
            <ChipDropZone onDrop={() => {}} chips={userChips}>
                {userChips.map((chip, index) => (
                    <ActionChip
                        key={chip.id}
                        chip={chip}
                        index={index}
                        onMove={(dragIndex, hoverIndex) => moveChipInList(dragIndex, hoverIndex)}
                        isDeletable={false}
                    />
                ))}
            </ChipDropZone>
        </Card>

      </div>
      {isChatOpen && <OgeemoChatDialog isOpen={isChatOpen} onOpenChange={setIsChatOpen} />}
      
      <AddActionDialog
        isOpen={isAddActionDialogOpen}
        onOpenChange={setIsAddActionDialogOpen}
        onActionAdded={handleActionAdded}
      />
    </DndProvider>
  );
}
