
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  User,
  LoaderCircle,
  Mic,
  Square,
  Grid,
  Blocks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { askOgeemo } from "@/ai/flows/ogeemo-chat";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSpeechToText, type SpeechRecognitionStatus } from "@/hooks/use-speech-to-text";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  text: string;
  sender: "user" | "ogeemo";
};

export function ActionManagerView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const baseTextRef = useRef("");
  const { toast } = useToast();
  const [shouldSubmitOnMicStop, setShouldSubmitOnMicStop] = useState(false);

  const {
    status,
    isListening,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      const newText = baseTextRef.current
        ? `${baseTextRef.current} ${transcript}`
        : transcript;
      setInput(newText);
    },
  });

  useEffect(() => {
    if (isSupported === false) {
      toast({
        variant: "destructive",
        title: "Voice Input Not Supported",
        description: "Your browser does not support the Web Speech API.",
      });
    }
  }, [isSupported, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const submitMessage = useCallback(async () => {
    const currentInput = input.trim();
    if (!currentInput || isLoading) return;

    if (isListening) {
      stopListening();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentInput,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askOgeemo({ message: currentInput });
      const ogeemoMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.reply,
        sender: "ogeemo",
      };
      setMessages((prev) => [...prev, ogeemoMessage]);
    } catch (error) {
      console.error("Error with Ogeemo:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ogeemo",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isListening, stopListening]);

  useEffect(() => {
    if (status === 'idle' && shouldSubmitOnMicStop) {
      submitMessage();
      setShouldSubmitOnMicStop(false);
    }
  }, [status, shouldSubmitOnMicStop, submitMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      setShouldSubmitOnMicStop(true);
    } else {
      baseTextRef.current = input.trim();
      startListening();
    }
  };
  
  const renderMicIcon = (currentStatus: SpeechRecognitionStatus) => {
    switch (currentStatus) {
      case 'listening':
        return <Square className="h-5 w-5" />;
      case 'activating':
        return <LoaderCircle className="h-5 w-5 animate-spin" />;
      case 'idle':
      default:
        return <Mic className="h-5 w-5" />;
    }
  };

  const getMicButtonTitle = (currentStatus: SpeechRecognitionStatus) => {
     if (isSupported === false) return "Voice input not supported";
     switch (currentStatus) {
        case 'listening':
            return "Stop and send message";
        case 'activating':
            return "Activating...";
        case 'idle':
        default:
            return "Start listening";
     }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Welcome to your Ogeemo Action Manager</h1>
        <p className="text-muted-foreground">
          Your intelligent assistant for navigating the Ogeemo platform.
        </p>
      </header>

      <Card className="h-[65vh] flex flex-col">
          <CardHeader className="text-center">
              <CardTitle>Tell me what you would like to do</CardTitle>
              <CardDescription>
              Ask me anything about Ogeemo or describe what you'd like to accomplish.
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                In order to start and stop voice to text, click the mic icon.
              </p>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
             <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                      {messages.map((message) => (
                          <div
                          key={message.id}
                          className={cn(
                              "flex items-start gap-3",
                              message.sender === "user" ? "justify-end" : "justify-start"
                          )}
                          >
                          {message.sender === "ogeemo" && (
                              <Avatar className="h-8 w-8">
                              <AvatarFallback><Bot /></AvatarFallback>
                              </Avatar>
                          )}
                          <div
                              className={cn(
                              "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 text-sm",
                              message.sender === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                          >
                              {message.text}
                          </div>
                          {message.sender === "user" && (
                              <Avatar className="h-8 w-8">
                              <AvatarFallback><User /></AvatarFallback>
                              </Avatar>
                          )}
                          </div>
                      ))}
                      {isLoading && (
                          <div className="flex items-start gap-3 justify-start">
                          <Avatar className="h-8 w-8">
                              <AvatarFallback><Bot /></AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center">
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                          </div>
                          </div>
                      )}
                  </div>
              </ScrollArea>
          </CardContent>
          <CardFooter>
              <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "flex-shrink-0",
                      isListening && "text-destructive"
                    )}
                    onClick={handleMicClick}
                    disabled={isSupported === false || isLoading || status === 'activating'}
                    title={getMicButtonTitle(status)}
                  >
                    {renderMicIcon(status)}
                    <span className="sr-only">Use Voice</span>
                  </Button>
                  <Input
                      placeholder="Enter your message here..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isLoading}
                      autoComplete="off"
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                      <Send className="h-5 w-5" />
                      <span className="sr-only">Send Message</span>
                  </Button>
              </form>
          </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline text-primary">The Ogeemo Advantage</CardTitle>
          <CardDescription>
            Discover how Ogeemo streamlines your workflow and boosts productivity.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg"><Grid className="h-6 w-6 text-primary" /></div>
            <div>
              <h4 className="font-semibold">Unified Workspace</h4>
              <p className="text-sm text-muted-foreground">Manage projects, contacts, emails, and more from a single, intuitive interface. No more switching between apps.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg"><Bot className="h-6 w-6 text-primary" /></div>
            <div>
              <h4 className="font-semibold">AI-Powered Assistance</h4>
              <p className="text-sm text-muted-foreground">Leverage Ogeemo, your intelligent assistant, to draft emails, summarize content, and automate repetitive tasks.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg"><Blocks className="h-6 w-6 text-primary" /></div>
            <div>
              <h4 className="font-semibold">Seamless Integrations</h4>
              <p className="text-sm text-muted-foreground">Connect with the tools you already use, like Google services, to create a truly integrated workflow.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg"><Mic className="h-6 w-6 text-primary" /></div>
            <div>
              <h4 className="font-semibold">Voice Control</h4>
              <p className="text-sm text-muted-foreground">Navigate the platform, compose messages, and manage tasks using only your voice for a hands-free experience.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
