"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, LoaderCircle, Send, User } from "lucide-react";
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
import { askSimpleChat } from "@/ai/flows/simple-chat";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
};

export default function SimpleChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askSimpleChat({ message: input });
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.reply,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling simple chat flow:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, the application encountered an error.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full items-center">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Simple Chat
        </h1>
        <p className="text-muted-foreground">
          A clean-slate chat for debugging.
        </p>
      </header>
       <Card className="w-full max-w-2xl flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Test Chat Interface</CardTitle>
            <CardDescription>
              Send a message to test the underlying AI connection.
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
          <CardFooter>
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
              <Input
                placeholder="Send a message..."
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
  );
}
