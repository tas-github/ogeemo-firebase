
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface InvoicePageHeaderProps {
  pageTitle: string;
}

export function InvoicePageHeader({ pageTitle }: InvoicePageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/accounting">Accounting</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             <BreadcrumbLink asChild>
                <Link href="/accounting/accounts-receivable">Accounts Receivable</Link>
             </BreadcrumbLink>
          </BreadcrumbItem>
           <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Button asChild variant="outline">
        <Link href="/accounting/accounts-receivable" aria-label="Return to Accounts Receivable">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to A/R
        </Link>
      </Button>
    </div>
  );
}
