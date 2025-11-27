
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LoaderCircle,
  Plus,
  Trash2,
  Edit,
  Info,
  GitMerge,
  FileSignature,
  ShieldAlert,
} from 'lucide-react';
import { AccountingPageHeader } from '@/components/accounting/page-header';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
  getIncomeCategories, addIncomeCategory, updateIncomeCategory, deleteIncomeCategory, deleteIncomeCategories,
  getExpenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory, deleteExpenseCategories,
  type IncomeCategory,
  type ExpenseCategory,
} from '@/services/accounting-service';
import { t2125ExpenseCategories, t2125IncomeCategories } from '@/data/standard-expense-categories';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { CategoryTable } from './category-table';

type Category = IncomeCategory | ExpenseCategory;
type CategoryType = 'income' | 'expense';

const standardIncomeCategoryNames = new Set(t2125IncomeCategories.map(c => c.description.toLowerCase().trim()));
const standardExpenseCategoryNames = new Set(t2125ExpenseCategories.map(c => c.description.toLowerCase().trim()));

export function TaxCategoriesView() {
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategory[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedIncomeIds, setSelectedIncomeIds] = useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  const [dialogState, setDialogState] = useState<{
      isOpen: boolean;
      type: CategoryType | null;
      mode: 'add' | 'edit';
      category: Category | null;
  }>({ isOpen: false, type: null, mode: 'add', category: null });
  const [categoryName, setCategoryName] = useState('');

  const [categoryToDelete, setCategoryToDelete] = useState<{ category: Category; type: CategoryType } | null>(null);
  const [bulkDeleteType, setBulkDeleteType] = useState<CategoryType | null>(null);
  
  const [infoDialogState, setInfoDialogState] = useState<{ isOpen: boolean; category: Category | null }>({ isOpen: false, category: null });
  const [explanation, setExplanation] = useState('');

  const [mergeDialogState, setMergeDialogState] = useState<{ isOpen: boolean; category: Category | null, type: CategoryType | null }>({ isOpen: false, category: null, type: null });
  const [mergeTarget, setMergeTarget] = useState('');
  

  const loadData = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const [inc, exp] = await Promise.all([
            getIncomeCategories(user.uid),
            getExpenseCategories(user.uid),
        ]);
        setIncomeCategories(inc);
        setExpenseCategories(exp);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load categories', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openDialog = (type: CategoryType, mode: 'add' | 'edit', category: Category | null = null) => {
    setDialogState({ isOpen: true, type, mode, category });
    setCategoryName(mode === 'edit' && category ? category.name : '');
  };
  
  const handleSave = async () => {
    if (!user || !dialogState.type || !categoryName.trim()) {
        toast({ variant: 'destructive', title: 'Category name is required.' });
        return;
    }

    try {
        if (dialogState.mode === 'add') {
            if (dialogState.type === 'income') {
                const newCat = await addIncomeCategory({ name: categoryName.trim(), userId: user.uid });
                setIncomeCategories(prev => [...prev, newCat].sort((a,b) => a.name.localeCompare(b.name)));
            } else {
                const newCat = await addExpenseCategory({ name: categoryName.trim(), userId: user.uid });
                setExpenseCategories(prev => [...prev, newCat].sort((a,b) => a.name.localeCompare(b.name)));
            }
            toast({ title: 'Category Added' });
        } else if (dialogState.category) { // Edit mode
            if (dialogState.type === 'income') {
                await updateIncomeCategory(dialogState.category.id, { name: categoryName.trim() });
                setIncomeCategories(prev => prev.map(c => c.id === dialogState.category!.id ? {...c, name: categoryName.trim()} : c));
            } else {
                await updateExpenseCategory(dialogState.category.id, { name: categoryName.trim() });
                setExpenseCategories(prev => prev.map(c => c.id === dialogState.category!.id ? {...c, name: categoryName.trim()} : c));
            }
            toast({ title: 'Category Updated' });
        }
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Save failed', description: error.message });
    } finally {
        setDialogState({ isOpen: false, type: null, mode: 'add', category: null });
    }
  };

  const handleDelete = (category: Category, type: CategoryType) => {
      setCategoryToDelete({ category, type });
  };
  
  const handleConfirmDelete = async () => {
      if (!categoryToDelete) return;
      try {
          if (categoryToDelete.type === 'income') {
              await deleteIncomeCategory(categoryToDelete.category.id);
              setIncomeCategories(prev => prev.filter(c => c.id !== categoryToDelete.category.id));
          } else {
              await deleteExpenseCategory(categoryToDelete.category.id);
              setExpenseCategories(prev => prev.filter(c => c.id !== categoryToDelete.category.id));
          }
          toast({ title: 'Category Deleted' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
      } finally {
          setCategoryToDelete(null);
      }
  };
  
  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteType) return;
    try {
        if (bulkDeleteType === 'income') {
            await deleteIncomeCategories(selectedIncomeIds);
            setIncomeCategories(prev => prev.filter(c => !selectedIncomeIds.includes(c.id)));
            toast({ title: 'Income Categories Deleted' });
            setSelectedIncomeIds([]);
        } else {
            await deleteExpenseCategories(selectedExpenseIds);
            setExpenseCategories(prev => prev.filter(c => !selectedExpenseIds.includes(c.id)));
            toast({ title: 'Expense Categories Deleted' });
            setSelectedExpenseIds([]);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Bulk delete failed', description: error.message });
    } finally {
        setBulkDeleteType(null);
    }
  };

  const handleViewInfo = (category: Category) => {
    setInfoDialogState({ isOpen: true, category });
    
    const isStandardIncome = t2125IncomeCategories.find(c => c.description === category.name);
    const isStandardExpense = t2125ExpenseCategories.find(c => c.description === category.name);
    
    if (isStandardIncome) {
        setExplanation(isStandardIncome.explanation);
    } else if (isStandardExpense) {
        setExplanation(isStandardExpense.explanation);
    } else {
        // In a real app, this would be part of the category object fetched from DB
        setExplanation((category as any).explanation || `This is a custom category. Add your explanation here to ensure consistent transaction logging.`);
    }
  };

  const handleSaveExplanation = () => {
    if (!infoDialogState.category) return;
    console.log("Saving explanation for", infoDialogState.category.name, ":", explanation);
    toast({ title: "Explanation Saved (Simulated)" });
    setInfoDialogState({ isOpen: false, category: null });
  };

  const handleMerge = (category: Category, type: CategoryType) => {
    setMergeDialogState({ isOpen: true, category, type });
    setMergeTarget('');
  };

  const handleConfirmMerge = () => {
    if (!mergeDialogState.category || !mergeTarget) return;
    console.log(`Merging "${mergeDialogState.category.name}" into "${mergeTarget}"`);
    toast({ title: "Merge successful (Simulated)" });
    setMergeDialogState({ isOpen: false, category: null, type: null });
  };

  const getMergeOptions = (type: CategoryType | null) => {
    if (type === 'income') {
        return t2125IncomeCategories.map(c => c.description);
    }
    if (type === 'expense') {
        return t2125ExpenseCategories.map(c => c.description);
    }
    return [];
  };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="Tax Categories" hubPath="/accounting/tax" hubLabel="Tax Center" />
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Tax Category Manager</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your income and expense categories to ensure they align with tax forms. Standard CRA categories cannot be edited or deleted.
          </p>
        </header>
        {isLoading ? (
            <div className="flex h-64 items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
                <CategoryTable 
                    title="Income Categories"
                    description="Categories for all business income."
                    categories={incomeCategories}
                    standardCategories={standardIncomeCategoryNames}
                    onAdd={() => openDialog('income', 'add')}
                    onEdit={(cat) => openDialog('income', 'edit', cat)}
                    onDelete={(cat) => handleDelete(cat, 'income')}
                    onMerge={(cat) => handleMerge(cat, 'income')}
                    onViewInfo={handleViewInfo}
                    selectedIds={selectedIncomeIds}
                    onSelectedIdsChange={setSelectedIncomeIds}
                    onBulkDelete={() => setBulkDeleteType('income')}
                />
                 <CategoryTable 
                    title="Expense Categories"
                    description="Categories for all business expenses."
                    categories={expenseCategories}
                    standardCategories={standardExpenseCategoryNames}
                    onAdd={() => openDialog('expense', 'add')}
                    onEdit={(cat) => openDialog('expense', 'edit', cat)}
                    onDelete={(cat) => handleDelete(cat, 'expense')}
                    onMerge={(cat) => handleMerge(cat, 'expense')}
                    onViewInfo={handleViewInfo}
                    selectedIds={selectedExpenseIds}
                    onSelectedIdsChange={setSelectedExpenseIds}
                    onBulkDelete={() => setBulkDeleteType('expense')}
                />
            </div>
        )}
      </div>

      <Dialog open={dialogState.isOpen} onOpenChange={(open) => setDialogState({ ...dialogState, isOpen: open })}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{dialogState.mode === 'add' ? 'Add' : 'Edit'} {dialogState.type} Category</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="category-name">Category Name</Label>
                <Input id="category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }} />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setDialogState({ isOpen: false, type: null, mode: 'add', category: null })}>Cancel</Button>
                  <Button onClick={handleSave}>Save</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the category "{categoryToDelete?.category.name}". This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!bulkDeleteType} onOpenChange={() => setBulkDeleteType(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the selected {bulkDeleteType === 'income' ? selectedIncomeIds.length : selectedExpenseIds.length} categories. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={infoDialogState.isOpen} onOpenChange={(open) => setInfoDialogState({ ...infoDialogState, isOpen: open })}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{infoDialogState.category?.name}</DialogTitle>
                  <DialogDescription>View or edit the explanation for this category.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={6} />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setInfoDialogState({ isOpen: false, category: null })}>Cancel</Button>
                  <Button onClick={handleSaveExplanation}>Save</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Dialog open={mergeDialogState.isOpen} onOpenChange={(open) => setMergeDialogState({ ...mergeDialogState, isOpen: open })}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Merge Category</DialogTitle>
                <DialogDescription>
                    Merge "{mergeDialogState.category?.name}" into a standard category. All transactions will be reassigned. This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
             <div className="py-4">
                <Label htmlFor="merge-target">Target Category</Label>
                <Select value={mergeTarget} onValueChange={setMergeTarget}>
                    <SelectTrigger><SelectValue placeholder="Select a standard category..." /></SelectTrigger>
                    <SelectContent>
                        {getMergeOptions(mergeDialogState.type).map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setMergeDialogState({ isOpen: false, category: null, type: null })}>Cancel</Button>
                <Button onClick={handleConfirmMerge} disabled={!mergeTarget} variant="destructive">Merge</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
