
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Inbox,
  Star,
  Send as SendIcon,
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
import { useSpeechToText, type SpeechRecognitionStatus } from "@/hooks/use-speech-to-text";
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
  const [spotlightResponse, setSpotlightResponse] = useState("");
  const [isSpotlightLoading, setIsSpotlightLoading] = useState(false);
  const [shouldProcessSpotlight, setShouldProcessSpotlight] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);
  const chatBaseTextRef = useRef("");
  const [shouldSubmitOnMicStop, setShouldSubmitOnMicStop] = useState(false);

  const {
    status: spotlightStatus,
    startListening: startSpotlightListening,
    stopListening: stopSpotlightListening,
    isSupported: isSpotlightSupported,
  } = useSpeechToText({
    onTranscript: (text) => {
      setTranscript(text);
    },
  });

  const {
    status: chatStatus,
    startListening: startChatListening,
    stopListening: stopChatListening,
    isSupported: isChatSupported,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      const newText = chatBaseTextRef.current
        ? `${chatBaseTextRef.current} ${transcript}`
        : transcript;
      setChatInput(newText);
    },
  });

  useEffect(() => {
    if (isSpotlightSupported === false || isChatSupported === false) {
      toast({
        variant: "destructive",
        title: "Voice Input Not Supported",
        description: "Your browser does not support the Web Speech API.",
      });
    }
  }, [isSpotlightSupported, isChatSupported, toast]);

  useEffect(() => {
    if (chatScrollAreaRef.current) {
      chatScrollAreaRef.current.scrollTo({
        top: chatScrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSpotlightMicClick = () => {
    if (spotlightStatus === 'listening') {
      stopSpotlightListening();
      setShouldProcessSpotlight(true);
    } else {
      setTranscript("");
      setSpotlightResponse("");
      startSpotlightListening();
    }
  };

  useEffect(() => {
    if (spotlightStatus === 'idle' && shouldProcessSpotlight && transcript.trim()) {
      const processTranscript = async () => {
        setIsSpotlightLoading(true);
        setSpotlightResponse("");
        try {
          const response = await askOgeemo({ message: transcript });
          setSpotlightResponse(response.reply);
        } catch (error) {
          console.error("Error with Spotlight Ogeemo:", error);
          setSpotlightResponse("Sorry, I encountered an error. Please try again.");
        } finally {
          setIsSpotlightLoading(false);
          setShouldProcessSpotlight(false);
        }
      };
      processTranscript();
    }
  }, [spotlightStatus, shouldProcessSpotlight, transcript]);

  const handleComposeClick = () => {
    router.push('/ogeemail/compose');
  };

  const submitChatMessage = useCallback(async () => {
    const currentInput = chatInput.trim();
    if (!currentInput || isChatLoading) return;

    if (chatStatus === 'listening') {
      stopChatListening();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentInput,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

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
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, chatStatus, stopChatListening]);

  useEffect(() => {
    if (chatStatus === 'idle' && shouldSubmitOnMicStop) {
      submitChatMessage();
      setShouldSubmitOnMicStop(false);
    }
  }, [chatStatus, shouldSubmitOnMicStop, submitChatMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    submitChatMessage();
  };

  const handleChatMicClick = () => {
    if (chatStatus === 'listening') {
      stopChatListening();
      setShouldSubmitOnMicStop(true);
    } else {
      chatBaseTextRef.current = chatInput.trim();
      startChatListening();
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
     if (isChatSupported === false) return "Voice input not supported";
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
      icon: SendIcon,
      label: "Sent",
      action: () => console.log("Navigate to Sent"),
    },
    {
      icon: Archive,
      label: "Archive",
      action: () => console.log("Navigate to Archive"),
    },
  ];

  const renderSpotlightMicIcon = (status: SpeechRecognitionStatus) => {
    switch (status) {
      case 'listening': return <Square className="w-8 h-8" />;
      case 'activating': return <LoaderCircle className="w-8 h-8 animate-spin" />;
      case 'idle':
      default: return <Mic className="w-8 h-8" />;
    }
  };

  const getSpotlightMicButtonTitle = (status: SpeechRecognitionStatus) => {
    if (isSpotlightLoading) return "Processing...";
    if (isSpotlightSupported === false) return "Voice input not supported";
    switch (status) {
      case 'listening': return "Stop listening";
      case 'activating': return "Activating...";
      case 'idle':
      default: return "Start listening";
    }
  };


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

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary">Ready to Write?</CardTitle>
              <CardDescription>
                Start drafting a new message or chat with your assistant.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center gap-4">
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

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary">Quick Navigation</CardTitle>
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
        </div>

        <Card className="flex-1 flex flex-col">
          <CardHeader className="text-center">
            <CardTitle className="text-primary">Feature Spotlight</CardTitle>
            <CardDescription>Voice-Powered Ogeemo Assistant</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
            <Button
              variant={spotlightStatus === 'listening' ? "destructive" : "outline"}
              size="icon"
              className={cn(
                "h-20 w-20 rounded-full",
                spotlightStatus !== 'listening' && "bg-primary/10 text-primary",
                spotlightStatus === 'listening' && "animate-pulse"
              )}
              onClick={handleSpotlightMicClick}
              disabled={isSpotlightSupported === false || spotlightStatus === 'activating' || isSpotlightLoading}
              title={getSpotlightMicButtonTitle(spotlightStatus)}
            >
              {isSpotlightLoading ? <LoaderCircle className="w-8 h-8 animate-spin" /> : renderSpotlightMicIcon(spotlightStatus)}
            </Button>

            <div className="w-full max-w-2xl min-h-[6rem] text-center flex items-center justify-center rounded-lg bg-muted p-4">
              {isSpotlightLoading ? (
                <div className="flex items-center gap-2 text-lg">
                  <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Thinking...</p>
                </div>
              ) : transcript ? (
                 <div className="flex items-start gap-3 w-full">
                    <User className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <p className="text-lg font-medium text-left">{`"${transcript}"`}</p>
                  </div>
              ) : spotlightResponse ? (
                <div className="flex items-start gap-3 w-full">
                  <Bot className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <p className="text-lg text-left">{spotlightResponse}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Click the mic and speak, then click again when you're done.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
          <div className="flex flex-col space-y-1.5 text-center p-6 pb-4 border-b">
            <h2 className="text-2xl font-bold font-headline text-primary">Chat with Ogeemo</h2>
            <p className="text-sm text-muted-foreground">
              Ask me anything or tell me what you would like to do.
            </p>
          </div>
          <div className="flex-1 p-6 overflow-hidden">
            <ScrollArea className="h-full pr-4" ref={chatScrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
                    <p>Start the conversation...</p>
                    <p className="text-sm mt-2">In order to start and stop voice to text, click the mic icon</p>
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
                  chatStatus === 'listening' && "text-destructive"
                )}
                onClick={handleChatMicClick}
                disabled={isChatSupported === false || isChatLoading || chatStatus === 'activating'}
                title={getMicButtonTitle(chatStatus)}
              >
                {renderMicIcon(chatStatus)}
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
                <SendIcon className="h-5 w-5" />
                <span className="sr-only">Send Message</span>
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
