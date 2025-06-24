import { ClientLayout } from "@/components/layout/client-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}
