
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { type DateRange } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, PlusCircle, Trash2, Printer, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { mockContacts, type Contact } from '@/data/contacts';
import { AccountingPageHeader } from './page-header';
import { Logo } from '../logo';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

// Types
interface EventEntry {
  id: string;
  contactId: string;
  subject: string;
  duration: number; // in seconds
  billableRate: number;
  startTime: string; // ISO string
}

interface CustomLineItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

const formatTime = (totalSeconds: number) => {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export function InvoiceGeneratorView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [loggedEntries, setLoggedEntries] = useState<EventEntry[]>([]);
  const [customItems, setCustomItems] = useState<CustomLineItem[]>([]);
  
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));

  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real app, you would fetch contacts from a service.
    setContacts(mockContacts);
  }, []);

  const fetchLoggedEntries = () => {
    if (!selectedContactId) {
      toast({ variant: 'destructive', title: 'Please select a client.' });
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast({ variant: 'destructive', title: 'Please select a date range.' });
      return;
    }

    try {
      const allEntriesRaw = localStorage.getItem('eventEntries');
      if (!allEntriesRaw) {
        toast({ title: 'No entries found', description: 'There are no logged client activities.' });
        setLoggedEntries([]);
        return;
      }
      
      const allEntries: EventEntry[] = JSON.parse(allEntriesRaw);
      const filtered = allEntries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entry.contactId === selectedContactId &&
               entryDate >= dateRange.from! &&
               entryDate <= dateRange.to!;
      });
      
      setLoggedEntries(filtered);
      toast({ title: `${filtered.length} entries found for the selected client and date range.` });
    } catch (error) {
      console.error("Error fetching logged entries:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch logged entries." });
    }
  };
  
  const addCustomItem = () => {
    setCustomItems([...customItems, { id: Date.now(), description: '', quantity: 1, price: 0 }]);
  };
  
  const updateCustomItem = (id: number, field: keyof Omit<CustomLineItem, 'id'>, value: string | number) => {
    setCustomItems(customItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  const removeCustomItem = (id: number) => {
    setCustomItems(customItems.filter(item => item.id !== id));
  };

  const selectedContact = useMemo(() => contacts.find(c => c.id === selectedContactId), [contacts, selectedContactId]);

  const subtotal = useMemo(() => {
    const timeTotal = loggedEntries.reduce((acc, entry) => acc + (entry.duration / 3600) * entry.billableRate, 0);
    const itemsTotal = customItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    return timeTotal + itemsTotal;
  }, [loggedEntries, customItems]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Invoice Generator" />
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Create an Invoice</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select a client and date range to pull logged activities, add custom items, and generate a professional invoice.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Select Client & Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-select">Client</Label>
                <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                  <SelectTrigger id="client-select"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={1}/>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={fetchLoggedEntries}>Fetch Activities</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Add Custom Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className={cn(customItems.length > 0 && "h-48")}>
                <div className="space-y-4 pr-3">
                    {customItems.map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                        <Input placeholder="Item description" value={item.description} onChange={e => updateCustomItem(item.id, 'description', e.target.value)} />
                        <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateCustomItem(item.id, 'quantity', Number(e.target.value))} className="w-16" />
                        <Input type="number" placeholder="Price" value={item.price} onChange={e => updateCustomItem(item.id, 'price', Number(e.target.value))} className="w-20" />
                        <Button variant="ghost" size="icon" onClick={() => removeCustomItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={addCustomItem}><PlusCircle className="mr-2 h-4 w-4"/> Add Line Item</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Invoice Preview Column */}
        <div className="lg:col-span-2">
            <Card>
                <CardHeader className="flex-row justify-between items-center">
                    <CardTitle>Invoice Preview</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save as Template</Button>
                        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Invoice</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div id="invoice-preview" ref={printRef} className="bg-white text-black p-8 border rounded-lg shadow-sm w-full font-sans">
                        <header className="flex justify-between items-start pb-6 border-b">
                            <Logo className="text-primary"/>
                            <div className="text-right">
                                <h1 className="text-4xl font-bold uppercase text-gray-700">Invoice</h1>
                                <p className="text-gray-500"># <Input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="inline-block w-32 p-0 border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></p>
                            </div>
                        </header>
                        
                        <section className="flex justify-between mt-6">
                            <div>
                                <h2 className="font-bold text-gray-500 uppercase mb-2">Bill To</h2>
                                {selectedContact ? (
                                    <>
                                        <p className="font-bold text-lg">{selectedContact.name}</p>
                                        <p>{selectedContact.email}</p>
                                        <p>{selectedContact.cellPhone || selectedContact.businessPhone}</p>
                                    </>
                                ) : (
                                    <p className="text-gray-500">Select a client</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p><span className="font-bold text-gray-500">Invoice Date:</span> <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="inline-block w-40 p-0 border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></p>
                                <p><span className="font-bold text-gray-500">Due Date:</span> <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="inline-block w-40 p-0 border-0 border-b-2 border-transparent focus:border-gray-300 focus:ring-0" /></p>
                            </div>
                        </section>

                        <section className="mt-8">
                            <Table className="text-sm">
                                <TableHeader className="bg-gray-100">
                                    <TableRow>
                                        <TableHead className="w-1/2 text-gray-600">Description</TableHead>
                                        <TableHead className="text-center text-gray-600">Rate / Price</TableHead>
                                        <TableHead className="text-center text-gray-600">Hours / Qty</TableHead>
                                        <TableHead className="text-right text-gray-600">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loggedEntries.map(entry => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{entry.subject}</TableCell>
                                            <TableCell className="text-center">${entry.billableRate.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">{formatTime(entry.duration)}</TableCell>
                                            <TableCell className="text-right">${((entry.duration / 3600) * entry.billableRate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {customItems.map(item => (
                                         <TableRow key={item.id}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-center">${item.price.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </section>

                        <section className="flex justify-end mt-6">
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span className="text-gray-600">Total Due:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>

                        <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-400">
                            <p>Thank you for your business!</p>
                        </footer>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
