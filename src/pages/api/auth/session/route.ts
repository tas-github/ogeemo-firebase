
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    console.log('Session API POST request received.');
    try {
        const { idToken } = await req.json();
        if (!idToken) {
            console.log('Session API error: ID token is required.');
            return new NextResponse(JSON.stringify({ error: 'ID token is required.' }), { status: 400 });
        }
        
        console.log('Creating session cookie...');
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        console.log('Session cookie created successfully.');
        
        const options = {
            name: 'session',
            value: sessionCookie,
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax' as const,
        };

        console.log('Setting cookie on response with options:', options);
        // Using NextResponse.json() is a cleaner way to send a JSON response.
        const response = NextResponse.json({ status: 'success' });
        response.cookies.set(options);
        
        return response;

    } catch (error: any) {
        console.error('Error creating session cookie:', error);
        return new NextResponse(JSON.stringify({ error: 'Unauthorized', details: error.message }), { status: 401 });
    }
}

export async function DELETE(req: NextRequest) {
    console.log('Session API DELETE request received.');
    try {
        const options = {
            name: 'session',
            value: '',
            maxAge: -1,
            path: '/',
        };
        console.log('Deleting cookie with options:', options)
        const response = NextResponse.json({ status: 'success' });
        response.cookies.set(options)
        return response;
    } catch (error: any) {
         console.error('Error deleting session cookie:', error);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500 });
    }
}
