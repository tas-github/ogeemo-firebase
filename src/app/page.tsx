
import { redirect } from 'next/navigation';

export default function Home() {
  // The marketing site's home page is at /home
  // This page will now redirect to the /login page by default.
  // The AuthProvider will then handle routing to the dashboard if logged in.
  redirect('/home');
}
