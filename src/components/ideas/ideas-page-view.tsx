
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDrag, useDrop, type XYCoord } from 'react-dnd';
import { MoreVertical, Calendar, Briefcase, Pencil, Trash2, Archive, LoaderCircle, Info, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditIdeaDialog from './edit-idea-dialog';
import IdeaBoardInstructionsDialog from './idea-board-instructions-dialog'; // Import the new component
import { useToast } from '@/hooks/use-toast';
import { archiveIdeaAsFile } from '@/services/file-service';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { getIdeas, addIdea as saveIdea, updateIdea as updateIdeaInDb, deleteIdea as deleteIdeaFromDb, updateIdeaPositions } from '@/services/ideas-service';
import { type Idea } from '@/types/calendar-types';

const ItemTypes = {
    IDEA: 'idea',
};

interface IdeaCardProps {
    idea: Idea;
    ideas: Idea[]; // Pass the full list to calculate hover index
    onDelete: (id: string) => void;
    onEdit: (idea: Idea) => void;
    onSchedule: (idea: Idea) => void;
    onMakeProject: (idea: Idea) => void;
    onArchive: (idea: Idea) => void;
    onMoveCard: (id: string, toIndex: number, toStatus: 'Yes' | 'No' | 'Maybe') => void;
}

const IdeaCard = ({ idea, ideas, onDelete, onEdit, onSchedule, onMakeProject, onArchive, onMoveCard }: IdeaCardProps) => {
    const ref = useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.IDEA,
        item: () => ({ ...idea }),
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: ItemTypes.IDEA,
        hover(item: Idea, monitor) {
            if (!ref.current || item.id === idea.id) {
                return;
            }
            const hoverIndex = ideas.findIndex(i => i.id === idea.id);
            onMoveCard(item.id, hoverIndex, idea.status);
        },
    });

    drag(drop(ref));

    return (
        <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
            <Card className="mt-4 cursor-move">
                <CardContent className="p-3 flex items-center justify-between">
                    <div>
                        <p className="font-semibold">{idea.title}</p>
                        {idea.description && <p className="text-xs text-muted-foreground line-clamp-1">{idea.description}</p>}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onSchedule(idea)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Schedule Item to calendar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onMakeProject(idea)}>
                                <Briefcase className="mr-2 h-4 w-4" />
                                <span>Create New Project</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => onArchive(idea)}>
                                <Archive className="mr-2 h-4 w-4" />
                                <span>Archive as Reference</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => onEdit(idea)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive"
                                onSelect={() => onDelete(idea.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardContent>
            </Card>
        </div>
    );
};


export default function IdeasPage() {
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [ideaToEdit, setIdeaToEdit] = useState<Idea | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false); // State for instructions dialog
    const [inputMode, setInputMode] = useState<'Yes' | 'No' | 'Maybe' | null>(null);
    const [newIdeaTitle, setNewIdeaTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    
    useEffect(() => {
        async function loadData() {
            if (!user) {
                setIsLoading(false);
                return;
            };
            setIsLoading(true);
            try {
                const fetchedIdeas = await getIdeas(user.uid);
                setIdeas(fetchedIdeas);
            } catch (error) {
                console.error("Failed to load ideas from Firestore", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load your ideas.' });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user, toast]);

    const addIdea = async (status: 'Yes' | 'No' | 'Maybe') => {
        if (!newIdeaTitle.trim() || !user) {
            setInputMode(null);
            return;
        }
        const position = ideas.filter(i => i.status === status).length;
        try {
            const newIdeaData: Omit<Idea, 'id'> = {
                title: newIdeaTitle.trim(),
                status,
                position,
                userId: user.uid,
                createdAt: new Date(),
            };
            const savedIdea = await saveIdea(newIdeaData);
            setIdeas(prevIdeas => [...prevIdeas, savedIdea]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save the new idea.' });
        } finally {
            setNewIdeaTitle('');
            setInputMode(null);
        }
    };

    const deleteIdea = async (idToDelete: string) => {
        const originalIdeas = ideas;
        setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== idToDelete));
        try {
            await deleteIdeaFromDb(idToDelete);
        } catch (error) {
            setIdeas(originalIdeas);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the idea.' });
        }
    };

    const handleEdit = (idea: Idea) => {
        setIdeaToEdit(idea);
        setIsEditDialogOpen(true);
    };

    const handleSave = async (updatedIdea: Idea) => {
        const originalIdeas = ideas;
        setIdeas(prevIdeas => prevIdeas.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea));
        try {
            const { id, ...dataToUpdate } = updatedIdea;
            await updateIdeaInDb(id, dataToUpdate);
            toast({ title: "Idea Updated" });
        } catch (error) {
            setIdeas(originalIdeas);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save your changes.' });
        }
    };

    const handleSchedule = (idea: Idea) => {
        const scheduleData = {
            title: idea.title,
            description: idea.description,
        };
        sessionStorage.setItem('ogeemo-idea-to-schedule', JSON.stringify(scheduleData));
        router.push('/time');
    };
    
    const handleMakeProject = (idea: Idea) => {
        const projectData = {
            title: idea.title,
            description: idea.description,
        };
        sessionStorage.setItem('ogeemo-idea-to-project', JSON.stringify(projectData));
        router.push('/projects');
    };
    
    const handleArchive = async (idea: Idea) => {
        if (!user) {
            toast({ variant: "destructive", title: "You must be logged in to archive ideas." });
            return;
        }
        try {
            await archiveIdeaAsFile(user.uid, idea.title, idea.description || '');
            toast({
                title: "Idea Archived",
                description: `"${idea.title}" has been saved to your File Manager.`,
            });
            await deleteIdea(idea.id); // Remove from board after archiving
        } catch (error: any) {
            toast({ variant: "destructive", title: "Archive Failed", description: error.message });
        }
    };

    const moveCard = useCallback((id: string, toIndex: number, toStatus: 'Yes' | 'No' | 'Maybe') => {
        setIdeas(prev => {
            const ideaToMove = prev.find(i => i.id === id);
            if (!ideaToMove) return prev;
            
            const listWithoutItem = prev.filter(i => i.id !== id);
            
            listWithoutItem.splice(toIndex, 0, { ...ideaToMove, status: toStatus });

            const positionUpdates = listWithoutItem.map((idea, index) => ({
                id: idea.id,
                position: index,
                status: idea.status
            }));
            
            updateIdeaPositions(positionUpdates);
            
            return listWithoutItem;
        });
    }, []);

    const renderColumn = (status: 'Yes' | 'No' | 'Maybe') => {
        const columnIdeas = ideas.filter(idea => idea.status === status).sort((a,b) => a.position - b.position);
        
        const [{ isOver, canDrop }, drop] = useDrop(() => ({
            accept: ItemTypes.IDEA,
            drop: (item: Idea) => {
                if (item.status !== status) {
                    moveCard(item.id, columnIdeas.length, status);
                }
            },
            collect: (monitor) => ({
                isOver: monitor.isOver(),
                canDrop: monitor.canDrop(),
            }),
        }));
        
        return (
            <Card className="flex flex-col">
                <CardHeader>
                    {inputMode === status ? (
                        <div className="flex items-center gap-2">
                            <Input
                                autoFocus
                                value={newIdeaTitle}
                                onChange={(e) => setNewIdeaTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') addIdea(status);
                                    if (e.key === 'Escape') setInputMode(null);
                                }}
                                onBlur={() => setInputMode(null)}
                                placeholder="Enter idea title..."
                            />
                            <Button size="sm" onMouseDown={(e) => { e.preventDefault(); addIdea(status); }}>Add</Button>
                        </div>
                    ) : (
                        <div className="w-1/2 mx-auto">
                            <Button
                                onClick={() => {
                                    setInputMode(status);
                                    setNewIdeaTitle('');
                                }}
                                className="w-full h-8 py-1 text-sm bg-gradient-to-r from-[#C3FFF9] to-[#62C1B6] text-black border-b-4 border-black/30 shadow-lg hover:from-[#C3FFF9]/90 hover:to-[#62C1B6]/90 active:mt-1 active:border-b-2">
                                {status}
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent ref={drop} className={cn("flex-1", isOver && canDrop && 'bg-primary/10')}>
                    {isLoading ? <LoaderCircle className="mx-auto h-6 w-6 animate-spin" /> : columnIdeas
                        .map((idea, index) => (
                            <IdeaCard
                                key={idea.id}
                                idea={idea}
                                ideas={columnIdeas}
                                onDelete={deleteIdea}
                                onEdit={handleEdit}
                                onSchedule={handleSchedule}
                                onMakeProject={handleMakeProject}
                                onArchive={handleArchive}
                                onMoveCard={moveCard}
                            />
                        ))}
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            <div className="p-4 sm:p-6 flex flex-col h-full items-center">
                <header className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2">
                        <Lightbulb className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold font-headline text-primary">
                            Idea Board
                        </h1>
                        <Button variant="ghost" size="icon" onClick={() => setIsInstructionsOpen(true)}>
                            <Info className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        A digital whiteboard to capture and triage your ideas.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-6">
                    {renderColumn('Yes')}
                    {renderColumn('No')}
                    {renderColumn('Maybe')}
                </div>
            </div>
            <EditIdeaDialog 
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                idea={ideaToEdit}
                onSave={handleSave}
            />
            <IdeaBoardInstructionsDialog
                isOpen={isInstructionsOpen}
                onOpenChange={setIsInstructionsOpen}
            />
        </>
    );
}
