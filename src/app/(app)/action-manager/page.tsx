
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  User,
  LoaderCircle,
  Mic,
  Square,
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
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  text: string;
  sender: "user" | "ogeemo";
};

export default function ActionManagerPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [inputBeforeSpeech, setInputBeforeSpeech] = useState("");
  const { toast } = useToast();

  const {
    isListening,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      const newText = inputBeforeSpeech ? `${inputBeforeSpeech} ${transcript}`.trim() : transcript;
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

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setInputBeforeSpeech(input);
      startListening();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isListening) {
      stopListening();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askOgeemo({ message: input });
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
  };
  
  return (
    <div className="p-4 sm:p-6 flex flex-col flex-1 space-y-4 min-h-0">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Welcome to your Ogeemo Action Manager</h1>
        <p className="text-muted-foreground">
          Your intelligent assistant for navigating the Ogeemo platform.
        </p>
      </header>

      <div className="flex-1 min-h-0">
        <Card className="h-full flex flex-col">
            <CardHeader className="text-center">
                <CardTitle>Tell me what you would like to do</CardTitle>
                <CardDescription>
                Ask me anything about Ogeemo or describe what you'd like to accomplish.
                </CardDescription>
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
                      disabled={isSupported === false || isLoading}
                      title={
                        isSupported === false
                          ? "Voice input not supported"
                          : isListening
                          ? "Stop listening"
                          : "Start listening"
                      }
                    >
                      {isListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
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
      </div>
    </div>
  );
}
