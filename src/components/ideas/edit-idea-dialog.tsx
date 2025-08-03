
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Strikethrough, Link as LinkIcon, Mic, Square } from "lucide-react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/hooks/use-user-preferences";

interface Idea {
  id: number;
  title: string;
  content: string;
}

interface EditIdeaDialogProps {
  idea: Idea;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (updatedIdea: Idea) => void;
}

export default function EditIdeaDialog({ idea, isOpen, onOpenChange, onSave }: EditIdeaDialogProps) {
  const [title, setTitle] = useState(idea.title);
  const [content, setContent] = useState(idea.content);
  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [contentBeforeSpeech, setContentBeforeSpeech] = useState('');
  const { preferences } = useUserPreferences();

  const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
    onTranscript: (transcript) => {
        if (editorRef.current) {
            const newText = contentBeforeSpeech ? `${contentBeforeSpeech} ${transcript}`.trim() : transcript;
            editorRef.current.innerHTML = newText;
            setContent(newText);
            const range = document.createRange();
            const sel = window.getSelection();
            if (sel) {
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
  });

  useEffect(() => {
    if (isOpen) {
        setTitle(idea.title);
        setContent(idea.content);
        if (editorRef.current) {
            editorRef.current.innerHTML = idea.content || "";
        }
    }
  }, [idea, isOpen]);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setContent(editorRef.current?.innerHTML || '');
  };

  const handleSaveClick = () => {
    onSave({ ...idea, title, content });
    onOpenChange(false);
  };
  
  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isListening) {
      setContent(e.currentTarget.innerHTML);
    }
  };
  
  const preventDefault = (e: React.MouseEvent) => e.preventDefault();
  
  const handleDictateNotes = () => {
    if (isListening) {
      stopListening();
    } else {
      setContentBeforeSpeech(content);
      editorRef.current?.focus();
      startListening();
    }
  };

  const handleCreateProject = () => {
    try {
      sessionStorage.setItem('ogeemo-idea-to-project', JSON.stringify({ title, description: content }));
      onOpenChange(false);
      router.push('/projects');
    } catch (error) {
      console.error("Failed to save idea to session storage", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle>Develop Idea</DialogTitle>
          <DialogDescription>
            Flesh out your idea with more details and formatting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 space-y-2">
            <Label htmlFor="idea-title">Title</Label>
            <Input id="idea-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          
          <div className="p-2 border-y flex items-center gap-1 flex-wrap">
              <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" title="Strikethrough" onMouseDown={preventDefault} onClick={() => handleFormat('strikeThrough')}><Strikethrough className="h-4 w-4" /></Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" title="Blockquote" onMouseDown={preventDefault} onClick={() => handleFormat('formatBlock', 'blockquote')}><Quote className="h-4 w-4" /></Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon" title="Insert Link" onMouseDown={preventDefault} onClick={() => { const url = prompt('Enter a URL:'); if (url) handleFormat('createLink', url); }}><LinkIcon className="h-4 w-4" /></Button>
              {preferences?.showDictationButton && (
                <>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button variant="ghost" size="icon" title={isListening ? "Stop dictation" : "Dictate notes"} onMouseDown={preventDefault} onClick={handleDictateNotes} disabled={isSupported === false} className={cn(isListening && "text-destructive")}>
                      {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </>
              )}
          </div>

          <ScrollArea className="flex-1">
            <div
              ref={editorRef}
              className="prose dark:prose-invert max-w-none p-6 focus:outline-none h-full min-h-[300px]"
              contentEditable={true}
              onInput={handleEditorInput}
              placeholder="Start developing your idea here..."
            />
          </ScrollArea>
        </div>

        <DialogFooter className="p-4 border-t flex-col sm:flex-row sm:justify-between items-center gap-2">
          <Button onClick={handleCreateProject} className="bg-orange-500 hover:bg-orange-600 text-white">
            Make it a project
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveClick}>Save Idea</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
