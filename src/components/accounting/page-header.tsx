'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AccountingPageHeaderProps {
  pageTitle: string;
}

export function AccountingPageHeader({ pageTitle }: AccountingPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/accounting">Accounting Hub</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Button asChild variant="ghost" size="icon" className="rounded-full">
        <Link href="/accounting" aria-label="Return to Accounting Hub">
          <X className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
}
