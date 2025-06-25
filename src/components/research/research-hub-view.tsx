
"use client";

import * as React from 'react';
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
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Mic,
  Square,
  ArrowLeft,
  Pencil,
  Info,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';


// Mock data for sources
const mockSources = [
  { id: 'src-1', type: 'pdf', title: 'Q3_Market_Analysis.pdf', summary: 'Analysis of market trends and competitor performance for the third quarter.' },
  { id: 'src-2', type: 'web', title: 'TechCrunch Article on AI Startups', url: 'https://techcrunch.com/2024/01/01/ai-startups-2024/', summary: 'An overview of the most promising Ogeemo startups to watch this year.' },
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

type View = 'hub' | 'sources' | 'notepad' | 'assistant';

// --- Sub-Components for each View ---

const HubView = ({ setView }: { setView: (view: View) => void }) => {
  const [infoContent, setInfoContent] = React.useState<{ title: string; details: string; } | null>(null);

  const features = [
    {
      view: 'sources' as View,
      icon: UploadCloud,
      title: 'Manage Sources',
      description: "Upload documents, add web links, and manage the knowledge base for your research.",
      cta: 'Go to Sources',
      details: "Think of the Sources manager as the brainpower behind your Ogeemo Assistant. It's where you provide the specific documents, articles, and data that you want the assistant to use for its research. By grounding the assistant in your specific information, it can provide highly relevant and accurate answers instead of generic ones."
    },
    {
      view: 'notepad' as View,
      icon: Pencil,
      title: 'My Notepad',
      description: "A space to draft notes, synthesize information, and pin key insights from your research.",
      cta: 'Open Notepad',
      details: "The Notepad is your central workspace for thinking and writing. You can draft notes, organize your thoughts, and synthesize information from your research. It's also where you can 'pin' key insights and summaries directly from the Ogeemo Assistant, creating a persistent record of your most important findings."
    },
    {
      view: 'assistant' as View,
      icon: Bot,
      title: 'Ogeemo Assistant',
      description: "Chat with your assistant to get summaries, ask questions, and generate ideas based on your sources.",
      cta: 'Start Chat',
      details: "The Ogeemo Assistant is a powerful chat interface that helps you interact with your research sources. You can ask it to summarize documents, find key points, answer specific questions about the content, and even brainstorm new ideas. The assistant's knowledge is based on the files and links you provide in the Sources manager, making it an expert on your specific topic."
    },
  ];

  const handleInfoClick = (e: React.MouseEvent, feature: (typeof features)[0]) => {
      e.stopPropagation(); // Prevent card's onClick from firing
      setInfoContent({ title: feature.title, details: feature.details });
  };

  return (
     <>
        <div className="p-4 sm:p-6 space-y-6">
            <header className="text-center">
                <h1 className="text-3xl font-bold font-headline text-primary">
                Research Hub
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                Your intelligent workspace for synthesizing information. Select a tool to get started.
                </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {features.map((feature) => (
                <Card key={feature.view} className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setView(feature.view)}>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>{feature.title}</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={(e) => handleInfoClick(e, feature)}>
                                <Info className="h-4 w-4" />
                                <span className="sr-only">More info about {feature.title}</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                        <div className="text-sm font-semibold text-primary">{feature.cta} &rarr;</div>
                    </CardFooter>
                </Card>
                ))}
            </div>
        </div>

        <Dialog open={!!infoContent} onOpenChange={(open) => !open && setInfoContent(null)}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>{infoContent?.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4 prose prose-sm dark:prose-invert max-w-none">
                <p>{infoContent?.details}</p>
            </div>
            <DialogFooter>
                <Button onClick={() => setInfoContent(null)}>Close</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
     </>
  )
};

const SourcesView = ({ setView, sources, selectedSourceId, handleSourceSelect, onSearchClick }: { setView: (view: View) => void, sources: typeof mockSources, selectedSourceId: string | null, handleSourceSelect: (id: string) => void, onSearchClick: () => void }) => (
  <div className="h-full flex flex-col p-4 sm:p-6">
    <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" onClick={() => setView('hub')}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Hub</Button>
        <h2 className="text-2xl font-bold font-headline">Sources</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
      <Button><UploadCloud className="mr-2 h-4 w-4" /> Upload File</Button>
      <Button><LinkIcon className="mr-2 h-4 w-4" /> Add Web Link</Button>
      <Button onClick={onSearchClick}><Search className="mr-2 h-4 w-4" /> Search Internet</Button>
    </div>
    <ScrollArea className="flex-1 border rounded-lg">
      <div className="p-4 space-y-2">
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
);

const NotepadView = ({ setView, editorRef, handleFormat, handleNotepadMicClick, isNotepadListening, isSttSupported }: any) => {
    const preventDefault = (e: React.MouseEvent) => e.preventDefault();
    return (
        <div className="h-full flex flex-col p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" onClick={() => setView('hub')}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Hub</Button>
                <h2 className="text-2xl font-bold font-headline">Notepad</h2>
            </div>
            <div className="p-2 border rounded-t-lg flex items-center gap-1 flex-wrap">
                <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Dictate Notes" onMouseDown={preventDefault} onClick={handleNotepadMicClick} disabled={!isSttSupported} className={cn(isNotepadListening && "text-destructive")}>
                    {isNotepadListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
            </div>
            <ScrollArea className="flex-1 border-x border-b rounded-b-lg">
              <div
                ref={editorRef}
                contentEditable
                className="prose dark:prose-invert max-w-none p-6 focus:outline-none h-full"
                placeholder="Start writing your notes here..."
              />
            </ScrollArea>
        </div>
    );
};

const AssistantView = ({ setView, chatMessages, handleAddToNotepad, isLoading, userInput, setUserInput, handleSendMessage, handleAssistantMicClick, isAssistantListening, isSttSupported, chatInputRef }: any) => (
    <div className="h-full flex flex-col p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => setView('hub')}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Hub</Button>
            <h2 className="text-2xl font-bold font-headline">Ogeemo Assistant</h2>
        </div>
        <Card className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                {chatMessages.map((msg: any, index: number) => (
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
                  onChange={(e: any) => setUserInput(e.target.value)}
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
        </Card>
    </div>
);


// --- Main Component ---

export function ResearchHubView() {
  const [view, setView] = React.useState<View>('hub');
  const [sources, setSources] = React.useState(mockSources);
  const [selectedSourceId, setSelectedSourceId] = React.useState<string | null>(null);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(initialChatMessages);
  const [userInput, setUserInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const editorRef = React.useRef<HTMLDivElement>(null);
  const chatInputRef = React.useRef<HTMLInputElement>(null);

  const [isSearchDialogOpen, setIsSearchDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);

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
    if (isNotepadListening) stopNotepadListening();
    else {
      if (editorRef.current) {
        setNotepadContentBeforeSpeech(editorRef.current.innerHTML);
        editorRef.current.focus();
        startNotepadListening();
      }
    }
  };

  const [assistantInputBeforeSpeech, setAssistantInputBeforeSpeech] = React.useState('');
  const {
    isListening: isAssistantListening,
    startListening: startAssistantListening,
    stopListening: stopAssistantListening,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      setUserInput(assistantInputBeforeSpeech ? `${assistantInputBeforeSpeech} ${transcript}` : transcript);
    },
  });

  const handleAssistantMicClick = () => {
    if (isAssistantListening) stopAssistantListening();
    else {
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

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    const source = sources.find(s => s.id === sourceId);
    if (source) {
      toast({ title: `Selected: ${source.title}`, description: 'You can now ask the assistant questions about this source.' });
      setView('assistant');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'user', text: userInput }]);
    setIsLoading(true);

    setTimeout(() => {
      let ogeemoResponse: React.ReactNode = "I'm not sure how to answer that. Try selecting a source first.";
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

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      const newSource = {
        id: `src-${Date.now()}`,
        type: 'web' as const,
        title: `Web Search: "${searchQuery}"`,
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        summary: `A summary of search results for "${searchQuery}".`,
      };
      setSources(prev => [...prev, newSource]);
      setIsSearching(false);
      setIsSearchDialogOpen(false);
      setSearchQuery("");
      toast({
        title: "Source Added",
        description: "The top search result has been added to your sources.",
      });
      handleSourceSelect(newSource.id);
    }, 2000);
  };


  const handleAddToNotepad = (content: React.ReactNode) => {
    if (editorRef.current) {
        const quoteContent = typeof content === 'string' ? content : (content as React.ReactElement).props.children[1]?.props.children || '';
        const separator = editorRef.current.innerHTML.trim() ? '<hr class="my-4">' : '';
        editorRef.current.innerHTML += `${separator}<blockquote>${quoteContent}</blockquote><p><br></p>`;
        toast({ title: "Added to Notepad", description: "The content has been pinned to your notes." });
        setView('notepad');
    }
  };

  const renderView = () => {
    switch(view) {
        case 'sources':
            return <SourcesView setView={setView} sources={sources} selectedSourceId={selectedSourceId} handleSourceSelect={handleSourceSelect} onSearchClick={() => setIsSearchDialogOpen(true)} />;
        case 'notepad':
            return <NotepadView setView={setView} editorRef={editorRef} handleFormat={handleFormat} handleNotepadMicClick={handleNotepadMicClick} isNotepadListening={isNotepadListening} isSttSupported={isSttSupported} />;
        case 'assistant':
            return <AssistantView setView={setView} chatMessages={chatMessages} handleAddToNotepad={handleAddToNotepad} isLoading={isLoading} userInput={userInput} setUserInput={setUserInput} handleSendMessage={handleSendMessage} handleAssistantMicClick={handleAssistantMicClick} isAssistantListening={isAssistantListening} isSttSupported={isSttSupported} chatInputRef={chatInputRef} />;
        case 'hub':
        default:
            return <HubView setView={setView} />;
    }
  }

  return (
    <div className="h-full">
        {renderView()}

        <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Search the Internet</DialogTitle>
                    <DialogDescription>
                        Enter a query to find relevant articles and information. The top result will be added as a source.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="search-query">Search Query</Label>
                    <Input
                        id="search-query"
                        placeholder="e.g., Best suppliers of roofing products in North America"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isSearching}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsSearchDialogOpen(false)} disabled={isSearching}>Cancel</Button>
                    <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                        {isSearching ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
