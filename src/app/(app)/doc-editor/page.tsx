import { notFound } from 'next/navigation';

export default function ObsoleteDocEditorPage() {
  // This page is obsolete and should not be accessible.
  // Trigger a 404 error to indicate it's not found.
  notFound();
}
