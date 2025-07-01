'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Lightbulb, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Idea {
  id: number;
  text: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIdea.trim()) {
      setIdeas([...ideas, { id: Date.now(), text: newIdea.trim() }]);
      setNewIdea('');
    }
  };

  const handleDeleteIdea = (id: number) => {
    setIdeas(ideas.filter((idea) => idea.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
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
        <AnimatePresence>
          {ideas.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {ideas.map((idea) => (
                <motion.div
                  key={idea.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <Card className="h-full flex flex-col group">
                    <CardHeader className="flex-row items-center gap-3 space-y-0">
                       <div className="p-2 bg-primary/10 rounded-full">
                           <Lightbulb className="h-5 w-5 text-primary" />
                       </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-foreground">{idea.text}</p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteIdea(idea.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <Lightbulb className="mx-auto h-12 w-12 " />
              <p className="mt-4">Your idea board is empty. Add your first idea to get started!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
