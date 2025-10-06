# Agent Self-Correction & Best Practices

This document summarizes key takeaways from a productive feedback session to ensure a more effective and reliable collaboration. It serves as a persistent reminder of best practices for me, the AI agent.

## Core Issues Identified

Based on user feedback, a pattern of repeated failures on straightforward tasks was identified. The root causes were diagnosed as:

1.  **Contextual Drift & Failure Loops:** After an initial failure, my conversational context became polluted with the history of that failure. This led me to incorrectly reference my own flawed previous attempts instead of returning to a clean, logical starting point.
2.  **Over-Complication of Plans:** In an attempt to be thorough, I proposed overly complex, multi-step plans that were difficult to execute perfectly in a single turn, leading to partial, broken states.
3.  **Deviation from Approved Plans:** A critical breakdown where my code generation process drifted from the approved plan, sometimes falling back on patterns from a previous flawed attempt.

## My Commitment to a Better Workflow

To address these issues and restore a productive development cycle, I am committed to the following principles:

1.  **Prioritize Aggressive Rollbacks:** When a feature implementation fails, my default response will be to propose a **complete rollback** to the last known good state. This prevents getting stuck in a failure loop and ensures we always work from a stable base.

2.  **Propose Simpler, More Focused Plans:** I will create smaller, more atomic plans that are easier to execute and verify. This means focusing on one discrete piece of functionality at a time (e.g., "Restore the UI component" or "Implement the save function") rather than attempting to build an entire feature in one go.

3.  **Maintain Strict Plan Adherence:** The approved plan is the absolute source of truth. The code I generate will be a direct and precise execution of that plan. I will be more vigilant in my internal self-correction to prevent any deviation from our agreed-upon strategy.

## NEW - Critical Rule: Dynamic Imports

**DO NOT create separate server-side skeleton components for dynamically imported client components.** This pattern has repeatedly caused hydration errors and a "flash of content".

**INSTEAD**, when using `dynamic()` with `ssr: false`, define the loading state directly and inline within the page file using a simple JSX element.

**Correct Example:**
```tsx
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const ClientComponent = dynamic(
  () => import('@/components/some-client-component'),
  {
    ssr: false,
    loading: () => <div className="flex justify-center p-4"><LoaderCircle className="animate-spin" /></div>,
  }
);

export default function Page() {
  return <ClientComponent />;
}
```

**Incorrect (Forbidden) Example:**
```tsx
// in /app/some-page/page.tsx
import dynamic from 'next/dynamic';
import { SomeClientComponentSkeleton } from './some-client-component-skeleton'; // FORBIDDEN

const ClientComponent = dynamic(
  () => import('@/components/some-client-component'),
  {
    ssr: false,
    loading: () => <SomeClientComponentSkeleton />, // FORBIDDEN
  }
);

export default function Page() {
  return <ClientComponent />;
}
```

Adherence to this rule is mandatory to prevent regressions.