
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
import { format, addDays } from 'date-fns';
import { Plus, Trash2, Printer, Save, Mail, Info, LoaderCircle, FileText, Pencil, ChevronsUpDown, Check, FolderPlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AccountingPageHeader } from './page-header';
import { Logo } from '../logo';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { getContacts, type FolderData } from '@/services/contact-service';
import { getFolders } from '@/services/file-manager-folders';
import { 
    addInvoiceWithLineItems, 
    updateInvoiceWithLineItems, 
    getInvoices, 
    getInvoiceById, 
    getLineItemsForInvoice, 
    getCompanies,
    addCompany,
    getServiceItems,
    addServiceItem,
    type Company,
    type Invoice, 
    type InvoiceLineItem, 
    type ServiceItem
} from '@/services/accounting-service';
import ContactFormDialog from '../contacts/contact-form-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import type { Contact } from '@/data/contacts';


// Types
interface CustomLineItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

interface TaxItem {
    id: number;
    name: string;
    rate: number;
}

interface InvoiceTemplate {
  name: string;
  items: CustomLineItem[];
}

// LocalStorage Keys
const INVOICE_TEMPLATES_KEY = 'invoiceTemplates';
const EDIT_INVOICE_ID_KEY = 'editInvoiceId';
const INVOICE_FROM_REPORT_KEY = 'invoiceFromReportData';


export function InvoiceGeneratorView() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // State hooks
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(101);

  const [invoiceToEditId, setInvoiceToEditId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  
  const [customItems, setCustomItems] = useState<CustomLineItem[]>([]);
  
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  
  const [taxes, setTaxes] = useState<TaxItem[]>([]);
  const [invoiceNotes, setInvoiceNotes] = useState('Thank you for your business!');

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);

  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactFolders, setContactFolders] = useState<FolderData[]>([]);

  // States for comboboxes
  const [isCompanyPopoverOpen, setIsCompanyPopoverOpen] = useState(false);
  const [isContactPopoverOpen, setIsContactPopoverOpen] = useState(false);

  // States for 'Add New' dialogs
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  
  const [isNewServiceItemDialogOpen, setIsNewServiceItemDialogOpen] = useState(false);
  const [newServiceItemDesc, setNewServiceItemDesc] = useState("");
  const [newServiceItemPrice, setNewServiceItemPrice] = useState<number | ''>('');
  
  const printRef = useRef<HTMLDivElement>(null);

  const clearInvoice = useCallback(() => {
    setCustomItems([]);
    setSelectedContactId('');
    setSelectedCompanyId('');
    setTaxes([]);
    setInvoiceNumber(`INV-${nextInvoiceNumber}`);
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
    setInvoiceNotes('Thank you for your business!');
    setInvoiceToEditId(null);
    localStorage.removeItem(EDIT_INVOICE_ID_KEY);
    sessionStorage.removeItem(INVOICE_FROM_REPORT_KEY);
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
            const reportDataRaw = sessionStorage.getItem(INVOICE_FROM_REPORT_KEY);

            const [fetchedContacts, fetchedCompanies, fetchedServiceItems, fetchedContactFolders] = await Promise.all([
                getContacts(user.uid),
                getCompanies(user.uid),
                getServiceItems(user.uid),
                getFolders(user.uid),
            ]);
            setContacts(fetchedContacts);
            setCompanies(fetchedCompanies);
            setServiceItems(fetchedServiceItems);
            setContactFolders(fetchedContactFolders);

            const savedTemplatesRaw = localStorage.getItem(INVOICE_TEMPLATES_KEY);
            if (savedTemplatesRaw) {
                setTemplates(JSON.parse(savedTemplatesRaw));
            }
            
            if (reportDataRaw) {
                const reportData = JSON.parse(reportDataRaw);
                setSelectedContactId(reportData.contactId);
                const itemsFromReport = reportData.lineItems.map((item: any) => ({
                    ...item,
                    id: Date.now() + Math.random(),
                }));
                setCustomItems(itemsFromReport);
                sessionStorage.removeItem(INVOICE_FROM_REPORT_KEY); // Clear after use
            } else if (editId) {
                setInvoiceToEditId(editId);
                const [invoiceToLoad, itemsToLoad] = await Promise.all([
                    getInvoiceById(editId),
                    getLineItemsForInvoice(editId)
                ]);

                if (invoiceToLoad) {
                    setInvoiceNumber(invoiceToLoad.invoiceNumber);
                    const companyMatch = fetchedCompanies.find(c => c.name === invoiceToLoad.companyName);
                    if(companyMatch) setSelectedCompanyId(companyMatch.id);
                    setSelectedContactId(invoiceToLoad.contactId);
                    setInvoiceDate(format(new Date(invoiceToLoad.invoiceDate), 'yyyy-MM-dd'));
                    setDueDate(format(new Date(invoiceToLoad.dueDate), 'yyyy-MM-dd'));
                    if (invoiceToLoad.taxType && invoiceToLoad.taxRate) {
                        setTaxes([{ id: 1, name: invoiceToLoad.taxType, rate: invoiceToLoad.taxRate }]);
                    } else {
                        setTaxes([]);
                    }
                    setInvoiceNotes(invoiceToLoad.notes || '');
                    setCustomItems(itemsToLoad.map((item, index) => ({
                        id: Date.now() + index,
                        description: item.description,
                        quantity: item.quantity,
                        price: item.price
                    })));
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not find the invoice to edit.' });
                    clearInvoice();
                }
            }
            
            const fetchedInvoices = await getInvoices(user.uid);
            const maxInvoiceNum = fetchedInvoices.reduce((max, inv) => {
                const num = parseInt(inv.invoiceNumber.replace(/\D/g, ''), 10);
                return isNaN(num) ? max : Math.max(max, num);
            }, 0);
            const nextNum = maxInvoiceNum > 0 ? maxInvoiceNum + 1 : 101;
            setNextInvoiceNumber(nextNum);

            if (!editId && !reportDataRaw) {
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

  useEffect(() => {
    return () => {
      localStorage.removeItem(EDIT_INVOICE_ID_KEY);
    }
  }, []);
  
  const selectedContact = useMemo(() => contacts.find(c => c.id === selectedContactId), [contacts, selectedContactId]);
  const selectedCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId), [companies, selectedCompanyId]);
  
  const filteredContacts = useMemo(() => {
    if (!selectedCompanyId || !selectedCompany) return contacts;
    return contacts.filter(contact => contact.businessName === selectedCompany.name);
  }, [contacts, selectedCompanyId, selectedCompany]);


  const addCustomItem = () => {
    setCustomItems([...customItems, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };

  const addPredefinedItem = (itemValue: string) => {
    const itemToAdd = serviceItems.find(i => i.description === itemValue);
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
  
  const addTax = () => setTaxes(prev => [...prev, { id: Date.now(), name: '', rate: 0 }]);
  const removeTax = (id: number) => setTaxes(prev => prev.filter(tax => tax.id !== id));
  const updateTax = (id: number, field: keyof Omit<TaxItem, 'id'>, value: string | number) => {
    setTaxes(prev => prev.map(tax => tax.id === id ? {...tax, [field]: value} : tax));
  };

  const subtotal = useMemo(() => {
    return customItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
  }, [customItems]);

  const taxAmount = useMemo(() => {
    return taxes.reduce((acc, tax) => {
        if (tax.rate > 0) {
            return acc + (subtotal * (tax.rate / 100));
        }
        return acc;
    }, 0);
  }, [subtotal, taxes]);

  const total = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const handlePrint = () => {
    window.print();
  };
  
  const handleSaveInvoice = async () => {
    if (!user) { toast({ variant: "destructive", title: "Authentication error" }); return; }
    if (!selectedCompany) { toast({ variant: 'destructive', title: 'Company Name Required', description: 'Please select or create a company.' }); return; }
    if (!selectedContact) { toast({ variant: 'destructive', title: 'Contact Person Required', description: 'Please select a contact.' }); return; }
    if (customItems.length === 0) { toast({ variant: 'destructive', title: 'Empty Invoice', description: 'Please add at least one line item.' }); return; }
    
    const lineItemsToSave: Omit<InvoiceLineItem, 'id' | 'invoiceId'>[] = customItems.map(({ id, ...item }) => item);
    
    const primaryTax = taxes[0] || { name: 'none', rate: 0 };

    try {
        if (invoiceToEditId) {
            const invoiceDataToUpdate = {
                invoiceNumber,
                companyName: selectedCompany.name,
                contactId: selectedContact.id,
                originalAmount: total,
                dueDate: new Date(dueDate),
                invoiceDate: new Date(invoiceDate),
                status: 'outstanding' as 'outstanding',
                notes: invoiceNotes,
                taxRate: primaryTax.rate,
                taxType: primaryTax.name,
            };
            await updateInvoiceWithLineItems(invoiceToEditId, invoiceDataToUpdate, lineItemsToSave);
            toast({ title: "Invoice Updated", description: `Invoice ${invoiceNumber} has been saved.` });
        } else {
            const newInvoiceData: Omit<Invoice, 'id' | 'createdAt'> = {
                invoiceNumber,
                companyName: selectedCompany.name,
                contactId: selectedContact.id,
                originalAmount: total,
                amountPaid: 0,
                dueDate: new Date(dueDate),
                invoiceDate: new Date(invoiceDate),
                status: 'outstanding',
                notes: invoiceNotes,
                taxRate: primaryTax.rate,
                taxType: primaryTax.name,
                userId: user.uid,
            };
            await addInvoiceWithLineItems(newInvoiceData, lineItemsToSave);
            toast({ title: "Invoice Saved", description: `Invoice ${invoiceNumber} has been saved.` });
        }
        
        router.push('/accounting/accounts-receivable');
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

  const handleCreateCompany = async () => {
      if (!user || !newCompanyName.trim()) return;
      try {
          const newCompany = await addCompany({ name: newCompanyName.trim(), userId: user.uid });
          setCompanies(prev => [...prev, newCompany]);
          setSelectedCompanyId(newCompany.id);
          toast({ title: "Company Created" });
          setIsNewCompanyDialogOpen(false);
          setNewCompanyName("");
      } catch (error: any) {
          toast({ variant: "destructive", title: "Failed to create company", description: error.message });
      }
  };
  
  const handleContactSave = (savedContact: Contact, isEditing: boolean) => {
    if (isEditing) {
        setContacts(prev => prev.map(c => c.id === savedContact.id ? savedContact : c));
    } else {
        setContacts(prev => [...prev, savedContact]);
    }
    setSelectedContactId(savedContact.id);
    const companyMatch = companies.find(c => c.name === savedContact.businessName);
    if (companyMatch) {
        setSelectedCompanyId(companyMatch.id);
    } else if (savedContact.businessName) {
        // If company doesn't exist, create it.
        addCompany({ name: savedContact.businessName, userId: user!.uid }).then(newCompany => {
            setCompanies(prev => [...prev, newCompany]);
            setSelectedCompanyId(newCompany.id);
        });
    }
    setIsContactFormOpen(false);
  };
  
  const handleSelectContact = (contact: Contact) => {
    setSelectedContactId(contact.id);
    if (contact.businessName) {
        const company = companies.find(c => c.name === contact.businessName);
        if (company) {
            setSelectedCompanyId(company.id);
        }
    }
    setIsContactPopoverOpen(false);
  };
  
  const handleSelectCompany = (company: Company) => {
    setSelectedCompanyId(company.id);
    setIsCompanyPopoverOpen(false);
    // Clear contact if it doesn't belong to the new company
    if (selectedContact && selectedContact.businessName !== company.name) {
      setSelectedContactId('');
    }
  };
  
  const handleSaveServiceItem = async () => {
      if (!user || !newServiceItemDesc.trim() || newServiceItemPrice === '') return;
      
      try {
          const newItem = await addServiceItem({
              description: newServiceItemDesc,
              price: Number(newServiceItemPrice),
              userId: user.uid,
          });
          setServiceItems(prev => [...prev, newItem]);
          toast({ title: "Service Item Saved" });
          setNewServiceItemDesc("");
          setNewServiceItemPrice('');
          setIsNewServiceItemDialogOpen(false);
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
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
    <ScrollArea className="h-full">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Popover open={isCompanyPopoverOpen} onOpenChange={setIsCompanyPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {selectedCompany?.name || "Select a company..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search company..." />
                                <CommandList>
                                    <CommandEmpty>
                                        <Button variant="link" onClick={() => { setIsCompanyPopoverOpen(false); setIsNewCompanyDialogOpen(true); }}>
                                            <Plus className="mr-2 h-4 w-4"/> Create New Company
                                        </Button>
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {companies.map(c => (
                                            <CommandItem key={c.id} value={c.name} onSelect={() => handleSelectCompany(c)}>
                                                <Check className={cn("mr-2 h-4 w-4", selectedCompanyId === c.id ? 'opacity-100' : 'opacity-0')} />
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
                      <Label htmlFor="contact-person-select">Contact Person</Label>
                       <Popover open={isContactPopoverOpen} onOpenChange={setIsContactPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                {selectedContact?.name || "Select a contact..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                             <Command>
                                <CommandInput placeholder="Search contacts..." />
                                <CommandList>
                                    <CommandEmpty>
                                        <Button variant="link" onClick={() => { setIsContactPopoverOpen(false); setIsContactFormOpen(true); }} >
                                            <Plus className="mr-2 h-4 w-4"/> Create New Contact
                                        </Button>
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {filteredContacts.map((c) => (
                                            <CommandItem key={c.id} value={c.name} onSelect={() => handleSelectContact(c)}>
                                                <Check className={cn("mr-2 h-4 w-4", selectedContactId === c.id ? 'opacity-100' : 'opacity-0')} />
                                                {c.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                      </Popover>
                  </div>
              </div>
              <Separator />
              <div>
                  <h4 className="font-semibold text-base mb-2">Add to Invoice</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                          <Label>Add Predefined Item</Label>
                          <div className="flex gap-2">
                            <Select onValueChange={addPredefinedItem}><SelectTrigger><SelectValue placeholder="Select a predefined item..." /></SelectTrigger><SelectContent>{serviceItems.map(item => <SelectItem key={item.id} value={item.description}>{item.description}</SelectItem>)}</SelectContent></Select>
                            <Button variant="outline" onClick={() => setIsNewServiceItemDialogOpen(true)}>New Item</Button>
                          </div>
                      </div>
                       <Button variant="outline" onClick={addCustomItem}><Plus className="mr-2 h-4 w-4"/>Add Custom Line Item</Button>
                  </div>
                  {customItems.length > 0 && (
                      <div className="space-y-3 mt-4">
                          <ScrollArea className="h-40 w-full pr-3 border rounded-md"><div className="p-2 space-y-3">{customItems.map(item => (<div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start"><Textarea placeholder="Item description" value={item.description} onChange={e => updateCustomItem(item.id, 'description', e.target.value)} rows={1} className="min-h-[40px] resize-y" /><div className="space-y-1"><Label htmlFor={`qty-${item.id}`} className="text-xs">Qty</Label><Input id={`qty-${item.id}`} type="number" value={item.quantity} onChange={e => updateCustomItem(item.id, 'quantity', Number(e.target.value))} className="w-20 h-8" /></div><div className="space-y-1"><Label htmlFor={`price-${item.id}`} className="text-xs">$ Rate</Label><Input id={`price-${item.id}`} type="number" value={item.price} onChange={e => updateCustomItem(item.id, 'price', Number(e.target.value))} className="w-24 h-8" /></div><Button variant="ghost" size="icon" onClick={() => removeCustomItem(item.id)} className="self-center mt-3"><Trash2 className="h-4 w-4" /></Button></div>))}</div></ScrollArea>
                      </div>
                  )}
              </div>
              <Separator />
              <div>
                  <h4 className="font-semibold text-base mb-2">Taxes</h4>
                  <div className="space-y-2">
                      {taxes.map(tax => (
                          <div key={tax.id} className="flex items-end gap-2">
                              <div className="flex-1 space-y-1">
                                  <Label htmlFor={`tax-name-${tax.id}`} className="text-xs">Tax Name</Label>
                                  <Input id={`tax-name-${tax.id}`} placeholder="e.g., GST" value={tax.name} onChange={e => updateTax(tax.id, 'name', e.target.value)} />
                              </div>
                              <div className="w-32 space-y-1">
                                  <Label htmlFor={`tax-rate-${tax.id}`} className="text-xs">Rate (%)</Label>
                                  <Input id={`tax-rate-${tax.id}`} type="number" placeholder="5" value={tax.rate || ''} onChange={e => updateTax(tax.id, 'rate', Number(e.target.value))} />
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeTax(tax.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addTax}><Plus className="mr-2 h-4 w-4" /> Add Tax</Button>
                  </div>
              </div>
               {templates.length > 0 && (
                <>
                    <Separator />
                    <div className="space-y-2">
                        <Label>Apply a Template</Label>
                        <Select onValueChange={applyTemplate}><SelectTrigger><SelectValue placeholder="Select a template to apply..." /></SelectTrigger><SelectContent>{templates.map((template, index) => (<SelectItem key={index} value={template.name}>{template.name} ({template.items.length} items)</SelectItem>))}</SelectContent></Select>
                    </div>
                </>
               )}
                <Separator />
                <div className="space-y-2">
                    <Label htmlFor="invoice-notes-input">Notes / Terms</Label>
                    <Textarea
                        id="invoice-notes-input"
                        placeholder="e.g., Thank you for your business! Payment is due within 14 days."
                        value={invoiceNotes}
                        onChange={(e) => setInvoiceNotes(e.target.value)}
                        rows={3}
                    />
                </div>
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
                    <section className="flex justify-between mt-6"><div><h2 className="font-bold text-gray-500 uppercase mb-2">Bill To</h2>{selectedCompany ? (<><p className="font-bold text-lg">{selectedCompany.name}</p><p>{selectedContact?.name}</p><p>{selectedContact?.email}</p></>) : (<p className="text-gray-500">Select a client</p>)}</div><div className="text-right"><p><span className="font-bold text-gray-500">Invoice Date:</span> <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="inline-block w-40 p-0 h-auto border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></p><p><span className="font-bold text-gray-500">Due Date:</span> <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="inline-block w-40 p-0 h-auto border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></p></div></section>
                    <section className="mt-8"><Table className="text-sm"><TableHeader className="bg-gray-100"><TableRow><TableHead className="w-1/2 text-gray-600">Description</TableHead><TableHead className="text-center text-gray-600">Rate / Price</TableHead><TableHead className="text-center text-gray-600">Qty</TableHead><TableHead className="text-right text-gray-600">Total</TableHead></TableRow></TableHeader><TableBody>{customItems.map((item) => (<TableRow key={item.id}><TableCell className="whitespace-pre-wrap">{item.description}</TableCell><TableCell className="text-center">{item.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell><TableCell className="text-center">{item.quantity}</TableCell><TableCell className="text-right">{(item.quantity * item.price).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell></TableRow>))}</TableBody></Table></section>
                    <section className="flex justify-end mt-6"><div className="w-full max-w-sm space-y-2"><div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>{subtotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></div>
                    {taxes.map(tax => (
                        <div key={tax.id} className="flex justify-between"><span className="text-gray-500">{tax.name} ({tax.rate}%)</span><span>{(subtotal * tax.rate / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></div>
                    ))}
                    <Separator /><div className="flex justify-between font-bold text-lg"><span className="text-gray-600">Total Due:</span><span>{total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></div></div></section>
                    <footer className="mt-12 pt-6 border-t">
                        <div className="text-xs text-gray-600 text-center whitespace-pre-wrap">{invoiceNotes}</div>
                    </footer>
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
    </ScrollArea>
    
    <ContactFormDialog
        isOpen={isContactFormOpen}
        onOpenChange={setIsContactFormOpen}
        contactToEdit={null}
        folders={contactFolders}
        onSave={handleContactSave}
    />
    
    <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>Add a new company to your database. This can be used across multiple invoices.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="new-company-name">Company Name</Label>
                <Input id="new-company-name" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateCompany()} />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsNewCompanyDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateCompany}>Create</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
    <Dialog open={isNewServiceItemDialogOpen} onOpenChange={setIsNewServiceItemDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Predefined Item</DialogTitle>
                <DialogDescription>Create a reusable item for your invoices.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="service-item-desc">Description</Label>
                    <Input id="service-item-desc" value={newServiceItemDesc} onChange={e => setNewServiceItemDesc(e.target.value)} placeholder="e.g., Hourly Consulting Rate" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="service-item-price">Price</Label>
                    <Input id="service-item-price" type="number" value={newServiceItemPrice} onChange={e => setNewServiceItemPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="100.00" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsNewServiceItemDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveServiceItem}>Save Item</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </>
  );
}
