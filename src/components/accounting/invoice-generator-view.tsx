'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays, isValid, parseISO } from 'date-fns';
import { Plus, Trash2, Printer, Save, Mail, Info, LoaderCircle, FileUp, FileText, Pencil } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AccountingPageHeader } from './page-header';
import { Logo } from '../logo';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { getContacts, type Contact } from '@/services/contact-service';
import { 
    addInvoiceWithLineItems, 
    updateInvoiceWithLineItems, 
    getInvoices, 
    getInvoiceById, 
    getLineItemsForInvoice, 
    type Invoice, 
    type InvoiceLineItem 
} from '@/services/accounting-service';


// Types
interface CustomLineItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceTemplate {
  name: string;
  items: CustomLineItem[];
}

// LocalStorage Keys
const INVOICE_TEMPLATES_KEY = 'invoiceTemplates';
const EDIT_INVOICE_ID_KEY = 'editInvoiceId';

const predefinedItems = [
  { description: 'Consulting Services', price: 150.00 },
  { description: 'Web Development (Hourly)', price: 120.00 },
  { description: 'Graphic Design Services', price: 80.00 },
  { description: 'Project Management', price: 100.00 },
  { description: 'Monthly Retainer', price: 2500.00 },
];

export function InvoiceGeneratorView() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // State hooks
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(101);

  const [invoiceToEditId, setInvoiceToEditId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [customItems, setCustomItems] = useState<CustomLineItem[]>([]);
  
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  
  const [taxType, setTaxType] = useState('none');
  const [taxRate, setTaxRate] = useState(0);
  const [invoiceNotes, setInvoiceNotes] = useState('Thank you for your business!');

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  
  const printRef = useRef<HTMLDivElement>(null);

  const clearInvoice = useCallback(() => {
    setCustomItems([]);
    setSelectedContactId('');
    setTaxType('none');
    setTaxRate(0);
    setInvoiceNumber(`INV-${nextInvoiceNumber}`);
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
    setInvoiceNotes('Thank you for your business!');
    setInvoiceToEditId(null);
    localStorage.removeItem(EDIT_INVOICE_ID_KEY);
  }, [nextInvoiceNumber]);

  // Effects for data loading and initialization
  useEffect(() => {
    async function loadInitialData() {
        if (!user) {
            setIsDataLoading(false);
            return;
        }
        setIsDataLoading(true);
        try {
            const editId = localStorage.getItem(EDIT_INVOICE_ID_KEY);
            const fetchedContacts = await getContacts(user.uid);
            setContacts(fetchedContacts);

            const savedTemplatesRaw = localStorage.getItem(INVOICE_TEMPLATES_KEY);
            if (savedTemplatesRaw) {
                setTemplates(JSON.parse(savedTemplatesRaw));
            }
            
            if (editId) {
                setInvoiceToEditId(editId);
                const [invoiceToLoad, itemsToLoad] = await Promise.all([
                    getInvoiceById(editId),
                    getLineItemsForInvoice(editId)
                ]);

                if (invoiceToLoad) {
                    setInvoiceNumber(invoiceToLoad.invoiceNumber);
                    setSelectedContactId(invoiceToLoad.contactId);
                    setInvoiceDate(format(invoiceToLoad.invoiceDate, 'yyyy-MM-dd'));
                    setDueDate(format(invoiceToLoad.dueDate, 'yyyy-MM-dd'));
                    setTaxType(invoiceToLoad.taxType || 'none');
                    setTaxRate(invoiceToLoad.taxRate || 0);
                    setInvoiceNotes(invoiceToLoad.notes || '');
                    setCustomItems(itemsToLoad.map((item, index) => ({
                        id: Date.now() + index, // Assign temporary unique ID for the UI
                        description: item.description,
                        quantity: item.quantity,
                        price: item.price
                    })));
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not find the invoice to edit.' });
                    clearInvoice();
                }
            } else {
                const fetchedInvoices = await getInvoices(user.uid);
                const maxInvoiceNum = fetchedInvoices.reduce((max, inv) => {
                    const num = parseInt(inv.invoiceNumber.replace(/\D/g, ''), 10);
                    return isNaN(num) ? max : Math.max(max, num);
                }, 0);
                const nextNum = maxInvoiceNum > 0 ? maxInvoiceNum + 1 : 101;
                setNextInvoiceNumber(nextNum);
                setInvoiceNumber(`INV-${nextNum}`);
            }
        } catch (error) {
            console.error("Failed to load initial data:", error);
            toast({ variant: "destructive", title: "Could not load initial data", description: error instanceof Error ? error.message : "An unknown error occurred." });
        } finally {
            setIsDataLoading(false);
        }
    }
    loadInitialData();
  }, [user, toast, clearInvoice]);

  // Effect to clear edit ID when component unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem(EDIT_INVOICE_ID_KEY);
    }
  }, []);
  
  useEffect(() => {
    if (taxType === 'none') {
        setTaxRate(0);
    }
  }, [taxType]);

  const addCustomItem = () => {
    setCustomItems([...customItems, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  const addPredefinedItem = (itemValue: string) => {
    const itemToAdd = predefinedItems.find(i => i.description === itemValue);
    if (itemToAdd) {
        setCustomItems([...customItems, { id: Date.now(), ...itemToAdd, quantity: 1 }]);
    }
  };
  
  const updateCustomItem = (id: number, field: keyof Omit<CustomLineItem, 'id'>, value: string | number) => {
    setCustomItems(customItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  const removeCustomItem = (id: number) => {
    setCustomItems(customItems.filter(item => item.id !== id));
  };
  
  const applyTemplate = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (!template) return;

    const newItems = template.items.map(item => ({...item, id: Date.now() + Math.random()}));
    setCustomItems(prev => [...prev, ...newItems]);
    toast({
      title: "Template Applied",
      description: `Added ${newItems.length} items from "${template.name}".`
    })
  };

  const selectedContact = useMemo(() => contacts.find(c => c.id === selectedContactId), [contacts, selectedContactId]);

  const subtotal = useMemo(() => {
    return customItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
  }, [customItems]);

  const taxAmount = useMemo(() => {
    if (taxRate <= 0) return 0;
    return subtotal * (taxRate / 100);
  }, [subtotal, taxRate]);

  const total = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleSaveInvoice = async () => {
    if (!user) { toast({ variant: "destructive", title: "Authentication error" }); return; }
    if (!selectedContact) { toast({ variant: 'destructive', title: 'Client Required', description: 'Please select a client.' }); return; }
    if (customItems.length === 0) { toast({ variant: 'destructive', title: 'Empty Invoice', description: 'Please add at least one line item.' }); return; }
    
    const lineItemsToSave: Omit<InvoiceLineItem, 'id' | 'invoiceId'>[] = customItems.map(({ id, ...item }) => item);
    
    try {
        if (invoiceToEditId) {
            // Update existing invoice
            const invoiceDataToUpdate = {
                invoiceNumber,
                clientName: selectedContact.name,
                contactId: selectedContact.id,
                originalAmount: total,
                dueDate: new Date(dueDate),
                invoiceDate: new Date(invoiceDate),
                status: 'outstanding' as 'outstanding',
                notes: invoiceNotes,
                taxRate,
                taxType: taxType || 'none',
            };
            await updateInvoiceWithLineItems(invoiceToEditId, invoiceDataToUpdate, lineItemsToSave);
            toast({ title: "Invoice Updated", description: `Invoice ${invoiceNumber} has been saved.` });
        } else {
            // Create new invoice
            const newInvoiceData: Omit<Invoice, 'id' | 'createdAt'> = {
                invoiceNumber,
                clientName: selectedContact.name,
                contactId: selectedContact.id,
                originalAmount: total,
                amountPaid: 0,
                dueDate: new Date(dueDate),
                invoiceDate: new Date(invoiceDate),
                status: 'outstanding',
                notes: invoiceNotes,
                taxRate,
                taxType: taxType || 'none',
                userId: user.uid,
            };
            await addInvoiceWithLineItems(newInvoiceData, lineItemsToSave);
            toast({ title: "Invoice Saved", description: `Invoice ${invoiceNumber} has been saved.` });
        }
        
        router.push('/accounting/invoices/payments');
        clearInvoice();

    } catch (error) {
        console.error("Failed to save invoice:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save the invoice.' });
    }
  };
  
  const handleSendEmail = () => {
      if (!selectedContact) { toast({ variant: 'destructive', title: 'Cannot Send', description: 'Please select a client first.' }); return; }
      toast({ title: "Email Sent (Simulation)", description: `Invoice ${invoiceNumber} has been sent to ${selectedContact.name}.` });
  };

  const handleClearInvoice = () => {
    if (window.confirm("Are you sure you want to clear the entire invoice? This will remove all items and reset the form.")) {
        clearInvoice();
        toast({ title: "Invoice Cleared" });
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) { toast({ variant: 'destructive', title: 'Template name is required.' }); return; }
    if (customItems.length === 0) { toast({ variant: 'destructive', title: 'Cannot save an empty template. Please add line items.' }); return; }
    
    const templateData: InvoiceTemplate = { name: newTemplateName, items: customItems.map(({ id, ...item }) => item) };
    try {
      const updatedTemplates = [...templates, templateData];
      setTemplates(updatedTemplates);
      localStorage.setItem(INVOICE_TEMPLATES_KEY, JSON.stringify(updatedTemplates));
      toast({ title: 'Template Saved!', description: `Template "${newTemplateName}" has been saved.` });
      setIsTemplateDialogOpen(false);
      setNewTemplateName('');
    } catch (error) {
      console.error('Failed to save template to localStorage', error);
      toast({ variant: 'destructive', title: 'Error Saving Template', description: 'Could not save the template.' });
    }
  };

  if (isDataLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading invoice data...</p>
        </div>
      );
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle={invoiceToEditId ? "Edit Invoice" : "Create Invoice"} />
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">{invoiceToEditId ? `Edit Invoice ${invoiceNumber}` : 'Create an Invoice'}</h1>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2 lg:col-span-2">
                      <Label htmlFor="client-select">Client</Label>
                      <Select value={selectedContactId} onValueChange={setSelectedContactId} disabled={isDataLoading}>
                          <SelectTrigger id="client-select"><SelectValue placeholder={isDataLoading ? "Loading contacts..." : "Select a client..."} /></SelectTrigger>
                          <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="tax-type">Tax Type</Label>
                      <Select value={taxType} onValueChange={setTaxType} id="tax-type"><SelectTrigger><SelectValue placeholder="Select tax type" /></SelectTrigger><SelectContent><SelectItem value="none">No Tax</SelectItem><SelectItem value="vat">VAT</SelectItem><SelectItem value="gst">GST</SelectItem><SelectItem value="hst">HST</SelectItem><SelectItem value="dst">DST</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                      <Input id="tax-rate" type="number" placeholder="e.g., 20" value={taxRate || ''} onChange={(e) => setTaxRate(Number(e.target.value))} disabled={taxType === 'none'}/>
                  </div>
              </div>
              <Separator />
              <div>
                  <h4 className="font-semibold text-base mb-2">Add to Invoice</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                          <Label>Add Predefined Item</Label>
                          <Select onValueChange={addPredefinedItem}><SelectTrigger><SelectValue placeholder="Select a predefined item..." /></SelectTrigger><SelectContent>{predefinedItems.map(item => <SelectItem key={item.description} value={item.description}>{item.description}</SelectItem>)}</SelectContent></Select>
                      </div>
                       <Button variant="outline" onClick={addCustomItem}><Plus className="mr-2 h-4 w-4"/>Add Custom Line Item</Button>
                  </div>
                  {customItems.length > 0 && (
                      <div className="space-y-3 mt-4">
                          <ScrollArea className="h-40 w-full pr-3 border rounded-md"><div className="p-2 space-y-3">{customItems.map(item => (<div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start"><Textarea placeholder="Item description" value={item.description} onChange={e => updateCustomItem(item.id, 'description', e.target.value)} rows={1} className="min-h-[40px] resize-y" /><div className="space-y-1"><Label htmlFor={`qty-${item.id}`} className="text-xs">Qty</Label><Input id={`qty-${item.id}`} type="number" value={item.quantity} onChange={e => updateCustomItem(item.id, 'quantity', Number(e.target.value))} className="w-20 h-8" /></div><div className="space-y-1"><Label htmlFor={`price-${item.id}`} className="text-xs">$ Rate</Label><Input id={`price-${item.id}`} type="number" value={item.price} onChange={e => updateCustomItem(item.id, 'price', Number(e.target.value))} className="w-24 h-8" /></div><Button variant="ghost" size="icon" onClick={() => removeCustomItem(item.id)} className="self-center mt-3"><Trash2 className="h-4 w-4" /></Button></div>))}</div></ScrollArea>
                      </div>
                  )}
              </div>
               {templates.length > 0 && (
                <>
                    <Separator />
                    <div className="space-y-2">
                        <Label>Apply a Template</Label>
                        <Select onValueChange={applyTemplate}>
                            <SelectTrigger><SelectValue placeholder="Select a template to apply..." /></SelectTrigger>
                            <SelectContent>
                                {templates.map((template, index) => (
                                    <SelectItem key={index} value={template.name}>
                                        {template.name} ({template.items.length} items)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </>
               )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <CardTitle>Invoice Preview</CardTitle>
                <div className="flex items-center gap-2">
                    <Button onClick={handleSaveInvoice}><Save className="mr-2 h-4 w-4" />{invoiceToEditId ? 'Update Invoice' : 'Save Invoice'}</Button>
                    <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Invoice</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div id="invoice-preview" ref={printRef} className="bg-white text-black p-8 border rounded-lg shadow-sm w-full font-sans">
                    <header className="flex justify-between items-start pb-6 border-b"><Logo className="text-primary"/><div className="text-right"><h1 className="text-4xl font-bold uppercase text-gray-700">Invoice</h1><div className="flex items-center justify-end gap-1"><p className="text-gray-500">#</p><Input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-32 p-0 h-auto border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /><Pencil className="h-3 w-3 text-gray-400" /></div></div></header>
                    <section className="flex justify-between mt-6"><div><h2 className="font-bold text-gray-500 uppercase mb-2">Bill To</h2>{selectedContact ? (<><p className="font-bold text-lg">{selectedContact.name}</p><p>{selectedContact.email}</p><p>{selectedContact.cellPhone || selectedContact.businessPhone}</p></>) : (<p className="text-gray-500">Select a client</p>)}</div><div className="text-right"><p><span className="font-bold text-gray-500">Invoice Date:</span> <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="inline-block w-40 p-0 h-auto border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></p><p><span className="font-bold text-gray-500">Due Date:</span> <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="inline-block w-40 p-0 h-auto border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></p></div></section>
                    <section className="mt-8"><Table className="text-sm"><TableHeader className="bg-gray-100"><TableRow><TableHead className="w-1/2 text-gray-600">Description</TableHead><TableHead className="text-center text-gray-600">Rate / Price</TableHead><TableHead className="text-center text-gray-600">Qty</TableHead><TableHead className="text-right text-gray-600">Total</TableHead></TableRow></TableHeader><TableBody>{customItems.map((item, index) => (<TableRow key={item.id}><TableCell className="whitespace-pre-wrap">{item.description}</TableCell><TableCell className="text-center">{item.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell><TableCell className="text-center">{item.quantity}</TableCell><TableCell className="text-right">{(item.quantity * item.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>))}</TableBody></Table></section>
                    <section className="flex justify-end mt-6"><div className="w-full max-w-sm space-y-2"><div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>{subtotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></div><Separator /><div className="flex justify-between"><span className="text-gray-500">{taxType !== 'none' ? `Tax (${(taxType || '').toUpperCase()} @ ${taxRate || 0}%)` : 'Tax:'}</span><span>{taxAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></div><Separator /><div className="flex justify-between font-bold text-lg"><span className="text-gray-600">Total Due:</span><span>{total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></div></div></section>
                    <footer className="mt-12 pt-6 border-t"><Label htmlFor="invoice-notes" className="text-xs text-gray-500">Notes / Terms</Label><Textarea id="invoice-notes" placeholder="e.g., Thank you for your business!" value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} className="mt-1 text-xs text-gray-600 border-none p-0 focus-visible:ring-0 shadow-none bg-transparent resize-none text-center"/></footer>
                </div>
            </CardContent>
            <CardFooter className="justify-between">
                 <div className="flex items-center gap-2">
                    <Button onClick={handleSendEmail}><Mail className="mr-2 h-4 w-4" /> Email Invoice</Button>
                    <Button variant="ghost" size="sm" onClick={handleClearInvoice}><Trash2 className="mr-2 h-4 w-4" /> Clear</Button>
                 </div>
                 <div>
                    <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                        <DialogTrigger asChild><Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save as Template</Button></DialogTrigger>
                        <DialogContent><DialogHeader><DialogTitle>Save Invoice as Template</DialogTitle><DialogDescription>Enter a name for this template. It will save the custom line items.</DialogDescription></DialogHeader><div className="py-4"><Label htmlFor="template-name">Template Name</Label><Input id="template-name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="e.g., 'Standard Consulting Invoice'" onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTemplate() }}/></div><DialogFooter><Button variant="ghost" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveTemplate}>Save Template</Button></DialogFooter></DialogContent>
                    </Dialog>
                </div>
            </CardFooter>
        </Card>
      </div>
    </>
  );
}
