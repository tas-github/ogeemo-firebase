
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bot, Send, User, LoaderCircle, Mic, Square, Wand2 } from "lucide-react";
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
import { useAuth } from "@/context/auth-context";

type Message = {
  id: string;
  text: string;
  sender: "user" | "ogeemo";
};

export function ActionManagerCard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const baseTextRef = useRef("");
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    status,
    isListening,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      const newText = baseTextRef.current ? `${baseTextRef.current} ${transcript}` : transcript;
      setInput(newText);
    },
  });

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

    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Logged In",
            description: "You must be logged in to chat with the assistant."
        });
        return;
    }

    if (isListening) stopListening();

    const userMessage: Message = { id: Date.now().toString(), text: currentInput, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askOgeemo({ message: currentInput, userId: user.uid });
      const ogeemoMessage: Message = { id: (Date.now() + 1).toString(), text: response.reply, sender: "ogeemo" };
      setMessages((prev) => [...prev, ogeemoMessage]);
    } catch (error) {
      console.error("Error with Ogeemo:", error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), text: "Sorry, I encountered an error.", sender: "ogeemo" };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isListening, stopListening, user, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      baseTextRef.current = input.trim();
      startListening();
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-10rem)] min-h-[500px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary"/>
            Ogeemo Action Manager
        </CardTitle>
        <CardDescription>
          Ask me to do anything, like "create a new contact for John Doe at john@example.com" or <Link href="/action-manager" className="underline">open the full view</Link>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex items-start gap-3", message.sender === "user" ? "justify-end" : "justify-start")}
              >
                {message.sender === "ogeemo" && (<Avatar className="h-8 w-8"><AvatarFallback><Bot /></AvatarFallback></Avatar>)}
                <div
                  className={cn("max-w-[80%] rounded-lg px-4 py-2 text-sm break-words", message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}
                >
                  {message.text}
                </div>
                {message.sender === "user" && (<Avatar className="h-8 w-8"><AvatarFallback><User /></AvatarFallback></Avatar>)}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8"><AvatarFallback><Bot /></AvatarFallback></Avatar>
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
            className={cn("flex-shrink-0", isListening && "text-destructive")}
            onClick={handleMicClick}
            disabled={isSupported === false || isLoading}
            title={isSupported === false ? "Voice not supported" : (isListening ? "Stop dictation" : "Start dictation")}
          >
            {isListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Input
            placeholder="Tell me what to do..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitMessage(); } }}
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
