
// src/app/api/genkit/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ogeemoChatFlow } from '@/ai/flows/ogeemo-chat';
import { experimentalChatFlow } from '@/ai/flows/experimental-chat-flow';

// Define the expected message structure from the client
interface ClientMessage {
  role: 'user' | 'model' | 'tool';
  content: any[];
}

export async function POST(req: NextRequest) {
    try {
        const { message, history, experimental } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
        }

        const typedHistory: ClientMessage[] = history || [];

        let result;
        if (experimental) {
            result = await experimentalChatFlow({
                message,
                history: typedHistory,
            });
        } else {
            result = await ogeemoChatFlow({
                message,
                history: typedHistory.filter(m => m.role !== 'tool') as any, // Ogeemo chat doesn't handle tool messages
            });
        }
        

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error in chat route handler:", error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
