
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, LoaderCircle, Send, User, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { askTestChat } from "@/ai/flows/test-chat";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSpeechToText, type SpeechRecognitionStatus } from "@/hooks/use-speech-to-text";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
};

export function TestChatView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const baseTextRef = useRef("");
  const [shouldSubmitOnMicStop, setShouldSubmitOnMicStop] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (inputRef.current) {
        inputRef.current.value = newText;
      }
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
    const currentInput = (inputRef.current?.value ?? input).trim();
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
    if (inputRef.current) inputRef.current.value = "";
    setIsLoading(true);

    try {
      const response = await askTestChat({ message: currentInput });
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.reply,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error with Test Chat:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, the test chat encountered an error. Please check the console.",
        sender: "bot",
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
    if(inputRef.current) setInput(inputRef.current.value);
    submitMessage();
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      if(inputRef.current) setInput(inputRef.current.value);
      setShouldSubmitOnMicStop(true);
    } else {
      baseTextRef.current = input.trim();
      startListening();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!isListening) {
      setInput(e.target.value);
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
    <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          AI Chat Test Page
        </h1>
        <p className="text-muted-foreground">
          Use this page to debug the AI chat functionality in isolation.
        </p>
      </header>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Open Test Chat</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Test Chat</DialogTitle>
            <DialogDescription>
              This is a test environment for the chat feature.
            </DialogDescription>
          </DialogHeader>
          <Card className="flex-1 flex flex-col h-full border-0 shadow-none">
            <CardContent className="flex-1 overflow-hidden p-0">
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
                      {message.sender === "bot" && (
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
            <CardFooter className="p-0 pt-4">
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
                  ref={inputRef}
                  placeholder="Enter your message here..."
                  defaultValue={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          e.preventDefault();
                          if(inputRef.current) setInput(inputRef.current.value);
                          submitMessage();
                      }
                  }}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
