
"use client";

import React from 'react';
import { LoaderCircle } from "lucide-react";

export function ProjectPlanningView({ projectId }: { projectId: string }) {
    // This is a temporary placeholder to fix a rendering issue.
    return (
        <div className="flex h-full w-full items-center justify-center">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
}
