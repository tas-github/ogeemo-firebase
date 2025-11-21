
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays } from 'date-fns';
import { Plus, Trash2, Printer, Save, Mail, Info, ChevronsUpDown, Check, LoaderCircle, X, FileText, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AccountingPageHeader } from './page-header';
import { Logo } from '../logo';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { getInvoiceById, getLineItemsForInvoice, getServiceItems, type ServiceItem, addInvoiceWithLineItems, updateInvoiceWithLineItems } from '@/services/accounting-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { getFolders as getContactFolders, type FolderData } from '@/services/contact-folder-service';
import { cn } from '@/lib/utils';
import { useReactToPrint } from '@/hooks/use-react-to-print';
import ContactFormDialog from '../contacts/contact-form-dialog';
import AddLineItemDialog from './AddLineItemDialog';
import { getCompanies, addCompany, type Company } from '@/services/accounting-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';


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
const INVOICE_FROM_REPORT_KEY = 'invoiceFromReportData';
const INDIVIDUAL_CONTACTS_ID = 'individual-contacts';


export function InvoiceGeneratorView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  const { handlePrint, contentRef } = useReactToPrint();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactFolders, setContactFolders] = useState<FolderData[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [invoiceToEditId, setInvoiceToEditId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState("Thank you for your business! Payment is due within 14 days.");

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isAddLineItemDialogOpen, setIsAddLineItemDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
          
          const company = companies.find(c => c.name === invoiceData.companyName);
          if (company) {
            setSelectedCompanyId(company.id);
          } else {
            // Check if it's an individual contact
            const contact = contacts.find(c => c.id === invoiceData.contactId && !c.businessName);
            if (contact) {
                setSelectedCompanyId(INDIVIDUAL_CONTACTS_ID);
            }
          }

          // This will trigger the contact dropdown to populate, so we can set the contact.
          setSelectedContactId(invoiceData.contactId);

          setLineItems(lineItemsData.map(item => ({ ...item, id: item.id || `item_${Math.random()}` })));
          
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Failed to load invoice', description: error.message });
      } finally {
          setIsLoading(false);
      }
  }, [toast, companies, contacts]);


  useEffect(() => {
    async function loadData() {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [fetchedCompanies, fetchedContacts, fetchedServiceItems, fetchedFolders] = await Promise.all([
                getCompanies(user.uid),
                getContacts(user.uid),
                getServiceItems(user.uid),
                getContactFolders(user.uid),
            ]);
            setCompanies(fetchedCompanies);
            setContacts(fetchedContacts);
            setServiceItems(fetchedServiceItems);
            setContactFolders(fetchedFolders);

            const invoiceId = localStorage.getItem(EDIT_INVOICE_ID_KEY);
            if (invoiceId) {
                setInvoiceToEditId(invoiceId);
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
  }, [user, toast]);

  useEffect(() => {
    if (invoiceToEditId && companies.length > 0 && contacts.length > 0) {
        loadInvoiceForEditing(invoiceToEditId);
    }
  }, [invoiceToEditId, loadInvoiceForEditing, companies, contacts]);


  const handleAddItem = useCallback((newItem: Omit<LineItem, 'id'>) => {
    setLineItems(prev => [...prev, { id: `new_${Date.now()}`, ...newItem }]);
  }, []);
  
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
        dueDate: new Date(dueDate),
        invoiceDate: new Date(invoiceDate),
        status: 'outstanding' as const,
        notes,
        taxType: 'line-item',
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
    // Logic to update companies if a new one was added via contact form
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
  
  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const isPaid = total <= 0 && lineItems.length > 0;

  const InvoicePreviewContent = React.forwardRef<HTMLDivElement>((props, ref) => (
     <div {...props} ref={ref} className="p-8">
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
                    <p><span className="font-bold text-gray-500">Invoice Date:</span> {format(new Date(invoiceDate), 'PP')}</p>
                    <p><span className="font-bold text-gray-500">Due Date:</span> {format(new Date(dueDate), 'PP')}</p>
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
  ));
  InvoicePreviewContent.displayName = 'InvoicePreviewContent';
  
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
                    <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Invoice</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2 lg:col-span-2">
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
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNumber">Invoice #</Label>
                            <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                        </div>
                         <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-2">
                                <Label htmlFor="invoiceDate">Invoice Date</Label>
                                <Input id="invoiceDate" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                            </div>
                         </div>
                    </div>
                     <div>
                        <Label>Line Items</Label>
                        <div className="border rounded-md mt-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/2">Description</TableHead>
                                        <TableHead className="w-24 text-center">Qty</TableHead>
                                        <TableHead className="w-32 text-right">Price</TableHead>
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
                                            <TableCell className="text-right font-mono">{formatCurrency(item.quantity * item.price)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => setIsAddLineItemDialogOpen(true)} className="mt-2">
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    <Button onClick={handleSendEmail}><Mail className="mr-2 h-4 w-4" /> Email Invoice</Button>
                    <Button variant="ghost" size="sm" onClick={handleClearInvoice}><X className="mr-2 h-4 w-4" /> Clear</Button>
                 </div>
            </CardFooter>
        </Card>
      </div>
    </ScrollArea>

    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0">
            <ScrollArea className="max-h-[90vh]">
                <InvoicePreviewContent />
            </ScrollArea>
        </DialogContent>
    </Dialog>

    <div className="hidden">
      <div id="printable-area">
        <InvoicePreviewContent ref={contentRef} />
      </div>
    </div>

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
    <AddLineItemDialog
        isOpen={isAddLineItemDialogOpen}
        onOpenChange={setIsAddLineItemDialogOpen}
        serviceItems={serviceItems}
        onAddItem={handleAddItem}
    />
  </>
  );
}

    