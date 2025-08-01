// src/app/api/genkit/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ogeemoChatFlow } from '@/ai/flows/ogeemo-chat';
import { MessageData } from 'genkit';

export async function POST(req: NextRequest) {
    try {
        const { message, history } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
        }

        const genkitHistory = (history || []).map((msg: { sender: 'user' | 'ogeemo', text: string }) => new MessageData({
            role: msg.sender === 'user' ? 'user' : 'model',
            content: [{ text: msg.text }]
        }));

        const result = await ogeemoChatFlow({
            message,
            history: genkitHistory,
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error in chat route handler:", error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
