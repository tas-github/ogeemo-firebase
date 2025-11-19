'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { type ServiceItem } from '@/services/accounting-service';
import { FilePlus } from 'lucide-react';

interface AddLineItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  serviceItems: ServiceItem[];
  onAddItem: (item: { description: string; quantity: number; price: number; taxRate?: number }) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};


export default function AddLineItemDialog({ isOpen, onOpenChange, serviceItems, onAddItem }: AddLineItemDialogProps) {
  const [itemType, setItemType] = useState<'predefined' | 'custom'>('predefined');
  const [selectedServiceItemId, setSelectedServiceItemId] = useState('');
  
  const [customDescription, setCustomDescription] = useState('');
  const [customQuantity, setCustomQuantity] = useState<number | ''>(1);
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [customTaxRate, setCustomTaxRate] = useState<number | ''>('');


  const { toast } = useToast();
  
  const resetState = () => {
    setItemType('predefined');
    setSelectedServiceItemId('');
    setCustomDescription('');
    setCustomQuantity(1);
    setCustomPrice('');
    setCustomTaxRate('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };
  
  const handleAddItem = () => {
    if (itemType === 'predefined') {
      if (!selectedServiceItemId) {
        toast({ variant: 'destructive', title: 'Please select an item.' });
        return;
      }
      const selectedItem = serviceItems.find(item => item.id === selectedServiceItemId);
      if (selectedItem) {
        onAddItem({ description: selectedItem.description, quantity: 1, price: selectedItem.price, taxRate: selectedItem.taxRate || 0 });
      }
    } else { // custom
      if (!customDescription.trim() || !customQuantity || !customPrice) {
        toast({ variant: 'destructive', title: 'Please fill all custom item fields.' });
        return;
      }
      onAddItem({
        description: customDescription.trim(),
        quantity: Number(customQuantity),
        price: Number(customPrice),
        taxRate: Number(customTaxRate) || 0,
      });
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Line Item</DialogTitle>
          <DialogDescription>
            Choose a predefined service or create a new custom item for your invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <RadioGroup value={itemType} onValueChange={(value) => setItemType(value as 'predefined' | 'custom')} className="grid grid-cols-2 gap-4">
            <div>
              <RadioGroupItem value="predefined" id="r1" className="peer sr-only" />
              <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                Predefined Item
              </Label>
            </div>
            <div>
              <RadioGroupItem value="custom" id="r2" className="peer sr-only" />
              <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                Custom Item
              </Label>
            </div>
          </RadioGroup>

          {itemType === 'predefined' ? (
            <div className="space-y-2">
              <Label>Select Service/Product</Label>
              <Select onValueChange={setSelectedServiceItemId} value={selectedServiceItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a predefined item..." />
                </SelectTrigger>
                <SelectContent>
                  {serviceItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.description} ({formatCurrency(item.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-description">Description</Label>
                <Input id="custom-description" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-quantity">Quantity</Label>
                  <Input id="custom-quantity" type="number" value={customQuantity} onChange={(e) => setCustomQuantity(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-price">Price</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                    <Input id="custom-price" type="number" placeholder="0.00" value={customPrice} onChange={(e) => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))} className="pl-7" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-tax">Tax Rate (%)</Label>
                 <Input id="custom-tax" type="number" placeholder="e.g., 15" value={customTaxRate} onChange={(e) => setCustomTaxRate(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button asChild variant="outline">
            <Link href="/accounting/invoice-items" target="_blank">
                <FilePlus className="mr-2 h-4 w-4" /> Manage Predefined Items
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Add to Invoice</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
