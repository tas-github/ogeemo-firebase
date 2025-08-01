
import {
  Mail,
  Briefcase,
  ListTodo,
  Calendar,
  FileDigit,
  Clock,
  Wand2,
  Contact,
  Beaker,
  Calculator,
  Folder,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ActionChipData {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  frame: 'quick' | 'more';
}

// This now represents the DEFAULT state for "Your Actions".
export const initialChips: ActionChipData[] = [
  { id: 'chip-1', label: 'Open Email', icon: Mail, href: '/ogeemail', frame: 'quick' },
  { id: 'chip-2', label: 'Open Contacts', icon: Contact, href: '/contacts', frame: 'quick' },
  { id: 'chip-3', label: 'Open Projects', icon: Briefcase, href: '/projects', frame: 'quick' },
  { id: 'chip-14', label: 'Open Files', icon: Folder, href: '/files', frame: 'quick' },
];
