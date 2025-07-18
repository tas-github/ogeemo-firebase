
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import type { Asset, DepreciationEntry } from "@/services/accounting-service";
import { PlusCircle, Trash2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";


interface AssetFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (asset: Asset | Omit<Asset, "id" | "userId">) => void;
  assetToEdit: Asset | null;
}

const emptyAssetForm = {
  name: "",
  description: "",
  purchaseDate: format(new Date(), 'yyyy-MM-dd'),
  cost: '',
};

export function AssetFormDialog({ isOpen, onOpenChange, onSave, assetToEdit }: AssetFormDialogProps) {
  const [formData, setFormData] = useState(emptyAssetForm);
  const [depreciationEntries, setDepreciationEntries] = useState<DepreciationEntry[]>([]);
  const [newDepreciation, setNewDepreciation] = useState({ date: format(new Date(), 'yyyy-MM-dd'), amount: '' });
  const { toast } = useToast();

  const currentDepreciatedValue = useMemo(() => {
    if (!assetToEdit) return 0;
    const totalDepreciation = depreciationEntries.reduce((sum, entry) => sum + entry.amount, 0);
    return assetToEdit.cost - totalDepreciation;
  }, [assetToEdit, depreciationEntries]);


  useEffect(() => {
    if (assetToEdit && isOpen) {
      const purchaseDateSource = assetToEdit.purchaseDate;
      let dateToFormat: Date;

      if (typeof purchaseDateSource === 'string') {
        dateToFormat = parseISO(purchaseDateSource);
      } else if (purchaseDateSource instanceof Date) {
        dateToFormat = purchaseDateSource;
      } else {
        dateToFormat = new Date(); // Fallback to today if type is unexpected
      }
      
      if (!isValid(dateToFormat)) {
        dateToFormat = new Date(); // Fallback if parsing fails
      }

      setFormData({
        name: assetToEdit.name,
        description: assetToEdit.description || "",
        purchaseDate: format(dateToFormat, 'yyyy-MM-dd'),
        cost: String(assetToEdit.cost),
      });
      setDepreciationEntries(assetToEdit.depreciationEntries || []);
    } else if (!assetToEdit && isOpen) {
      setFormData(emptyAssetForm);
      setDepreciationEntries([]);
    }
  }, [assetToEdit, isOpen]);

  const handleSave = () => {
    const costNum = parseFloat(formData.cost);

    if (!formData.name.trim() || !formData.purchaseDate || isNaN(costNum) || costNum <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please fill out all required fields with valid data.",
      });
      return;
    }

    const dataToSave = {
      name: formData.name,
      description: formData.description,
      purchaseDate: formData.purchaseDate,
      cost: costNum,
      depreciationEntries: depreciationEntries,
    };

    if (assetToEdit) {
      onSave({ ...assetToEdit, ...dataToSave, undepreciatedCapitalCost: currentDepreciatedValue });
    } else {
      // For new assets, UCC is the same as cost.
      onSave({ ...dataToSave, undepreciatedCapitalCost: costNum });
    }
    onOpenChange(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }
  
  const handleAddDepreciation = () => {
    const amountNum = parseFloat(newDepreciation.amount);
    if (!newDepreciation.date || isNaN(amountNum) || amountNum <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Depreciation', description: 'Please enter a valid date and a positive amount.' });
        return;
    }
    
    if (amountNum > currentDepreciatedValue) {
        toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Depreciation cannot exceed the current value of the asset.' });
        return;
    }

    const newEntry: DepreciationEntry = {
        id: `temp_${Date.now()}`,
        date: newDepreciation.date,
        amount: amountNum,
    };
    setDepreciationEntries(prev => [...prev, newEntry]);
    setNewDepreciation({ date: format(new Date(), 'yyyy-MM-dd'), amount: '' }); // Reset form
  };
  
  const handleDeleteDepreciation = (entryId: string) => {
    setDepreciationEntries(prev => prev.filter(entry => entry.id !== entryId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{assetToEdit ? 'Edit Asset & Depreciation' : 'Add New Asset'}</DialogTitle>
          <DialogDescription>
            {assetToEdit ? 'Update details, view history, and record new depreciation.' : 'Enter the details for your new capital asset.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name</Label>
                <Input id="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input id="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Original Cost</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                    <Input id="cost" type="number" placeholder="0.00" value={formData.cost} onChange={handleChange} className="pl-7" />
                  </div>
                </div>
              </div>
          </div>
          
          {assetToEdit && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Depreciation</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Current Depreciated Value (UCC)</Label>
                        <Input value={currentDepreciatedValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} readOnly disabled />
                    </div>
                 </div>

                <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-base">Record New Depreciation</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="dep-date">Date</Label>
                            <Input id="dep-date" type="date" value={newDepreciation.date} onChange={(e) => setNewDepreciation(p => ({ ...p, date: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dep-amount">Amount</Label>
                             <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                                <Input id="dep-amount" type="number" placeholder="0.00" value={newDepreciation.amount} onChange={(e) => setNewDepreciation(p => ({ ...p, amount: e.target.value }))} className="pl-7" />
                            </div>
                        </div>
                        <Button onClick={handleAddDepreciation}><PlusCircle className="mr-2 h-4 w-4"/> Add</Button>
                    </CardContent>
                </Card>

                <div className="space-y-2">
                    <Label>Depreciation History</Label>
                    <ScrollArea className="h-32 w-full rounded-md border">
                        <div className="p-4">
                            {depreciationEntries.length > 0 ? (
                                depreciationEntries.map(entry => (
                                    <div key={entry.id} className="flex justify-between items-center text-sm mb-2">
                                        <span>{format(parseISO(entry.date), 'PP')}</span>
                                        <span>{entry.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteDepreciation(entry.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No depreciation recorded yet.</p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
              </div>
            </>
          )}

        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{assetToEdit ? 'Save Changes' : 'Add Asset'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
