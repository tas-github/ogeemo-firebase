
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

// This is needed because the SpeechRecognition API is still vendor-prefixed in some browsers
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}


type UseSpeechToTextOptions = {
  onTranscript: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
};

export type SpeechRecognitionStatus = 'idle' | 'activating' | 'listening';

export function useSpeechToText({ onTranscript, onFinalTranscript }: UseSpeechToTextOptions) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle');
  const [isSupported, setIsSupported] = useState<boolean | undefined>(undefined);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      console.warn("Speech recognition not supported by this browser.");
    }
  }, []);

  const startListening = useCallback(() => {
    if (status !== 'idle' || !isSupported) return;

    setStatus('activating');
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setStatus('listening');
    };

    recognition.onend = () => {
      setStatus('idle');
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setStatus('idle');
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      onTranscript(transcript);
      
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal && onFinalTranscript) {
        onFinalTranscript(transcript);
      }
    };

    recognition.start();
  }, [status, isSupported, onTranscript, onFinalTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && status === 'listening') {
      recognitionRef.current.stop();
    }
  }, [status]);
  
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    status,
    startListening,
    stopListening,
    isSupported,
  };
}
