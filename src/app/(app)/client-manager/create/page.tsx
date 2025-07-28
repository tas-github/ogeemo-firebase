
import { redirect } from 'next/navigation';
import { CreateClientEntryView } from '@/components/client-manager/create-client-entry-view';

export default function CreateClientEntryPage() {
  // This page is now obsolete. The functionality has been centralized
  // into the Time Manager at /time.
  // redirect('/time');
  return <CreateClientEntryView />;
}
