
import dynamic from 'next/dynamic';
import { ContactsSkeleton } from '@/components/contacts/contacts-skeleton';
import { LoaderCircle } from 'lucide-react';

const ContactsView = dynamic(
  () => import('@/components/contacts/contacts-view').then((mod) => mod.ContactsView),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-full w-full">
        {/* The skeleton loader provides an instant structural preview. */}
        <ContactsSkeleton />
        
        {/* The modal overlay clearly indicates that content is loading. */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-2xl">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            <p className="font-semibold text-card-foreground">Loading Contacts...</p>
          </div>
        </div>
      </div>
    ),
  }
);


export default function ContactsPage() {
  return <ContactsView />;
}
