
import { ClientLayout } from "@/components/layout/client-layout";
import { AuthProvider } from "@/context/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ClientLayout>
        {children}
      </ClientLayout>
    </AuthProvider>
  );
}
