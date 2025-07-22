export default function AppLayout({ children }: { children: React.ReactNode }) {
  // This is the simplest possible layout to ensure the app can render a page
  // after the user is authenticated.
  return <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>;
}
