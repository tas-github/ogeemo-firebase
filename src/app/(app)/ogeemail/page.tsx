
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { askOgeemo } from "@/ai/flows/ogeemo-chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  id: string;
  text: string;
  sender: "user" | "ogeemo";
};

export default function OgeeMailWelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");

  // Chat Dialog State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);
  const [chatInputBeforeSpeech, setChatInputBeforeSpeech] = useState("");

  // Speech-to-text for the Feature Spotlight
  const {
    isListening: isSpotlightListening,
    startListening: startSpotlightListening,
    stopListening: stopSpotlightListening,
    isSupported: isSpotlightSupported,
  } = useSpeechToText({
    onTranscript: (text) => {
      setTranscript(text);
    },
    onFinalTranscript: () => {
      // Automatically stop listening when user pauses
      if (isSpotlightListening) {
        stopSpotlightListening();
      }
    },
  });

  // Speech-to-text for the Chat Dialog
  const {
    isListening: isChatListening,
    startListening: startChatListening,
    stopListening: stopChatListening,
    isSupported: isChatSupported,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      const newText = chatInputBeforeSpeech ? `${chatInputBeforeSpeech} ${transcript}`.trim() : transcript;
      setChatInput(newText);
    },
  });

  const handleChatMicClick = () => {
    if (isChatListening) {
      stopChatListening();
    } else {
      setChatInputBeforeSpeech(chatInput);
      startChatListening();
    }
  };

  useEffect(() => {
    if (isSpotlightSupported === false) {
      toast({
        variant: "destructive",
        title: "Voice Input Not Supported",
        description: "Your browser does not support the Web Speech API.",
      });
    }
  }, [isSpotlightSupported, toast]);

  useEffect(() => {
    if (chatScrollAreaRef.current) {
      chatScrollAreaRef.current.scrollTo({
        top: chatScrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSpotlightMicClick = () => {
    if (isSpotlightListening) {
      stopSpotlightListening();
    } else {
      setTranscript("");
      startSpotlightListening();
    }
  };

  const handleComposeClick = () => {
    router.push('/ogeemail/compose');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    if (isChatListening) {
      stopChatListening();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: chatInput,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await askOgeemo({ message: chatInput });
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
      setIsChatLoading(false);
    }
  };

  const quickNavItems = [
    {
      icon: Inbox,
      label: "Inbox",
      action: () => router.push('/ogeemail/inbox'),
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
    <>
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
                Start drafting a new message or chat with your assistant.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-16 text-lg px-8"
                onClick={handleComposeClick}
              >
                <Pencil className="mr-4 h-6 w-6" />
                Compose Email
              </Button>
              <Button
                size="lg"
                className="h-16 text-lg px-8"
                onClick={() => setIsChatOpen(true)}
              >
                <Bot className="mr-4 h-6 w-6" />
                Chat
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

            <Card>
              <CardHeader className="text-center">
                <CardTitle>Feature Spotlight</CardTitle>
                <CardDescription>Voice-Powered Ogeemo Assistant</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Button
                  variant={isSpotlightListening ? "destructive" : "outline"}
                  size="icon"
                  className={cn(
                    "h-20 w-20 rounded-full",
                    !isSpotlightListening && "bg-primary/10 text-primary",
                    isSpotlightListening && "animate-pulse"
                  )}
                  onClick={handleSpotlightMicClick}
                  disabled={isSpotlightSupported === false}
                  title={
                    isSpotlightSupported === false
                      ? "Voice input not supported"
                      : isSpotlightListening
                      ? "Stop listening"
                      : "Start listening"
                  }
                >
                  {isSpotlightSupported === undefined ? (
                    <LoaderCircle className="w-8 h-8 animate-spin" />
                  ) : isSpotlightListening ? (
                    <Square className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </Button>
                <p className="text-sm text-muted-foreground h-10 flex items-center justify-center text-center px-4">
                  {isSpotlightListening
                    ? "Listening..."
                    : transcript
                    ? `I heard: "${transcript}"`
                    : "Click the mic and speak. I'll stop when you pause."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b shrink-0 text-center">
            <DialogTitle className="text-2xl font-bold font-headline text-primary">Chat with Ogeemo</DialogTitle>
            <DialogDescription>
              Ask me anything or tell me what you would like to do.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-6 overflow-hidden">
            <ScrollArea className="h-full pr-4" ref={chatScrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Start the conversation...
                  </div>
                )}
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
                        <AvatarFallback>
                          <Bot />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-xs md:max-w-sm rounded-lg px-4 py-2 text-sm",
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
                {isChatLoading && (
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
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="p-6 pt-4 border-t shrink-0">
            <form
              onSubmit={handleSendMessage}
              className="flex w-full items-center space-x-2"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "flex-shrink-0",
                  isChatListening && "text-destructive"
                )}
                onClick={handleChatMicClick}
                disabled={!isChatSupported || isChatLoading}
                title={
                  !isChatSupported
                    ? "Voice input not supported"
                    : isChatListening
                    ? "Stop listening"
                    : "Start listening"
                }
              >
                {isChatListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                <span className="sr-only">Use Voice</span>
              </Button>
              <Input
                placeholder="Enter your message here..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isChatLoading || !chatInput.trim()}
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send Message</span>
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
