'use client';

// This file is obsolete and its contents have been removed.
// The print functionality has been simplified and now uses standard browser APIs
// controlled directly from the /accounting/invoices/preview/page.tsx component.
// It is now safe to delete this file.
export function useReactToPrint() {
    return { handlePrint: () => {}, contentRef: { current: null } };
}
