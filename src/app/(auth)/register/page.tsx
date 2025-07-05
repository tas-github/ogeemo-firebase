
import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Redirect to the login page as registration is handled by Google Sign-In.
  redirect('/login');
}
