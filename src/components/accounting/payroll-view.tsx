
"use client";

import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const PayrollDashboard = dynamic(
  () => import('@/components/accounting/payroll-dashboard').then((mod) => mod.PayrollDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Payroll Manager...</p>
        </div>
      </div>
    ),
  }
);

export function PayrollView() {
  return <PayrollDashboard />;
}
