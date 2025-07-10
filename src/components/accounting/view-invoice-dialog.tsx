
"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Logo } from '../logo';
import { Separator } from '../ui/separator';
import { Printer, Mail } from 'lucide-react';
import { type FinalizedInvoice } from './invoice-payments-view';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ViewInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  invoice: FinalizedInvoice | null;
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export function ViewInvoiceDialog({ isOpen, onOpenChange, invoice }: ViewInvoiceDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (!invoice) return null;

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: sans-serif; }
              .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; color: #555; }
              .invoice-box table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
              .invoice-box table td { padding: 5px; vertical-align: top; }
              .invoice-box table tr.top table td { padding-bottom: 20px; }
              .invoice-box table tr.top table td.title { font-size: 45px; line-height: 45px; color: #333; }
              .invoice-box table tr.information table td { padding-bottom: 40px; }
              .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
              .invoice-box table tr.details td { padding-bottom: 20px; }
              .invoice-box table tr.item td { border-bottom: 1px solid #eee; }
              .invoice-box table tr.item.last td { border-bottom: none; }
              .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
              .paid-stamp { position: absolute; top: 150px; left: 50%; transform: translateX(-50%) rotate(-15deg); font-size: 100px; font-weight: bold; color: rgba(0, 128, 0, 0.2); border: 10px solid rgba(0, 128, 0, 0.2); padding: 20px; border-radius: 10px; z-index: -1; }
            </style>
          </head>
          <body>
            <div class="invoice-box">
              ${printRef.current.innerHTML}
            </div>
          </body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.focus();
      printWindow?.print();
    }
  };

  const handleSendEmail = () => {
    toast({
        title: "Email Sent (Simulation)",
        description: `The receipt for invoice ${invoice.invoiceNumber} has been sent to ${invoice.clientName}.`,
    });
  };
  
  const isPaid = invoice.originalAmount - invoice.amountPaid <= 0.001;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Invoice {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Viewing invoice for {invoice.clientName}. Ready for printing or emailing.
          </DialogDescription>
        </DialogHeader>
        <div ref={printRef} className="bg-white text-black p-8 border rounded-lg shadow-sm w-full font-sans relative">
            {isPaid && (
                 <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-15deg)',
                    fontSize: '6rem',
                    fontWeight: 'bold',
                    color: 'rgba(0, 128, 0, 0.15)',
                    border: '10px solid rgba(0, 128, 0, 0.15)',
                    padding: '1rem 2rem',
                    borderRadius: '10px',
                    zIndex: 1,
                    pointerEvents: 'none'
                 }}>
                    PAID
                 </div>
            )}
            <header className="flex justify-between items-start pb-6 border-b">
                <Logo className="text-primary"/>
                <div className="text-right">
                    <h1 className="text-4xl font-bold uppercase text-gray-700">Invoice</h1>
                    <p className="text-gray-500">#{invoice.invoiceNumber}</p>
                </div>
            </header>
            
            <section className="flex justify-between mt-6">
                <div>
                    <h2 className="font-bold text-gray-500 uppercase mb-2">Bill To</h2>
                    <p className="font-bold text-lg">{invoice.clientName}</p>
                </div>
                <div className="text-right">
                    <p><span className="font-bold text-gray-500">Date Issued:</span> {format(new Date(), 'PP')}</p>
                    <p><span className="font-bold text-gray-500">Due Date:</span> {format(new Date(invoice.dueDate), 'PP')}</p>
                </div>
            </section>

            <section className="mt-8">
                <Table className="text-sm">
                    <TableHeader className="bg-gray-100">
                        <TableRow>
                            <TableHead className="w-1/2 text-gray-600">Description</TableHead>
                            <TableHead className="text-right text-gray-600">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>Invoice for services rendered</TableCell>
                            <TableCell className="text-right">{formatCurrency(invoice.originalAmount)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </section>

            <section className="flex justify-end mt-6">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal:</span>
                        <span>{formatCurrency(invoice.originalAmount)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">Amount Paid:</span>
                        <span className="text-green-600">{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span className="text-gray-600">Balance Due:</span>
                        <span>{formatCurrency(invoice.originalAmount - invoice.amountPaid)}</span>
                    </div>
                </div>
            </section>

            <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-400">
                <p>Thank you for your business!</p>
            </footer>
        </div>
        <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <div>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={handleSendEmail}><Mail className="mr-2 h-4 w-4" /> Send Email</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
