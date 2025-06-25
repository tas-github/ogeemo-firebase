
"use client";

import * as React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  UploadCloud,
  Link as LinkIcon,
  FileText,
  Bot,
  User,
  Send,
  Sparkles,
  LoaderCircle,
  Pin,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Mic,
  Square
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSpeechToText } from '@/hooks/use-speech-to-text';

// Mock data for sources
const mockSources = [
  { id: 'src-1', type: 'pdf', title: 'Q3_Market_Analysis.pdf', summary: 'Analysis of market trends and competitor performance for the third quarter.' },
  { id: 'src-2', type: 'web', title: 'TechCrunch Article on Ogeemo Startups', url: 'https://techcrunch.com/2024/01/01/ai-startups-2024/', summary: 'An overview of the most promising Ogeemo startups to watch this year.' },
  { id: 'src-3', type: 'pdf', title: 'Project_Phoenix_Brief.pdf', summary: 'Initial project brief outlining goals, scope, and key deliverables for Project Phoenix.' },
];

// Mock data for Ogeemo Chat
const initialChatMessages = [
  { sender: 'ogeemo', text: 'Hi! I am your Ogeemo research assistant. Ask me anything about your sources, or select one to get a summary.' },
];

type ChatMessage = {
  sender: 'user' | 'ogeemo';
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
  const chatInputRef = React.useRef<HTMLInputElement>(null);

  // Notepad Speech-to-Text
  const [notepadContentBeforeSpeech, setNotepadContentBeforeSpeech] = React.useState('');
  const {
    isListening: isNotepadListening,
    startListening: startNotepadListening,
    stopListening: stopNotepadListening,
    isSupported: isSttSupported,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      if (editorRef.current) {
        const newText = notepadContentBeforeSpeech ? `${notepadContentBeforeSpeech} ${transcript}` : transcript;
        editorRef.current.innerHTML = newText;
        
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    },
  });

  const handleNotepadMicClick = () => {
    if (isNotepadListening) {
      stopNotepadListening();
    } else {
      if (editorRef.current) {
        setNotepadContentBeforeSpeech(editorRef.current.innerHTML);
        editorRef.current.focus();
        startNotepadListening();
      }
    }
  };

  // Assistant Speech-to-Text
  const [assistantInputBeforeSpeech, setAssistantInputBeforeSpeech] = React.useState('');
  const {
    isListening: isAssistantListening,
    startListening: startAssistantListening,
    stopListening: stopAssistantListening,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      const newText = assistantInputBeforeSpeech ? `${assistantInputBeforeSpeech} ${transcript}` : transcript;
      setUserInput(newText);
    },
  });

  const handleAssistantMicClick = () => {
    if (isAssistantListening) {
      stopAssistantListening();
    } else {
      setAssistantInputBeforeSpeech(userInput);
      chatInputRef.current?.focus();
      startAssistantListening();
    }
  };

  const selectedSource = sources.find(s => s.id === selectedSourceId);
  
  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };
  
  const preventDefault = (e: React.MouseEvent) => e.preventDefault();

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    const source = sources.find(s => s.id === sourceId);
    if (source) {
      setChatMessages(prev => [...prev, {
        sender: 'ogeemo',
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
      let ogeemoResponse: React.ReactNode = "I'm not sure how to answer that. Try asking something about your selected sources.";
      if (selectedSource) {
        ogeemoResponse = (
          <div>
            <p>Based on "{selectedSource.title}", here are some key points regarding "{userInput}":</p>
            <ul className="list-disc pl-5 my-2 space-y-1">
              <li>Ogeemo-driven platforms are transforming market analysis by providing deeper insights.</li>
              <li>Competitor A has increased market share by 5% this quarter.</li>
              <li>There is a growing demand for personalized user experiences.</li>
            </ul>
          </div>
        );
      }
      setChatMessages(prev => [...prev, { sender: 'ogeemo', text: ogeemoResponse }]);
      setIsLoading(false);
    }, 1500);

    setUserInput('');
  };

  const handleAddToNotepad = (content: React.ReactNode) => {
    if (editorRef.current) {
        const quoteContent = typeof content === 'string' ? content : (content as React.ReactElement).props.children[1]?.props.children || '';
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
          <div className="h-full flex flex-col border-r">
            <div className="p-4 border-b">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span>Sources ({sources.length})</span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        <DropdownMenuItem onSelect={() => toast({title: "Coming soon!"})}>
                            <UploadCloud className="mr-2 h-4 w-4" /> Upload File
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toast({title: "Coming soon!"})}>
                            <LinkIcon className="mr-2 h-4 w-4" /> Add Web Link
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 pt-2 space-y-2">
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
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="h-full flex flex-col bg-muted/30">
            <div className="p-2 border-b bg-background flex items-center gap-1 flex-wrap">
                <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Dictate Notes" onMouseDown={preventDefault} onClick={handleNotepadMicClick} disabled={!isSttSupported} className={cn(isNotepadListening && "text-destructive")}>
                    {isNotepadListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
            </div>
            <ScrollArea className="flex-1 bg-background">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                          <span className="flex items-center gap-2 font-semibold"><Sparkles className="h-5 w-5 text-primary"/> Ogeemo Assistant</span>
                          <ChevronDown className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                      <DropdownMenuItem onSelect={() => {setChatMessages(initialChatMessages); toast({title: "Chat Cleared"})}}>Clear Chat</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toast({title: "Coming soon!"})}>Export Chat</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                    <div key={index} className={cn("flex items-start gap-3", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                        {msg.sender === 'ogeemo' && <Avatar className="h-8 w-8"><AvatarFallback><Bot/></AvatarFallback></Avatar>}
                        <div className={cn(
                            "max-w-md rounded-lg px-4 py-2 text-sm relative group",
                             msg.sender === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                            <div className="prose prose-sm dark:prose-invert max-w-none">{msg.text}</div>
                            {msg.sender === 'ogeemo' && (
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
                  ref={chatInputRef}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  disabled={isLoading}
                />
                <Button type="button" variant="ghost" size="icon" onClick={handleAssistantMicClick} disabled={!isSttSupported || isLoading} className={cn(isAssistantListening && "text-destructive")}>
                  {isAssistantListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button type="submit" size="icon" disabled={isLoading || !userInput.trim()}>
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
