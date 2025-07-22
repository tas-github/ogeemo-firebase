
"use client";

import React from 'react';
import { LoaderCircle } from "lucide-react";

// This component is temporarily disabled to resolve a rendering issue.
export function ProjectStepsView() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
}
