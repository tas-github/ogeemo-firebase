
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, Trash2, Briefcase, ListChecks, LoaderCircle, Calendar, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getTodos, addTodo, deleteTodo, updateTodo, type ToDoItem } from '@/services/todo-service';

export function ToDoListView() {
  const [todos, setTodos] = useState<ToDoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const loadTodos = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userTodos = await getTodos(user.uid);
      setTodos(userTodos);
    } catch (error) {
      console.error("Failed to load to-dos:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to load items',
        description: 'Could not retrieve your to-do list.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !user) return;

    try {
      const savedTodo = await addTodo({
        text: newTodo.trim(),
        userId: user.uid,
        createdAt: new Date(),
      });
      setTodos(prev => [savedTodo, ...prev]);
      setNewTodo('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save new to-do item.' });
    }
  };

  const handleDeleteTodo = async (id: string) => {
    const originalTodos = [...todos];
    setTodos(todos.filter(todo => todo.id !== id));
    try {
      await deleteTodo(id);
    } catch (error) {
      setTodos(originalTodos);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the to-do item.' });
    }
  };
  
  const handleStartEdit = (todo: ToDoItem) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };
  
  const handleUpdateTodo = async () => {
    if (!editingId || !editingText.trim()) {
      setEditingId(null);
      return;
    }
    const originalText = todos.find(t => t.id === editingId)?.text;
    if (originalText === editingText) {
      setEditingId(null);
      return;
    }

    setTodos(prev => prev.map(t => t.id === editingId ? { ...t, text: editingText } : t));
    try {
      await updateTodo(editingId, editingText);
    } catch (error) {
      setTodos(prev => prev.map(t => t.id === editingId ? { ...t, text: originalText! } : t));
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update item.' });
    } finally {
      setEditingId(null);
    }
  };
  
  const handleMakeTask = (todo: ToDoItem) => {
    router.push(`/master-mind?title=${encodeURIComponent(todo.text)}`);
  };

  const handleMakeProject = (todo: ToDoItem) => {
    sessionStorage.setItem('ogeemo-idea-to-project', JSON.stringify({ title: todo.text }));
    router.push('/projects');
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col items-center h-full">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">A To Do List</h1>
        <p className="text-muted-foreground">A simple place to quickly capture tasks and ideas.</p>
      </header>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>My To-Dos</CardTitle>
          <div className="flex w-full items-center space-x-2 pt-2">
            <Input
              type="text"
              placeholder="e.g., Follow up with Jane Doe..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTodo(); }}
            />
            <Button onClick={handleAddTodo}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : todos.length > 0 ? (
              todos.map(todo => (
                <div key={todo.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
                  {editingId === todo.id ? (
                      <Input
                          autoFocus
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={handleUpdateTodo}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateTodo(); if (e.key === 'Escape') setEditingId(null); }}
                          className="flex-1"
                      />
                  ) : (
                      <p className="flex-1">{todo.text}</p>
                  )}
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleStartEdit(todo)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleMakeTask(todo)}>
                        <Calendar className="mr-2 h-4 w-4" /> Schedule to calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleMakeProject(todo)}>
                        <Briefcase className="mr-2 h-4 w-4" /> Make a Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDeleteTodo(todo.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>Your to-do list is empty. Add a new item above to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
