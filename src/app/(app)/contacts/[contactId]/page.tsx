
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';

const ClientAccountSkeleton = () => (
    <div className="p-4 sm:p-6 space-y-6">
        <header className="flex justify-between items-start">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    </div>
);


const ClientAccountView = dynamic(
  () => import('@/components/contacts/client-account-view').then((mod) => mod.ClientAccountView),
  {
    ssr: false,
    loading: () => <ClientAccountSkeleton />,
  }
);

export default function ClientAccountPage() {
    const params = useParams();
    const contactId = Array.isArray(params.contactId) ? params.contactId[0] : params.contactId;
    
    if (!contactId) {
        return <ClientAccountSkeleton />;
    }

    return <ClientAccountView contactId={contactId} />;
}
