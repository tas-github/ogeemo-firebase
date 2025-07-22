// The marketing site's home page is now at /home
// This middleware will redirect the root path to the /login page for the app
// For development, you can navigate directly to /home to see the new website.
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/home');
}
