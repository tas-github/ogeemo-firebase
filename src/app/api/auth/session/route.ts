
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    console.log('Session API POST request received.');
    try {
        const body = await req.json();
        const idToken = body.idToken;

        if (!idToken) {
            console.log('Session API error: ID token is required.');
            return new NextResponse(JSON.stringify({ error: 'ID token is required.' }), { status: 400 });
        }
        
        // Set session expiration to 5 days.
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        console.log('Session cookie created successfully.');
        
        const options = {
            name: 'session',
            value: sessionCookie,
            maxAge: expiresIn / 1000, // maxAge is in seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax' as const,
        };

        const response = new NextResponse(JSON.stringify({ status: 'success' }), { status: 200 });
        response.cookies.set(options);
        
        return response;

    } catch (error: any) {
        console.error('Error creating session cookie:', error);
        return new NextResponse(JSON.stringify({ error: 'Unauthorized', details: error.message }), { status: 401 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const options = {
            name: 'session',
            value: '',
            maxAge: -1,
            path: '/',
        };
        const response = new NextResponse(JSON.stringify({ status: 'success' }), { status: 200 });
        response.cookies.set(options);
        return response;
    } catch (error: any) {
         console.error('Error deleting session cookie:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500 });
    }
}
