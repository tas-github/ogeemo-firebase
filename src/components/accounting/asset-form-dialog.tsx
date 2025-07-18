
"use client";

import { useEffect, useState } from "react";
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
import type { Asset } from "@/services/accounting-service";


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
  undepreciatedCapitalCost: '',
};

export function AssetFormDialog({ isOpen, onOpenChange, onSave, assetToEdit }: AssetFormDialogProps) {
  const [formData, setFormData] = useState(emptyAssetForm);
  const { toast } = useToast();

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
        undepreciatedCapitalCost: String(assetToEdit.undepreciatedCapitalCost),
      });
    } else if (!assetToEdit && isOpen) {
      setFormData(emptyAssetForm);
    }
  }, [assetToEdit, isOpen]);

  const handleSave = () => {
    const costNum = parseFloat(formData.cost);
    const uccNum = assetToEdit ? parseFloat(formData.undepreciatedCapitalCost) : costNum;

    if (!formData.name.trim() || !formData.purchaseDate || isNaN(costNum) || costNum <= 0 || isNaN(uccNum) || uccNum < 0) {
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
      undepreciatedCapitalCost: uccNum,
    };

    if (assetToEdit) {
      onSave({ ...assetToEdit, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
    onOpenChange(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{assetToEdit ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          <DialogDescription>
            {assetToEdit ? 'Update the details for your capital asset.' : 'Enter the details for your new capital asset.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
              <Input id="cost" type="number" placeholder="0.00" value={formData.cost} onChange={handleChange} />
            </div>
             {assetToEdit && (
                <div className="space-y-2">
                    <Label htmlFor="undepreciatedCapitalCost">Undepreciated Capital Cost</Label>
                    <Input id="undepreciatedCapitalCost" type="number" placeholder="0.00" value={formData.undepreciatedCapitalCost} onChange={handleChange} />
                </div>
             )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{assetToEdit ? 'Save Changes' : 'Add Asset'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
