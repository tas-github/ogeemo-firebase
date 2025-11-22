
"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreVertical, Pencil, Trash2, LoaderCircle } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { getTaxTypes, addTaxType, updateTaxType, deleteTaxType, type TaxType } from '@/services/accounting-service';


export default function TaxView() {
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taxTypeToEdit, setTaxTypeToEdit] = useState<TaxType | null>(null);
  const [taxTypeToDelete, setTaxTypeToDelete] = useState<TaxType | null>(null);
  const [formData, setFormData] = useState({ name: '', rate: '' });

  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    const loadData = async () => {
        setIsLoading(true);
        try {
            const fetchedData = await getTaxTypes(user.uid);
            setTaxTypes(fetchedData);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load tax types', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, [user, toast]);

  const handleOpenDialog = (taxType?: TaxType) => {
      if (taxType) {
          setTaxTypeToEdit(taxType);
          setFormData({ name: taxType.name, rate: String(taxType.rate) });
      } else {
          setTaxTypeToEdit(null);
          setFormData({ name: '', rate: '' });
      }
      setIsFormOpen(true);
  };
  
  const handleSave = async () => {
    if (!user) return;
    const rateNum = parseFloat(formData.rate);
    if (!formData.name.trim() || isNaN(rateNum) || rateNum < 0) {
        toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please provide a valid name and a non-negative rate.' });
        return;
    }
    
    const dataToSave = {
        name: formData.name.trim(),
        rate: rateNum,
    };
    
    try {
        if (taxTypeToEdit) {
            await updateTaxType(taxTypeToEdit.id, dataToSave);
            setTaxTypes(prev => prev.map(t => t.id === taxTypeToEdit.id ? { ...t, ...dataToSave } : t));
            toast({ title: 'Tax Type Updated' });
        } else {
            const newTaxType = await addTaxType({ ...dataToSave, userId: user.uid });
            setTaxTypes(prev => [newTaxType, ...prev]);
            toast({ title: 'Tax Type Added' });
        }
        setIsFormOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    }
  };

  const handleConfirmDelete = async () => {
    if (!taxTypeToDelete) return;
    try {
        await deleteTaxType(taxTypeToDelete.id);
        setTaxTypes(prev => prev.filter(t => t.id !== taxTypeToDelete.id));
        toast({ title: 'Tax Type Deleted', variant: 'destructive' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } finally {
        setTaxTypeToDelete(null);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="Tax Center" />
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Tax Center</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your sales tax types and rates.
          </p>
        </header>

        <Card className="max-w-3xl mx-auto">
          <CardHeader className="flex-row justify-between items-start">
            <div>
              <CardTitle>Tax Types</CardTitle>
              <CardDescription>Define the tax rates you use for invoicing.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Tax Type
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
                    <TableHead>Tax Name</TableHead>
                    <TableHead className="text-right">Rate (%)</TableHead>
                    <TableHead className="text-right w-24"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxTypes.length > 0 ? taxTypes.map(taxType => (
                    <TableRow key={taxType.id}>
                      <TableCell className="font-medium">{taxType.name}</TableCell>
                      <TableCell className="text-right font-mono">{taxType.rate}%</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleOpenDialog(taxType)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setTaxTypeToDelete(taxType)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center">No tax types defined yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{taxTypeToEdit ? 'Edit Tax Type' : 'Add New Tax Type'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax-name">Tax Name</Label>
              <Input id="tax-name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} placeholder="e.g., HST" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Rate (%)</Label>
              <Input id="tax-rate" type="number" value={formData.rate} onChange={(e) => setFormData(p => ({...p, rate: e.target.value}))} placeholder="e.g., 15" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{taxTypeToEdit ? 'Save Changes' : 'Add Tax Type'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!taxTypeToDelete} onOpenChange={() => setTaxTypeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the "{taxTypeToDelete?.name}" tax type.</AlertDialogDescription>
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
