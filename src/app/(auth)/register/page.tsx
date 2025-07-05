
"use client";

import Link from 'next/link';
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline font-semibold">Create an Account</CardTitle>
        <CardDescription>
            To create an account, please sign in using your Google account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
            <Link href="/login">
                Return to Login
            </Link>
        </Button>
      </CardContent>
    </>
  );
}
