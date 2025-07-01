"use client";

import { useEffect, type ReactNode } from "react";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log("AUTH_LAYOUT: Loaded. Checking for redirect result here as a fallback...");
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.error("AUTH_LAYOUT: UNEXPECTED REDIRECT RESULT! The redirect should have gone to /auth/callback, but was caught here instead. This indicates a configuration problem.", result);
      } else {
        console.log("AUTH_LAYOUT: No redirect result found, as expected.");
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
