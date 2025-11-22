
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays, parseISO } from 'date-fns';
import { Plus, Trash2, Save, Eye, ChevronsUpDown, Check, LoaderCircle, X, Calendar as CalendarIcon, WandSparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AccountingPageHeader } from './page-header';
import { Logo } from '../logo';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { getInvoiceById, getLineItemsForInvoice, getServiceItems, type ServiceItem, addInvoiceWithLineItems, updateInvoiceWithLineItems, addServiceItem, getTaxTypes, type TaxType } from '@/services/accounting-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { getFolders as getContactFolders, type FolderData } from '@/services/contact-folder-service';
import { cn } from '@/lib/utils';
import ContactFormDialog from '../contacts/contact-form-dialog';
import { getCompanies, addCompany, type Company } from '@/services/accounting-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '../ui/checkbox';


interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxTypeId?: string | null;
  taxRate?: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const EDIT_INVOICE_ID_KEY = 'editInvoiceId';
const INVOICE_FROM_REPORT_KEY = 'invoiceFromReportData';
const INDIVIDUAL_CONTACTS_ID = 'individual-contacts';

const InvoicePreviewContent = ({
    invoiceNumber,
    invoiceDate,
    dueDate,
    selectedCompany,
    selectedContact,
    lineItems,
    notes,
    subtotal,
    taxAmount,
    total,
    isPaid
}: {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    selectedCompany: Company | undefined;
    selectedContact: Contact | undefined;
    lineItems: LineItem[];
    notes: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    isPaid: boolean;
}) => (
     <div className="p-8">
        <div className="relative">
            {isPaid && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)',
                    fontSize: 'clamp(4rem, 15vw, 8rem)', fontWeight: 'bold', color: 'rgba(0, 128, 0, 0.10)',
                    border: 'clamp(0.5rem, 2vw, 1rem) solid rgba(0, 128, 0, 0.10)', padding: '1rem 2rem', borderRadius: '10px',
                    zIndex: 1, pointerEvents: 'none', lineHeight: '1'
                }}>
                    PAID
                </div>
            )}
            <header className="flex justify-between items-start pb-6 border-b">
                <Logo className="text-primary"/>
                <div className="text-right">
                    <h1 className="text-4xl font-bold uppercase text-gray-700">Invoice</h1>
                    <p className="text-gray-500">#{invoiceNumber}</p>
                </div>
            </header>
            <section className="flex justify-between mt-6">
                <div>
                    <h2 className="font-bold text-gray-500 uppercase mb-2">Bill To</h2>
                    <p className="font-bold text-lg">{selectedCompany?.name || selectedContact?.name || '[Client Name]'}</p>
                    {selectedCompany && selectedContact && <p>{selectedContact.name}</p>}
                </div>
                <div className="text-right">
                    <p><span className="font-bold text-gray-500">Invoice Date:</span> {format(invoiceDate, 'PP')}</p>
                    <p><span className="font-bold text-gray-500">Due Date:</span> {format(dueDate, 'PP')}</p>
                </div>
            </section>
            <section className="mt-8">
                <Table>
                    <TableHeader className="bg-gray-100">
                        <TableRow>
                            <TableHead className="w-1/2 text-gray-600">Description</TableHead>
                            <TableHead className="text-center text-gray-600">Qty</TableHead>
                            <TableHead className="text-right text-gray-600">Price</TableHead>
                            <TableHead className="text-right text-gray-600">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lineItems.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(item.price)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(item.quantity * item.price)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </section>
            <section className="flex justify-end mt-6">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-mono">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tax:</span>
                        <span className="font-mono">{formatCurrency(taxAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span className="text-gray-600">Total Due:</span>
                        <span className="font-mono">{formatCurrency(total)}</span>
                    </div>
                </div>
            </section>
            <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-400">
                <p>{notes}</p>
            </footer>
        </div>
      </div>
);

export function InvoiceGeneratorView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactFolders, setContactFolders] = useState<FolderData[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [invoiceToEditId, setInvoiceToEditId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 14));
  const [notes, setNotes] = useState("Thank you for your business! Payment is due within 14 days.");

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // New state for inline item form
  const [newDescription, setNewDescription] = useState('');
  const [newQuantity, setNewQuantity] = useState<number | ''>(1);
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newTaxTypeId, setNewTaxTypeId] = useState<string>('none');
  const [saveAsRepeatItem, setSaveAsRepeatItem] = useState(false);
  const [isDescriptionPopoverOpen, setIsDescriptionPopoverOpen] = useState(false);

  const [contactFormInitialData, setContactFormInitialData] = useState<Partial<Contact>>({});

  const contactsForSelectedCompany = useMemo(() => {
    if (!selectedCompanyId) return [];
    
    if (selectedCompanyId === INDIVIDUAL_CONTACTS_ID) {
      return contacts.filter(c => !c.businessName);
    }
    
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return [];

    return contacts.filter(c => c.businessName === company.name);
  }, [selectedCompanyId, companies, contacts]);
  
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedContactId(null);
  };
  
  const loadInvoiceForEditing = useCallback(async (invoiceId: string, companiesData: Company[], contactsData: Contact[], taxTypesData: TaxType[]) => {
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
          setInvoiceDate(new Date(invoiceData.invoiceDate));
          setDueDate(new Date(invoiceData.dueDate));
          setNotes(invoiceData.notes);
          
          const company = companiesData.find(c => c.name === invoiceData.companyName);
          if (company) {
            setSelectedCompanyId(company.id);
          } else {
            const contact = contactsData.find(c => c.id === invoiceData.contactId && !c.businessName);
            if (contact) {
                setSelectedCompanyId(INDIVIDUAL_CONTACTS_ID);
            }
          }

          setSelectedContactId(invoiceData.contactId);
          
          const mappedLineItems = lineItemsData.map(item => {
              const taxType = taxTypesData.find(t => t.rate === item.taxRate);
              return {
                  ...item,
                  id: item.id || `item_${Math.random()}`,
                  taxTypeId: taxType ? taxType.id : 'none',
                  taxRate: item.taxRate || 0,
              };
          });
          setLineItems(mappedLineItems);
          
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
            const [
                fetchedCompanies, 
                fetchedContacts, 
                fetchedServiceItems, 
                fetchedFolders, 
                fetchedTaxTypes
            ] = await Promise.all([
                getCompanies(user.uid),
                getContacts(user.uid),
                getServiceItems(user.uid),
                getContactFolders(user.uid),
                getTaxTypes(user.uid),
            ]);
            setCompanies(fetchedCompanies);
            setContacts(fetchedContacts);
            setServiceItems(fetchedServiceItems);
            setContactFolders(fetchedFolders);
            setTaxTypes(fetchedTaxTypes);

            const invoiceId = localStorage.getItem(EDIT_INVOICE_ID_KEY);
            if (invoiceId) {
                setInvoiceToEditId(invoiceId);
                // We pass the just-fetched data to avoid race conditions with state updates
                await loadInvoiceForEditing(invoiceId, fetchedCompanies, fetchedContacts, fetchedTaxTypes);
            } else {
                setIsLoading(false);
            }
            
            const invoiceReportDataRaw = sessionStorage.getItem(INVOICE_FROM_REPORT_KEY);
            if (invoiceReportDataRaw) {
                const { contactId, lineItems: reportLineItems } = JSON.parse(invoiceReportDataRaw);
                const contact = fetchedContacts.find(c => c.id === contactId);
                const company = contact ? fetchedCompanies.find(comp => comp.name === contact.businessName) : null;
                if (company) {
                    setSelectedCompanyId(company.id);
                }
                setSelectedContactId(contactId);
                setLineItems(reportLineItems.map((item: any, index: number) => ({ ...item, id: `report_${index}` })));
                sessionStorage.removeItem(INVOICE_FROM_REPORT_KEY);
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load data', description: error.message });
            setIsLoading(false);
        }
    }
    loadData();
  }, [user, toast, loadInvoiceForEditing]);


  const handleAddItem = async () => {
    if (!newDescription.trim() || newQuantity === '' || newPrice === '') {
        toast({ variant: 'destructive', title: 'Missing Item Details' });
        return;
    }

    const selectedTax = taxTypes.find(t => t.id === newTaxTypeId);
    
    if (saveAsRepeatItem && user) {
        try {
            const newServiceItemData = {
                description: newDescription,
                price: Number(newPrice),
                taxType: selectedTax?.name,
                taxRate: selectedTax?.rate,
                userId: user.uid,
            };
            const newServiceItem = await addServiceItem(newServiceItemData);
            setServiceItems(prev => [...prev, newServiceItem]);
            toast({ title: "Repeat Item Saved" });
        } catch (error: any) {
             toast({ variant: 'destructive', title: "Failed to save repeat item", description: error.message });
        }
    }

    const newItem: LineItem = {
        id: `new_${Date.now()}`,
        description: newDescription,
        quantity: Number(newQuantity),
        price: Number(newPrice),
        taxTypeId: newTaxTypeId,
        taxRate: selectedTax?.rate || 0,
    };
    
    setLineItems(prev => [...prev, newItem]);
    
    // Reset form
    setNewDescription('');
    setNewQuantity(1);
    setNewPrice('');
    setNewTaxTypeId('none');
    setSaveAsRepeatItem(false);
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
    const selectedContact = contacts.find(c => c.id === selectedContactId);
    if (!selectedContact) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a client contact.'});
        return;
    }
    const companyName = companies.find(c => c.id === selectedCompanyId)?.name || selectedContact.name;


    setIsSaving(true);
    
    const invoiceData = {
        invoiceNumber,
        companyName,
        contactId: selectedContactId!,
        originalAmount: total,
        amountPaid: invoiceToEditId ? (await getInvoiceById(invoiceToEditId))?.amountPaid || 0 : 0,
        dueDate: dueDate,
        invoiceDate: invoiceDate,
        status: 'outstanding' as const,
        notes,
        taxType: 'line-item', // Updated tax type
        userId: user.uid,
    };
    
    const itemsToSave = lineItems.map(({id, ...rest}) => ({
        description: rest.description,
        quantity: rest.quantity,
        price: rest.price,
        taxRate: rest.taxRate || 0,
    }));

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

  const handleClearInvoice = () => {
    localStorage.removeItem(EDIT_INVOICE_ID_KEY);
    setInvoiceToEditId(null);
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setInvoiceDate(new Date());
    setDueDate(addDays(new Date(), 14));
    setNotes("Thank you for your business! Payment is due within 14 days.");
    setSelectedCompanyId(null);
    setSelectedContactId(null);
    setLineItems([]);
    toast({ title: "Form Cleared" });
  };
  
  const handleContactSave = (savedContact: Contact, isEditing: boolean) => {
    if (isEditing) {
        setContacts(prev => prev.map(c => c.id === savedContact.id ? savedContact : c));
    } else {
        setContacts(prev => [savedContact, ...prev]);
    }
    const contactCompany = companies.find(c => c.name === savedContact.businessName);
    if (!contactCompany && savedContact.businessName && user) {
        const newCompany = { id: `comp_${Date.now()}`, name: savedContact.businessName, userId: user.uid };
        setCompanies(prev => [...prev, newCompany]);
        setSelectedCompanyId(newCompany.id);
    } else if (contactCompany) {
        setSelectedCompanyId(contactCompany.id);
    } else {
        setSelectedCompanyId(INDIVIDUAL_CONTACTS_ID);
    }

    setSelectedContactId(savedContact.id);
    setIsContactFormOpen(false);
  };
  
  const handleOpenNewContactDialog = () => {
    const company = companies.find(c => c.id === selectedCompanyId);
    setContactFormInitialData({
      businessName: company ? company.name : ''
    });
    setIsContactFormOpen(true);
  };
  
  const handlePaymentTermsChange = (value: string) => {
      if (!invoiceDate) return;
      const days = parseInt(value, 10);
      if (!isNaN(days)) {
          setDueDate(addDays(invoiceDate, days));
      }
  };

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const isPaid = total <= 0 && lineItems.length > 0;

  const previewProps = {
      invoiceNumber, invoiceDate, dueDate, selectedCompany, selectedContact, lineItems, notes, subtotal, taxAmount, total, isPaid,
  };
  
  return (
    <>
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="Create Invoice" />
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Create an Invoice</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Generate professional invoices by selecting a client and adding line items.
          </p>
        </header>

        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <CardTitle>Invoice Details</CardTitle>
                <div className="flex items-center gap-2">
                    <Button onClick={handleSaveInvoice} disabled={isSaving}>
                        {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Invoice
                    </Button>
                    <Button variant="outline" onClick={() => setIsPreviewOpen(true)}><Eye className="mr-2 h-4 w-4" /> Preview</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label>Client</Label>
                             <div className="flex gap-2">
                                <Select value={selectedCompanyId || ''} onValueChange={handleCompanyChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Company..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={INDIVIDUAL_CONTACTS_ID}>-- Individual Contacts --</SelectItem>
                                        <Separator />
                                        {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedContactId || ''} onValueChange={setSelectedContactId} disabled={!selectedCompanyId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Contact..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contactsForSelectedCompany.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </div>
                             <Button variant="link" className="p-0 h-auto text-xs" onClick={handleOpenNewContactDialog}>+ Add New Contact</Button>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoiceNumber">Invoice #</Label>
                                <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                            </div>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoiceDate">Invoice Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !invoiceDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={invoiceDate} onSelect={(date) => date && setInvoiceDate(date)} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={(date) => date && setDueDate(date)} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Terms</Label>
                            <Select onValueChange={handlePaymentTermsChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Set due date..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Due on receipt</SelectItem>
                                    <SelectItem value="14">Net 14</SelectItem>
                                    <SelectItem value="30">Net 30</SelectItem>
                                    <SelectItem value="60">Net 60</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div>
                        <Label>Line Items</Label>
                        <div className="border rounded-md mt-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-2/5">Description</TableHead>
                                        <TableHead className="w-[100px] text-center">Qty</TableHead>
                                        <TableHead className="w-32 text-right">Price</TableHead>
                                        <TableHead className="w-48 text-right">Tax</TableHead>
                                        <TableHead className="w-32 text-right">Total</TableHead>
                                        <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lineItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.description}</TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.price)}</TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground">{item.taxRate || 0}%</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.quantity * item.price)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                     {/* Inline Form */}
                                    <TableRow>
                                        <TableCell>
                                            <Popover open={isDescriptionPopoverOpen} onOpenChange={setIsDescriptionPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <Input placeholder="Item description" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search repeat items..." />
                                                        <CommandList>
                                                            <CommandEmpty>No item found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {serviceItems.map(item => (
                                                                    <CommandItem key={item.id} onSelect={() => {
                                                                        setNewDescription(item.description);
                                                                        setNewPrice(item.price);
                                                                        const tax = taxTypes.find(t => t.name === item.taxType);
                                                                        setNewTaxTypeId(tax ? tax.id : 'none');
                                                                        setIsDescriptionPopoverOpen(false);
                                                                    }}>
                                                                        {item.description}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </TableCell>
                                        <TableCell><Input type="number" placeholder="1" value={newQuantity} onChange={e => setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="text-center" /></TableCell>
                                        <TableCell><Input type="number" placeholder="0.00" value={newPrice} onChange={e => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))} className="text-right" /></TableCell>
                                        <TableCell>
                                            <Select value={newTaxTypeId} onValueChange={setNewTaxTypeId}>
                                                <SelectTrigger><SelectValue placeholder="No Tax" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Tax</SelectItem>
                                                    {taxTypes.map(tax => <SelectItem key={tax.id} value={tax.id}>{tax.name} ({tax.rate}%)</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell colSpan={2}>
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Checkbox id="save-repeat" checked={saveAsRepeatItem} onCheckedChange={(checked) => setSaveAsRepeatItem(!!checked)} />
                                                    <Label htmlFor="save-repeat" className="text-xs">Save as Repeat Item</Label>
                                                </div>
                                                <Button onClick={handleAddItem} size="sm"><Plus className="mr-2 h-4 w-4"/> Add</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                         <div className="space-y-2">
                            <Label htmlFor="notes">Notes / Terms</Label>
                            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4}/>
                         </div>
                         <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-mono">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Tax:</span>
                                <span className="font-mono">{formatCurrency(taxAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Due:</span>
                                <span className="font-mono">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="justify-between">
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleClearInvoice}><X className="mr-2 h-4 w-4" /> Clear</Button>
                 </div>
            </CardFooter>
        </Card>
      </div>
    </ScrollArea>

    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0">
            <ScrollArea className="max-h-[90vh]">
                <InvoicePreviewContent {...previewProps} />
            </ScrollArea>
        </DialogContent>
    </Dialog>

    {isContactFormOpen && 
        <ContactFormDialog
            isOpen={isContactFormOpen}
            onOpenChange={setIsContactFormOpen}
            contactToEdit={null}
            folders={contactFolders}
            onSave={handleContactSave}
            companies={companies}
            onCompaniesChange={setCompanies}
            initialData={contactFormInitialData}
        />
    }
  </>
  );
}
