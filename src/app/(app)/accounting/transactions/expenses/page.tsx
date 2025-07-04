
import dynamic from 'next/dynamic';
import { LoaderCircle } from 'lucide-react';

const ExpenseView = dynamic(
  () => import('@/components/accounting/expense-view').then((mod) => mod.ExpenseView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Expense Manager...</p>
        </div>
      </div>
    ),
  }
);

export default function ExpensePage() {
  return <ExpenseView />;
}
