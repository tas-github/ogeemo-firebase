
import { ClientLayout } from "@/components/layout/client-layout";
import { AuthProvider } from "@/context/auth-context";
import { NavigationProvider } from "@/context/navigation-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NavigationProvider>
        <ClientLayout>
          {children}
        </ClientLayout>
      </NavigationProvider>
    </AuthProvider>
  );
}
