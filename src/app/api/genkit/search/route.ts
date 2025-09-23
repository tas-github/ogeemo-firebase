
import { NextRequest, NextResponse } from 'next/server';
import { aiSearchFlow } from '@/ai/flows/ai-search-flow';

export async function POST(req: NextRequest) {
    try {
        const { query, dataSources } = await req.json();

        if (!query || !dataSources) {
            return NextResponse.json({ error: 'Query and dataSources are required.' }, { status: 400 });
        }

        const result = await aiSearchFlow({ query, dataSources });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error in ai-search route handler:", error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
