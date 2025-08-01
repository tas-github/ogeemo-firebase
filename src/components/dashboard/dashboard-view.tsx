
'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Plus, Settings, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import { Mic } from 'lucide-react';
import { type ActionChipData } from '@/types/calendar';
import { useAuth } from '@/context/auth-context';
import { getActionChips, updateActionChips, getTrashedActionChips, updateTrashedActionChips, addActionChip, managerOptions } from '@/services/project-service';
import { ActionChip } from './ActionChip';
import { ChipDropZone } from './ChipDropZone';
import AddActionDialog from './AddActionDialog';

const OgeemoChatDialog = dynamic(() => import('@/components/ogeemail/ogeemo-chat-dialog'), {
  loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});

export function DashboardView() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userChips, setUserChips] = useState<ActionChipData[]>([]);
  const [trashedChips, setTrashedChips] = useState<ActionChipData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isAddActionDialogOpen, setIsAddActionDialogOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const loadChipData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [chips, trashed] = await Promise.all([
        getActionChips(user.uid),
        getTrashedActionChips(user.uid),
      ]);
      setUserChips(chips);
      setTrashedChips(trashed);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Could not load actions", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);
  
  useEffect(() => {
    loadChipData();
  }, [loadChipData]);
  
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
            setUserChips(userChips);
        }
    }
  }, [userChips, user, toast]);

  const handleActionAdded = (newChip: ActionChipData) => {
    setUserChips(prev => [...prev, newChip]);
  };
  
  const moveChipToTrash = useCallback(async (chip: ActionChipData) => {
    if (!user) return;
    
    const newActiveChips = userChips.filter(c => c.id !== chip.id);
    const newTrashedChips = [...trashedChips, chip];

    setUserChips(newActiveChips);
    setTrashedChips(newTrashedChips);

    try {
        await Promise.all([
            updateActionChips(user.uid, newActiveChips),
            updateTrashedActionChips(user.uid, newTrashedChips),
        ]);
        toast({ title: `Moved "${chip.label}" to trash` });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Failed to move to trash' });
        loadChipData(); // Revert on failure
    }
  }, [user, userChips, trashedChips, toast, loadChipData]);

  const restoreChipFromTrash = useCallback(async (chip: ActionChipData) => {
    if (!user) return;

    const newTrashedChips = trashedChips.filter(c => c.id !== chip.id);
    const newActiveChips = [...userChips, chip];
    
    setTrashedChips(newTrashedChips);
    setUserChips(newActiveChips);
    
    try {
        await Promise.all([
            updateTrashedActionChips(user.uid, newTrashedChips),
            updateActionChips(user.uid, newActiveChips),
        ]);
        toast({ title: `Restored "${chip.label}"` });
    } catch (e) {
         toast({ variant: 'destructive', title: 'Failed to restore' });
         loadChipData(); // Revert on failure
    }
  }, [user, userChips, trashedChips, toast, loadChipData]);
  
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
        
        {isManaging ? (
            // MANAGEMENT VIEW
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex-row justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl text-primary font-headline">Manage Actions</CardTitle>
                            <CardDescription className="max-w-prose">
                                Drag actions to reorder them or move them to the trash.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button onClick={() => setIsAddActionDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Action
                            </Button>
                            <Button variant="outline" onClick={() => setIsManaging(false)}>Done</Button>
                        </div>
                    </CardHeader>
                    <ChipDropZone onDrop={restoreChipFromTrash} chips={userChips}>
                        {userChips.map((chip, index) => (
                            <ActionChip
                                key={chip.id}
                                chip={chip}
                                index={index}
                                onMove={moveChipInList}
                                isDeletable={false}
                            />
                        ))}
                    </ChipDropZone>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5"/>Trash</CardTitle>
                        <CardDescription>Drag actions here to delete them. Drag them back to restore.</CardDescription>
                    </CardHeader>
                    <ChipDropZone onDrop={moveChipToTrash} chips={trashedChips}>
                        {trashedChips.length > 0 ? (
                            trashedChips.map((chip, index) => (
                               <ActionChip
                                    key={chip.id}
                                    chip={chip}
                                    index={index}
                                    onMove={() => {}}
                                    isDeletable={false}
                                />
                            ))
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-sm text-muted-foreground p-4">
                                Trash is empty.
                            </div>
                        )}
                    </ChipDropZone>
                </Card>
            </div>
        ) : (
            // DEFAULT VIEW
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-primary font-headline">Your Action Dashboard</CardTitle>
                    <CardDescription className="max-w-prose">Click an action to get started.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[100px] flex flex-wrap gap-2 p-4">
                    {userChips.map((chip, index) => (
                        <ActionChip
                            key={chip.id}
                            chip={chip}
                            index={index}
                            onMove={() => {}} // No moving in this view
                            isDeletable={false}
                        />
                    ))}
                    <Button variant="outline" className="w-40 justify-start" onClick={() => setIsManaging(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Actions
                    </Button>
                </CardContent>
            </Card>
        )}
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
