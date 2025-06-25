"use client";

import * as React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  UploadCloud,
  Link as LinkIcon,
  FileText,
  Plus,
  Bot,
  User,
  Send,
  Sparkles,
  LoaderCircle,
  Pin,
  MessageSquareQuote,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock data for sources
const mockSources = [
  { id: 'src-1', type: 'pdf', title: 'Q3_Market_Analysis.pdf', summary: 'Analysis of market trends and competitor performance for the third quarter.' },
  { id: 'src-2', type: 'web', title: 'TechCrunch Article on AI Startups', url: 'https://techcrunch.com/2024/01/01/ai-startups-2024/', summary: 'An overview of the most promising AI startups to watch this year.' },
  { id: 'src-3', type: 'pdf', title: 'Project_Phoenix_Brief.pdf', summary: 'Initial project brief outlining goals, scope, and key deliverables for Project Phoenix.' },
];

// Mock data for AI Chat
const initialChatMessages = [
  { sender: 'ai', text: 'Hi! I am your AI research assistant. Ask me anything about your sources, or select one to get a summary.' },
];

type ChatMessage = {
  sender: 'user' | 'ai';
  text: React.ReactNode;
};

export function ResearchHubView() {
  const [sources, setSources] = React.useState(mockSources);
  const [selectedSourceId, setSelectedSourceId] = React.useState<string | null>(null);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(initialChatMessages);
  const [userInput, setUserInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const editorRef = React.useRef<HTMLDivElement>(null);

  const selectedSource = sources.find(s => s.id === selectedSourceId);

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    const source = sources.find(s => s.id === sourceId);
    if (source) {
      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: (
          <div>
            <p className="font-bold">Summary of "{source.title}":</p>
            <p>{source.summary}</p>
          </div>
        )
      }]);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: userInput }]);
    setIsLoading(true);

    setTimeout(() => {
      let aiResponse: React.ReactNode = "I'm not sure how to answer that. Try asking something about your selected sources.";
      if (selectedSource) {
        aiResponse = (
          <div>
            <p>Based on "{selectedSource.title}", here are some key points regarding "{userInput}":</p>
            <ul className="list-disc pl-5 my-2 space-y-1">
              <li>AI-driven platforms are transforming market analysis by providing deeper insights.</li>
              <li>Competitor A has increased market share by 5% this quarter.</li>
              <li>There is a growing demand for personalized user experiences.</li>
            </ul>
          </div>
        );
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setIsLoading(false);
    }, 1500);

    setUserInput('');
  };

  const handleAddToNotepad = (content: React.ReactNode) => {
    if (editorRef.current) {
        const quoteContent = (content as React.ReactElement).props.children[1].props.children;
        const separator = editorRef.current.innerHTML.trim() ? '<hr class="my-4">' : '';
        editorRef.current.innerHTML += `${separator}<blockquote>${quoteContent}</blockquote><p><br></p>`;
        toast({ title: "Added to Notepad", description: "The content has been pinned to your notes." });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="text-center p-4 sm:p-6 border-b">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Research Hub
        </h1>
        <p className="text-muted-foreground">
          Your intelligent workspace for synthesizing information.
        </p>
      </header>
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={15}>
          <Card className="h-full flex flex-col rounded-none border-0 border-r">
            <CardHeader className="p-4">
              <CardTitle>Sources ({sources.length})</CardTitle>
              <CardDescription>Upload or link documents to analyze.</CardDescription>
            </CardHeader>
            <div className="p-4 pt-0">
               <div className="flex items-center gap-2">
                 <Button className="flex-1" size="sm">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload
                 </Button>
                 <Button className="flex-1" size="sm" variant="secondary">
                    <LinkIcon className="mr-2 h-4 w-4" /> Add Link
                 </Button>
               </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 pt-0 space-y-2">
                {sources.map(source => (
                  <div
                    key={source.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedSourceId === source.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                    )}
                    onClick={() => handleSourceSelect(source.id)}
                  >
                    <div className="flex items-start gap-3">
                      {source.type === 'pdf' ? <FileText className="h-5 w-5 mt-0.5 text-primary" /> : <LinkIcon className="h-5 w-5 mt-0.5 text-primary" />}
                      <p className="font-semibold text-sm truncate flex-1">{source.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="h-full flex flex-col bg-muted/30">
            <div className="p-4 border-b bg-background">
                <h3 className="font-semibold text-lg">My Notepad</h3>
                <p className="text-sm text-muted-foreground">A space for your thoughts and AI-generated insights.</p>
            </div>
            <ScrollArea className="flex-1">
              <div
                ref={editorRef}
                contentEditable
                className="prose dark:prose-invert max-w-none p-6 focus:outline-none h-full"
                placeholder="Start writing your notes here..."
              />
            </ScrollArea>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary"/> AI Assistant</h3>
                <p className="text-sm text-muted-foreground">Ask questions about your sources.</p>
            </div>
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                    <div key={index} className={cn("flex items-start gap-3", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                        {msg.sender === 'ai' && <Avatar className="h-8 w-8"><AvatarFallback><Bot/></AvatarFallback></Avatar>}
                        <div className={cn(
                            "max-w-md rounded-lg px-4 py-2 text-sm relative group",
                             msg.sender === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                            <div className="prose prose-sm dark:prose-invert max-w-none">{msg.text}</div>
                            {msg.sender === 'ai' && typeof msg.text !== 'string' && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleAddToNotepad(msg.text)}
                                >
                                    <Pin className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        {msg.sender === 'user' && <Avatar className="h-8 w-8"><AvatarFallback><User/></AvatarFallback></Avatar>}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                        <Avatar className="h-8 w-8"><AvatarFallback><Bot/></AvatarFallback></Avatar>
                        <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !userInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
