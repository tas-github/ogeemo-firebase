
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Inbox,
  Star,
  Send,
  Archive,
  Pencil,
  Mic,
  LoaderCircle,
  Bot,
  User,
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
import { useRouter } from "next/navigation";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { askOgeemo } from "@/ai/flows/ogeemo-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ChatMessage = {
  sender: "user" | "ogeemo";
  text: string;
};

export default function OgeeMailWelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendVoiceMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    if (isListening) {
      stopListening();
    }

    setIsLoading(true);
    setChatHistory((prev) => [...prev, { sender: "user", text: message }]);
    setTranscript("");

    try {
      const response = await askOgeemo({ message });
      setChatHistory((prev) => [
        ...prev,
        { sender: "ogeemo", text: response.reply },
      ]);
    } catch (error) {
      console.error("Error with Ogeemo:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "ogeemo",
          text: "Sorry, I had trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const { isListening, startListening, stopListening, isSupported } =
    useSpeechToText({
      onTranscript: (text) => {
        setTranscript(text);
      },
      onFinalTranscript: (text) => {
        handleSendVoiceMessage(text);
      },
    });

  useEffect(() => {
    // This check is necessary because the initial value is undefined.
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
  }, [chatHistory, transcript, isLoading]);

  const handleComposeClick = () => {
    console.log("Compose button clicked. Feature coming soon!");
  };

  const quickNavItems = [
    {
      icon: Inbox,
      label: "Inbox",
      action: () => console.log("Navigate to Inbox"),
    },
    {
      icon: Star,
      label: "Starred",
      action: () => console.log("Navigate to Starred"),
    },
    {
      icon: Send,
      label: "Sent",
      action: () => console.log("Navigate to Sent"),
    },
    {
      icon: Archive,
      label: "Archive",
      action: () => console.log("Navigate to Archive"),
    },
  ];

  return (
    <div className="p-4 sm:p-6 flex flex-col flex-1 space-y-6 min-h-0">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Welcome to OgeeMail
        </h1>
        <p className="text-muted-foreground">
          Your intelligent, streamlined, and voice-powered email experience.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6 items-start flex-1">
        {/* Primary Action Card */}
        <Card className="flex flex-col h-full">
          <CardHeader className="text-center">
            <CardTitle>Ready to Write?</CardTitle>
            <CardDescription>
              Start drafting a new message with our powerful compose tool.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <Button
              size="lg"
              className="h-16 text-lg px-8"
              onClick={handleComposeClick}
            >
              <Pencil className="mr-4 h-6 w-6" />
              Compose Email
            </Button>
          </CardContent>
          <CardFooter className="text-center text-sm text-muted-foreground justify-center">
            <p>Click here to begin your next conversation.</p>
          </CardFooter>
        </Card>

        {/* Quick Navigation & Feature Spotlight */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Quick Navigation</CardTitle>
              <CardDescription>Jump to any folder instantly.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickNavItems.map((item) => (
                <Button
                  key={item.label}
                  variant="outline"
                  className="flex flex-col h-20 gap-2"
                  onClick={item.action}
                >
                  <item.icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="text-center">
              <CardTitle>Chat with Ogeemo</CardTitle>
              <CardDescription>Voice-Powered AI Assistant</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-20 w-20 rounded-full bg-primary/10 text-primary",
                  isListening && "animate-pulse border-destructive text-destructive"
                )}
                onClick={isListening ? stopListening : startListening}
                disabled={isSupported === false || isLoading}
                title={
                  isSupported === false
                    ? "Voice input not supported"
                    : isListening
                    ? "Stop listening"
                    : "Start chatting"
                }
              >
                {isSupported === undefined ? (
                  <LoaderCircle className="w-8 h-8 animate-spin" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Click the microphone and ask Ogeemo a question. Experience a
                hands-free, voice-powered AI conversation.
              </p>
              <ScrollArea className="h-48 w-full pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-start gap-3",
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      {message.sender === "ogeemo" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <Bot />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-xs rounded-lg px-4 py-2 text-sm",
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {message.text}
                      </div>
                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isListening && (
                    <div className="flex items-start gap-3 justify-end">
                      <div className="max-w-xs rounded-lg px-4 py-2 text-sm bg-primary text-primary-foreground italic">
                        {transcript || "Listening..."}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <Bot />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  {chatHistory.length === 0 &&
                    !isListening &&
                    !isLoading && (
                      <div className="text-center text-sm text-muted-foreground pt-4">
                        Click the mic to start.
                      </div>
                    )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
