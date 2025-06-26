
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bot, LoaderCircle, Send, User, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface OgeemoChatDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function OgeemoChatDialog({ isOpen, onOpenChange }: OgeemoChatDialogProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatScrollAreaRef = useRef<HTMLDivElement>(null);
    const chatBaseTextRef = useRef("");
    const [shouldSubmitOnMicStop, setShouldSubmitOnMicStop] = useState(false);
    const { toast } = useToast();
    const chatInputRef = useRef<HTMLInputElement>(null);

    const {
        status: chatStatus,
        isListening: isChatListening,
        startListening,
        stopListening,
        isSupported,
    } = useSpeechToText({
        onTranscript: (transcript) => {
            const newText = chatBaseTextRef.current
                ? `${chatBaseTextRef.current} ${transcript}`
                : transcript;
            if (chatInputRef.current) {
                chatInputRef.current.value = newText;
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
        if (chatScrollAreaRef.current) {
        chatScrollAreaRef.current.scrollTo({
            top: chatScrollAreaRef.current.scrollHeight,
            behavior: "smooth",
        });
        }
    }, [messages]);

    const submitChatMessage = useCallback(async () => {
        const currentInput = (chatInputRef.current?.value ?? chatInput).trim();
        if (!currentInput || isChatLoading) return;

        if (isChatListening) {
            stopListening();
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            text: currentInput,
            sender: "user",
        };
        setMessages((prev) => [...prev, userMessage]);
        setChatInput("");
        if (chatInputRef.current) chatInputRef.current.value = "";
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
    }, [chatInput, isChatLoading, isChatListening, stopListening]);

    useEffect(() => {
        if (chatStatus === 'idle' && shouldSubmitOnMicStop) {
        submitChatMessage();
        setShouldSubmitOnMicStop(false);
        }
    }, [chatStatus, shouldSubmitOnMicStop, submitChatMessage]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInputRef.current) setChatInput(chatInputRef.current.value);
        submitChatMessage();
    };

    const handleChatMicClick = () => {
        if (isChatListening) {
            stopListening();
            if (chatInputRef.current) setChatInput(chatInputRef.current.value);
            setShouldSubmitOnMicStop(true);
        } else {
            chatBaseTextRef.current = chatInput.trim();
            startListening();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!isChatListening) {
          setChatInput(e.target.value);
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

    const handleOpenChange = (open: boolean) => {
        if (!open && isChatListening) {
            stopListening();
        }
        onOpenChange(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
                <div className="flex flex-col space-y-1.5 text-center p-6 pb-4 border-b">
                    <DialogTitle className="text-2xl font-bold font-headline text-primary">Chat with Ogeemo</DialogTitle>
                    <DialogDescription>
                    Ask me anything or tell me what you would like to do.
                    </DialogDescription>
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
                        isChatListening && "text-destructive"
                        )}
                        onClick={handleChatMicClick}
                        disabled={isSupported === false || isChatLoading || chatStatus === 'activating'}
                        title={getMicButtonTitle(chatStatus)}
                    >
                        {renderMicIcon(chatStatus)}
                        <span className="sr-only">Use Voice</span>
                    </Button>
                    <Input
                        ref={chatInputRef}
                        placeholder="Enter your message here..."
                        defaultValue={chatInput}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if(chatInputRef.current) setChatInput(chatInputRef.current.value);
                                submitChatMessage();
                            }
                        }}
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
    );
}
