"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TransactionsView } from "@/components/sandbox/transactions-view";

export function SandboxView() {
  const [showTransactions, setShowTransactions] = useState(false);

  if (showTransactions) {
    return <TransactionsView />;
  }

  return (
    <div className="p-4 sm:p-6 flex items-center justify-center h-full">
      <Button onClick={() => setShowTransactions(true)}>Transaction Hub</Button>
    </div>
  );
}
