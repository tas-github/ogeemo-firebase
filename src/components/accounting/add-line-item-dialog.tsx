
'use client';

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { type ServiceItem, type TaxType } from '@/services/accounting-service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ManageTaxTypesDialog } from './manage-tax-types-dialog';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxType?: string;
  taxRate?: number;
}

interface AddLineItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  itemToEdit: LineItem | null;
  onSave: (newItem: LineItem) => void;
  serviceItems: ServiceItem[];
  onSaveRepeatable: (item: Omit<ServiceItem, 'id' | 'userId'>) => void;
  taxTypes: TaxType[];
  onTaxTypesChange: (taxTypes: TaxType[]) => void;
}

export function AddLineItemDialog({
  isOpen,
  onOpenChange,
  itemToEdit,
  onSave,
  serviceItems,
  onSaveRepeatable,
  taxTypes,
  onTaxTypesChange,
}: AddLineItemDialogProps) {
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [price, setPrice] = useState<number | ''>('');
  const [taxType, setTaxType] = useState('');
  const [taxRate, setTaxRate] = useState<number | ''>('');
  const [saveAsRepeatable, setSaveAsRepeatable] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTaxTypePopoverOpen, setIsTaxTypePopoverOpen] = useState(false);
  const [isManageTaxDialogOpen, setIsManageTaxDialogOpen] = useState(false);

  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
        if (itemToEdit) {
            setDescription(itemToEdit.description);
            setQuantity(itemToEdit.quantity);
            setPrice(itemToEdit.price);
            setTaxType(itemToEdit.taxType || '');
            setTaxRate(itemToEdit.taxRate || '');
        } else {
            setDescription('');
            setQuantity(1);
            setPrice('');
            setTaxType('');
            setTaxRate('');
        }
        setSaveAsRepeatable(false);
    }
  }, [isOpen, itemToEdit]);

  const handleSave = () => {
    const numQuantity = Number(quantity);
    const numPrice = Number(price);
    
    if (!description.trim() || isNaN(numQuantity) || numQuantity <= 0 || isNaN(numPrice) || numPrice < 0) {
        toast({
            variant: 'destructive',
            title: 'Invalid Input',
            description: 'Please ensure description, quantity, and price are valid.'
        });
        return;
    }
    
    const newItem: LineItem = {
        id: itemToEdit?.id || `item_${Date.now()}`,
        description: description.trim(),
        quantity: numQuantity,
        price: numPrice,
        taxType: taxType.trim(),
        taxRate: Number(taxRate) || 0,
    };
    
    onSave(newItem);

    if (saveAsRepeatable) {
        onSaveRepeatable({
            description: newItem.description,
            price: newItem.price,
            taxType: newItem.taxType,
            taxRate: newItem.taxRate,
        });
    }

    onOpenChange(false);
  };

  const handleSelectServiceItem = (item: ServiceItem) => {
    setDescription(item.description);
    setPrice(item.price);
    setTaxType(item.taxType || '');
    setTaxRate(item.taxRate || '');
    setIsSearchOpen(false);
  };

  const handleSelectTaxType = (taxType: TaxType) => {
    setTaxType(taxType.name);
    setTaxRate(taxType.rate);
    setIsTaxTypePopoverOpen(false);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{itemToEdit ? 'Edit Invoice Item' : 'Add Invoice Item'}</DialogTitle>
          <DialogDescription>
            {itemToEdit ? 'Update the details for this line item.' : 'Search for a repeatable item or enter new details below.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            {!itemToEdit && (
                <div className="space-y-2">
                    <Label>Search Repeatable Items</Label>
                    <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                                Search for an item...
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search items..." />
                                <CommandList>
                                    <CommandEmpty>No item found.</CommandEmpty>
                                    <CommandGroup>
                                        {serviceItems.map(item => (
                                            <CommandItem
                                                key={item.id}
                                                value={item.description}
                                                onSelect={() => handleSelectServiceItem(item)}
                                            >
                                                {item.description}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Service or product description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  className="pl-7"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="taxType">Tax Type</Label>
                 <div className="flex gap-2">
                    <Popover open={isTaxTypePopoverOpen} onOpenChange={setIsTaxTypePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                                {taxType || 'Select a tax type...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search tax types..." />
                                <CommandList>
                                    <CommandEmpty>No tax type found.</CommandEmpty>
                                    <CommandGroup>
                                        {taxTypes.map(type => (
                                            <CommandItem key={type.id} value={type.name} onSelect={() => handleSelectTaxType(type)}>
                                                <Check className={cn("mr-2 h-4 w-4", taxType === type.name ? "opacity-100" : "opacity-0")}/>
                                                {type.name} ({type.rate}%)
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" onClick={() => setIsManageTaxDialogOpen(true)}>
                        <Settings className="h-4 w-4"/>
                    </Button>
                 </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  placeholder="e.g., 15"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value === '' ? '' : Number(e.target.value))}
                />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="save-repeatable" checked={saveAsRepeatable} onCheckedChange={(checked) => setSaveAsRepeatable(!!checked)} />
            <Label htmlFor="save-repeatable">Save as a repeatable item</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{itemToEdit ? 'Save Changes' : 'Add Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <ManageTaxTypesDialog
        isOpen={isManageTaxDialogOpen}
        onOpenChange={setIsManageTaxDialogOpen}
        taxTypes={taxTypes}
        onTaxTypesChange={onTaxTypesChange}
    />
    </>
  );
}
