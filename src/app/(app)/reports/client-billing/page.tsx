
import { LoggedEntriesView } from '@/components/client-manager/logged-entries-view';

export default function ClientBillingReportPage() {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full space-y-6">
        <LoggedEntriesView />
    </div>
  );
}
