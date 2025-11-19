

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays } from 'date-fns';
import { Plus, Trash2, Printer, Save, Mail, Info, ChevronsUpDown, Check, LoaderCircle, X, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AccountingPageHeader } from './page-header';
import { Logo } from '../logo';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { getCompanies, addCompany, type Company, addInvoiceWithLineItems, updateInvoiceWithLineItems, getInvoiceById, getLineItemsForInvoice, getServiceItems, type ServiceItem } from '@/services/accounting-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useReactToPrint } from '@/hooks/use-react-to-print';
import AddLineItemDialog from './AddLineItemDialog';


interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxRate?: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const EDIT_INVOICE_ID_KEY = 'editInvoiceId';


export function InvoiceGeneratorView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  const { handlePrint, contentRef } = useReactToPrint();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [invoiceToEditId, setInvoiceToEditId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState("Thank you for your business! Payment is due within 14 days.");

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  const [isCompanyPopoverOpen, setIsCompanyPopoverOpen] = useState(false);
  const [companySearchValue, setCompanySearchValue] = useState('');
  const [isAddLineItemOpen, setIsAddLineItemOpen] = useState(false);
  
  const loadInvoiceForEditing = useCallback(async (invoiceId: string) => {
      setIsLoading(true);
      try {
          const [invoiceData, lineItemsData] = await Promise.all([
              getInvoiceById(invoiceId),
              getLineItemsForInvoice(invoiceId),
          ]);
          
          if (!invoiceData) {
              toast({ variant: 'destructive', title: 'Error', description: 'Could not find the invoice to edit.' });
              localStorage.removeItem(EDIT_INVOICE_ID_KEY);
              return;
          }

          setInvoiceNumber(invoiceData.invoiceNumber);
          setInvoiceDate(format(new Date(invoiceData.invoiceDate), 'yyyy-MM-dd'));
          setDueDate(format(new Date(invoiceData.dueDate), 'yyyy-MM-dd'));
          setNotes(invoiceData.notes);
          setSelectedCompanyId(invoiceData.companyName); // Assuming companyName is used as ID for now
          setSelectedContactId(invoiceData.contactId);
          setLineItems(lineItemsData.map(item => ({ ...item, id: item.id || `item_${Math.random()}` })));
          
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Failed to load invoice', description: error.message });
      } finally {
          setIsLoading(false);
      }
  }, [toast]);


  useEffect(() => {
    async function loadData() {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [fetchedCompanies, fetchedContacts, fetchedServiceItems] = await Promise.all([
                getCompanies(user.uid),
                getContacts(user.uid),
                getServiceItems(user.uid),
            ]);
            setCompanies(fetchedCompanies);
            setContacts(fetchedContacts);
            setServiceItems(fetchedServiceItems);

            const invoiceId = localStorage.getItem(EDIT_INVOICE_ID_KEY);
            if (invoiceId) {
                setInvoiceToEditId(invoiceId);
                await loadInvoiceForEditing(invoiceId);
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }
    loadData();
  }, [user, toast, loadInvoiceForEditing]);

  const handleCreateCompany = async (companyName: string) => {
    if (!user || !companyName.trim()) return;
    try {
        const newCompany = await addCompany({ name: companyName.trim(), userId: user.uid });
        setCompanies(prev => [...prev, newCompany]);
        setSelectedCompanyId(newCompany.id);
        setIsCompanyPopoverOpen(false);
        setCompanySearchValue('');
        toast({ title: 'Company Created', description: `"${companyName.trim()}" has been added.` });
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Failed to create company', description: error.message });
    }
  };

  const handleAddItem = useCallback((item: Omit<LineItem, 'id'>) => {
    setLineItems(prev => [...prev, { ...item, id: `item_${Date.now()}` }]);
    toast({ title: "Item Added", description: `"${item.description}" was added to the invoice.` });
  }, [toast]);


  const handleItemChange = (id: string, field: keyof Omit<LineItem, 'id'>, value: string) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'quantity' || field === 'price' || field === 'taxRate') {
          return { ...item, [field]: parseFloat(value) || 0 };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleDeleteItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };
  
  const { subtotal, taxAmount, total } = useMemo(() => {
    const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const tax = lineItems.reduce((acc, item) => {
        const itemTotal = item.quantity * item.price;
        const itemTax = itemTotal * ((item.taxRate || 0) / 100);
        return acc + itemTax;
    }, 0);
    const total = subtotal + tax;
    return { subtotal, taxAmount: tax, total };
  }, [lineItems]);
  
  const handleSaveInvoice = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to save.'});
        return;
    }
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    if (!selectedCompanyId || !selectedContactId || !selectedCompany) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a company and contact.'});
        return;
    }

    setIsSaving(true);
    
    const invoiceData = {
        invoiceNumber,
        companyName: selectedCompany.name,
        contactId: selectedContactId,
        originalAmount: total,
        amountPaid: 0,
        dueDate: new Date(dueDate),
        invoiceDate: new Date(invoiceDate),
        status: 'outstanding' as const,
        notes,
        taxRate: 0, // No longer global
        taxType: 'line-item', // Indicate per-line tax
        userId: user.uid,
    };
    
    const itemsToSave = lineItems.map(({id, ...rest}) => rest);

    try {
        if (invoiceToEditId) {
            await updateInvoiceWithLineItems(invoiceToEditId, invoiceData, itemsToSave);
            toast({ title: 'Invoice Updated', description: `Invoice ${invoiceNumber} has been saved.` });
        } else {
            const newInvoice = await addInvoiceWithLineItems(invoiceData, itemsToSave);
            setInvoiceToEditId(newInvoice.id);
            toast({ title: 'Invoice Saved', description: `Invoice ${invoiceNumber} has been created.` });
        }
        localStorage.removeItem(EDIT_INVOICE_ID_KEY);
        router.push('/accounting/accounts-receivable');

    } catch (error: any) {
        console.error("Save Invoice Error:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleSendEmail = () => toast({ title: "Email (Placeholder)", description: "This would email the invoice." });
  const handleClearInvoice = () => {
    localStorage.removeItem(EDIT_INVOICE_ID_KEY);
    setInvoiceToEditId(null);
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
    setNotes("Thank you for your business! Payment is due within 14 days.");
    setSelectedCompanyId('');
    setSelectedContactId('');
    setLineItems([]);
    toast({ title: "Form Cleared" });
  };
  
  const companyExists = useMemo(() => companies.some(c => c.name.toLowerCase() === companySearchValue.toLowerCase()), [companies, companySearchValue]);
  
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const selectedContact = contacts.find(c => c.id === selectedContactId);
  

  return (
    <>
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="Create Invoice" />
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Create an Invoice</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Generate professional invoices by fetching logged activities or adding items manually.
          </p>
        </header>

        <Card>
          <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                  Invoice Setup
                  <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Info className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p className="max-w-xs">Use this section to build your invoice. Fetch logged time for a client, add custom items, and set taxes before printing or finalizing.</p></TooltipContent></Tooltip></TooltipProvider>
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Popover open={isCompanyPopoverOpen} onOpenChange={setIsCompanyPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between" disabled={isLoading}>
                                {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin"/> : selectedCompany?.name || "Select or create company..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                             <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                                <CommandInput 
                                    placeholder="Search company..."
                                    value={companySearchValue}
                                    onValueChange={setCompanySearchValue}
                                />
                                <CommandList>
                                     <CommandEmpty>
                                        {companySearchValue.trim() && !companyExists ? (
                                            <Button variant="link" className="p-1 h-auto w-full justify-start text-sm" onClick={() => handleCreateCompany(companySearchValue)}>
                                                <Plus className="mr-2 h-4 w-4"/> Create "{companySearchValue}"
                                            </Button>
                                        ) : <div className="py-6 text-center text-sm">No company found.</div>}
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {companies.map(c => (
                                            <CommandItem key={c.id} value={c.name} onSelect={() => { setSelectedCompanyId(c.id); setCompanySearchValue(''); setIsCompanyPopoverOpen(false); }}>
                                                <Check className={cn("mr-2 h-4 w-4", selectedCompanyId === c.id ? "opacity-100" : "opacity-0")} />
                                                {c.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                      </Popover>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="contact-person-select">Contact Name</Label>
                      <Select value={selectedContactId} onValueChange={setSelectedContactId} disabled={isLoading}>
                          <SelectTrigger id="contact-person-select">
                              <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a contact...'} />
                          </SelectTrigger>
                          <SelectContent>
                              {contacts.map(contact => (
                                  <SelectItem key={contact.id} value={contact.id}>
                                      {contact.name}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <Separator />
              <div>
                  <h4 className="font-semibold text-base mb-2">Invoice Items</h4>
                  <Button onClick={() => setIsAddLineItemOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Line Item</Button>
              </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <CardTitle>Invoice Preview</CardTitle>
                <div className="flex items-center gap-2">
                    <Button onClick={handleSaveInvoice} disabled={isSaving}>
                        {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Invoice
                    </Button>
                    <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Invoice</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div id="printable-area" ref={contentRef} className="bg-white text-black p-8 border rounded-lg shadow-sm w-full font-sans">
                    <header className="flex justify-between items-start pb-6 border-b"><Logo className="text-primary"/><div className="text-right"><h1 className="text-4xl font-bold uppercase text-gray-700">Invoice</h1><div className="flex items-center justify-end gap-1"><p className="text-gray-500">#</p><Input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-32 p-0 h-auto border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></div></div></header>
                    <section className="flex justify-between mt-6">
                        <div>
                            <h2 className="font-bold text-gray-500 uppercase mb-2">Bill To</h2>
                            <p className="font-bold text-lg">{selectedCompany?.name || 'Select a company'}</p>
                            <p className="text-gray-500">{selectedContact?.name || 'Select a contact'}</p>
                        </div>
                        <div className="text-right">
                            <p><span className="font-bold text-gray-500">Invoice Date:</span> <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="inline-block w-40 p-0 h-auto border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></p>
                            <p><span className="font-bold text-gray-500">Due Date:</span> <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="inline-block w-40 p-0 h-auto border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></p>
                        </div>
                    </section>
                    <section className="mt-8">
                      <Table className="text-sm">
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[40%] text-gray-600">Description</TableHead>
                                <TableHead className="w-[15%] text-center text-gray-600">Price</TableHead>
                                <TableHead className="w-[10%] text-center text-gray-600">Qty</TableHead>
                                <TableHead className="w-[15%] text-center text-gray-600">Tax (%)</TableHead>
                                <TableHead className="w-[15%] text-right text-gray-600">Total</TableHead>
                                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.length > 0 ? (
                                lineItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input 
                                                value={item.description} 
                                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                className="border-0 focus-visible:ring-0"
                                                placeholder="Service or product"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number"
                                                value={item.price} 
                                                onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                                className="border-0 focus-visible:ring-0 text-center"
                                                placeholder="0.00"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number"
                                                value={item.quantity} 
                                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                className="border-0 focus-visible:ring-0 text-center"
                                                placeholder="1"
                                            />
                                        </TableCell>
                                         <TableCell>
                                            <Input 
                                                type="number"
                                                value={item.taxRate || ''} 
                                                onChange={(e) => handleItemChange(item.id, 'taxRate', e.target.value)}
                                                className="border-0 focus-visible:ring-0 text-center"
                                                placeholder="0"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(item.quantity * item.price * (1 + (item.taxRate || 0)/100))}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">No items added yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                      </Table>
                    </section>
                    <section className="flex justify-end mt-6">
                        <div className="w-full max-w-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500">Total Tax:</span>
                                <span>{formatCurrency(taxAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span className="text-gray-600">Total Due:</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </section>
                    <footer className="mt-12 pt-6 border-t"><Textarea className="w-full border-0 focus-visible:ring-0 text-xs text-gray-600 text-center" value={notes} onChange={e => setNotes(e.target.value)}/></footer>
                </div>
            </CardContent>
            <CardFooter className="justify-between">
                 <div className="flex items-center gap-2">
                    <Button onClick={handleSendEmail}><Mail className="mr-2 h-4 w-4" /> Email Invoice</Button>
                    <Button variant="ghost" size="sm" onClick={handleClearInvoice}><X className="mr-2 h-4 w-4" /> Clear</Button>
                 </div>
                 <div>
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Use Template</Button></DialogTrigger>
                        <DialogContent><DialogHeader><DialogTitle>Save Invoice as Template</DialogTitle><DialogDescription>Enter a name for this template. It will save the custom line items.</DialogDescription></DialogHeader><div className="py-4"><Label htmlFor="template-name">Template Name</Label><Input id="template-name" placeholder="e.g., 'Standard Consulting Invoice'" /></div><DialogFooter><Button variant="ghost">Cancel</Button><Button>Save</Button></DialogFooter></DialogContent>
                    </Dialog>
                </div>
            </CardFooter>
        </Card>
      </div>
    </ScrollArea>
    <AddLineItemDialog
      isOpen={isAddLineItemOpen}
      onOpenChange={setIsAddLineItemOpen}
      serviceItems={serviceItems}
      onAddItem={handleAddItem}
    />
  </>
  );
}
