
import { redirect } from 'next/navigation';

export default function NotesManagerRedirectPage() {
  // This manager has been deprecated and its functionality has been
  // merged into the Document Manager for a unified experience.
  redirect('/file-manager');
}
