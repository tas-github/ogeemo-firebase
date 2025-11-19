
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Pencil, Trash2, LoaderCircle } from 'lucide-react';
import { AccountingPageHeader } from '@/components/accounting/page-header';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { getServiceItems, addServiceItem, updateServiceItem, deleteServiceItem, type ServiceItem } from '@/services/accounting-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formatCurrency = (amount: number) => {
  return (amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export default function InvoiceItemsPage() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ServiceItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ServiceItem | null>(null);

  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [taxType, setTaxType] = useState('None');
  const [taxRate, setTaxRate] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();

  const loadItems = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedItems = await getServiceItems(user.uid);
      setItems(fetchedItems);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to load service items", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleOpenDialog = (item: ServiceItem | null = null) => {
    setItemToEdit(item);
    if (item) {
      setDescription(item.description);
      setPrice(String(item.price));
      setTaxType(item.taxType || 'None');
      setTaxRate(String(item.taxRate || ''));
    } else {
      setDescription('');
      setPrice('');
      setTaxType('None');
      setTaxRate('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !description.trim() || !price.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a description and a price.' });
      return;
    }
    const priceNum = parseFloat(price);
    const taxRateNum = parseFloat(taxRate) || 0;
    if (isNaN(priceNum) || priceNum < 0) {
      toast({ variant: 'destructive', title: 'Invalid Price', description: 'Please enter a valid, non-negative price.' });
      return;
    }

    const itemData: Omit<ServiceItem, 'id' | 'userId'> = {
        description,
        price: priceNum,
        taxType,
        taxRate: taxRateNum,
    };

    try {
      if (itemToEdit) {
        await updateServiceItem(itemToEdit.id, itemData);
        toast({ title: 'Item Updated' });
      } else {
        await addServiceItem({ ...itemData, userId: user.uid });
        toast({ title: 'Item Added' });
      }
      loadItems();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteServiceItem(itemToDelete.id);
      loadItems();
      toast({ title: 'Item Deleted', variant: 'destructive' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="Invoice Items" hubPath="/accounting/invoices/create" hubLabel="Create Invoice" />
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Manage Invoice Items</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Create and manage reusable line items for your invoices.
          </p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Service & Product Items</CardTitle>
                <CardDescription>These items will be available in the invoice generator.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <LoaderCircle className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Tax Type</TableHead>
                    <TableHead className="text-right">Tax Rate</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>{item.taxType || 'N/A'}</TableCell>
                      <TableCell className="text-right">{item.taxRate ? `${item.taxRate}%` : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleOpenDialog(item)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setItemToDelete(item)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{itemToEdit ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                <Input id="price" type="number" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-7" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tax-type">Tax Type</Label>
                    <Select value={taxType} onValueChange={setTaxType}>
                        <SelectTrigger id="tax-type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="GST">GST</SelectItem>
                            <SelectItem value="PST">PST</SelectItem>
                            <SelectItem value="HST">HST</SelectItem>
                            <SelectItem value="VAT">VAT</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input id="tax-rate" type="number" placeholder="e.g., 15" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} disabled={taxType === 'None'} />
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the item "{itemToDelete?.description}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    