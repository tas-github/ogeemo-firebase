
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Lightbulb, MessageSquare, MoreVertical, Trash2, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EditIdeaDialog from '@/components/ideas/edit-idea-dialog';

interface Idea {
  id: number;
  title: string;
  content: string;
}

const IDEAS_STORAGE_KEY = 'ogeemo-ideas';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  useEffect(() => {
    try {
      const savedIdeasRaw = localStorage.getItem(IDEAS_STORAGE_KEY);
      if (savedIdeasRaw) {
        let savedIdeas = JSON.parse(savedIdeasRaw);
        // Simple migration for old data structure { id, text } to new { id, title, content }
        const migratedIdeas = savedIdeas.map((idea: any) => {
          if (typeof idea.text === 'string' && typeof idea.content === 'undefined') {
            return { id: idea.id, title: idea.text, content: '' };
          }
          return idea;
        });
        setIdeas(migratedIdeas);
      }
    } catch (error) {
      console.error("Failed to parse ideas from localStorage", error);
      setIdeas([]);
    }
  }, []);

  const updateIdeas = (newIdeas: Idea[]) => {
    setIdeas(newIdeas);
    try {
      localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(newIdeas));
    } catch (error) {
      console.error("Failed to save ideas to localStorage", error);
    }
  };

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIdea.trim()) {
      const newIdeasArray = [...ideas, { id: Date.now(), title: newIdea.trim(), content: '' }];
      updateIdeas(newIdeasArray);
      setNewIdea('');
    }
  };

  const handleDeleteIdea = (id: number) => {
    const newIdeasArray = ideas.filter((idea) => idea.id !== id);
    updateIdeas(newIdeasArray);
  };

  const handleSaveIdea = (updatedIdea: Idea) => {
    const newIdeasArray = ideas.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea);
    updateIdeas(newIdeasArray);
    setEditingIdea(null);
  };
  
  const handleOpenEditDialog = (idea: Idea) => {
    setEditingIdea(idea);
  };

  return (
    <>
      <div className="p-4 sm:p-6 flex flex-col h-full">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold font-headline text-primary">
            Idea Board
          </h1>
          <p className="text-muted-foreground">
            Capture and develop your creative thoughts.
          </p>
        </header>

        <div className="max-w-xl mx-auto w-full mb-8">
          <form onSubmit={handleAddIdea} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="What's your next big idea?"
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
            />
            <Button type="submit">Add Idea</Button>
          </form>
        </div>

        <div className="flex-1">
          {ideas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ideas.map((idea) => (
                <Card key={idea.id} className="h-full flex flex-col group">
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-bold truncate flex-1">{idea.title}</h4>
                  </CardHeader>
                  <CardContent className="flex-1">
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                        <div dangerouslySetInnerHTML={{ __html: idea.content }} />
                      </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">More options</span>
                          </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleOpenEditDialog(idea)} className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit / Develop</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => console.log('Ask for feedback for idea:', idea.id)}
                              className="cursor-pointer"
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              <span>Ask for feedback</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleDeleteIdea(idea.id)}
                                className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <Lightbulb className="mx-auto h-12 w-12 " />
              <p className="mt-4">Your idea board is empty. Add your first idea to get started!</p>
            </div>
          )}
        </div>
      </div>
      
      {editingIdea && (
        <EditIdeaDialog
            idea={editingIdea}
            isOpen={!!editingIdea}
            onOpenChange={(isOpen) => !isOpen && setEditingIdea(null)}
            onSave={handleSaveIdea}
        />
      )}
    </>
  );
}
