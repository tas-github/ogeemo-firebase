import { redirect } from 'next/navigation';

export default function ClientBillingRedirectPage() {
  // This page now lives at /client-manager/report.
  // This redirect ensures backward compatibility.
  redirect('/client-manager/report');
}
