
"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Pencil, Trash2, HandCoins, LoaderCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { getPayableBills, addPayableBill, updatePayableBill, deletePayableBill, addExpenseTransaction, type PayableBill, type ExpenseTransaction } from "@/services/accounting-service";


// TODO: These should be moved to a settings service
const defaultExpenseCategories = ["Utilities", "Software", "Office Supplies", "Contractors", "Marketing", "Travel", "Meals"];
const defaultCompanies = ["Cloud Hosting Inc.", "SaaS Tools Co.", "Jane Designs", "Office Supply Hub"];
const emptyBillForm = { vendor: '', invoiceNumber: '', dueDate: '', amount: '', category: '', description: '' };

export function AccountsPayableView() {
  const [payableLedger, setPayableLedger] = React.useState<PayableBill[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
  
  const [expenseCategories, setExpenseCategories] = React.useState<string[]>(defaultExpenseCategories);
  const [companies, setCompanies] = React.useState<string[]>(defaultCompanies);
  
  const [isBillDialogOpen, setIsBillDialogOpen] = React.useState(false);
  const [billToEdit, setBillToEdit] = React.useState<PayableBill | null>(null);
  const [billToDelete, setBillToDelete] = React.useState<PayableBill | null>(null);
  const [newBill, setNewBill] = React.useState(emptyBillForm);

  const { toast } = useToast();

  React.useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    const loadData = async () => {
        setIsLoading(true);
        try {
            const bills = await getPayableBills(user.uid);
            setPayableLedger(bills);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to load payable bills", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, [user, toast]);
  
  const totalPayableAmount = React.useMemo(() => {
    return payableLedger.reduce((sum, bill) => sum + bill.amount, 0);
  }, [payableLedger]);

  
  const handleOpenBillDialog = (bill?: PayableBill) => {
      if (bill) {
          setBillToEdit(bill);
          setNewBill({ ...bill, amount: String(bill.amount) });
      } else {
          setBillToEdit(null);
          setNewBill(emptyBillForm);
      }
      setIsBillDialogOpen(true);
  };
  
  const handleSaveBill = async () => {
    if (!user) return;
      const amountNum = parseFloat(newBill.amount);
      if (!newBill.vendor || !newBill.dueDate || !newBill.category || !newBill.amount || isNaN(amountNum) || amountNum <= 0) {
          toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill all required fields correctly.' });
          return;
      }
      
      const billData = {
          vendor: newBill.vendor,
          invoiceNumber: newBill.invoiceNumber,
          dueDate: newBill.dueDate,
          amount: amountNum,
          category: newBill.category,
          description: newBill.description,
      };

      try {
        if (billToEdit) {
            await updatePayableBill(billToEdit.id, billData);
            setPayableLedger(prev => prev.map(item => item.id === billToEdit.id ? { ...item, ...billData, id: billToEdit.id, userId: user.uid } : item));
            toast({ title: "Bill Updated" });
        } else {
            const newEntry = await addPayableBill({ ...billData, userId: user.uid });
            setPayableLedger(prev => [newEntry, ...prev]);
            toast({ title: "Bill Added" });
        }
        setIsBillDialogOpen(false);
      } catch (error: any) {
         toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
      }
  };
  
  const handleRecordPayment = async (bill: PayableBill) => {
    if (!user) return;
      try {
          const newExpense: Omit<ExpenseTransaction, 'id'> = {
              date: format(new Date(), 'yyyy-MM-dd'),
              company: bill.vendor,
              description: bill.description || `Payment for Invoice #${bill.invoiceNumber}`,
              amount: bill.amount,
              category: bill.category,
              explanation: `Paid bill from A/P on ${format(new Date(), 'PP')}`,
              documentNumber: bill.invoiceNumber,
              type: 'business',
              userId: user.uid,
          };
          
          await addExpenseTransaction(newExpense);
          await deletePayableBill(bill.id);
          setPayableLedger(prev => prev.filter(b => b.id !== bill.id));

          toast({ title: "Payment Recorded", description: `Bill from ${bill.vendor} marked as paid and moved to expenses.` });
      } catch (error: any) {
           console.error("Failed to record payment:", error);
           toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not record payment.' });
      }
  };

  const handleConfirmDelete = async () => {
      if (!billToDelete) return;
      try {
        await deletePayableBill(billToDelete.id);
        setPayableLedger(prev => prev.filter(b => b.id !== billToDelete.id));
        toast({ title: 'Bill Deleted', variant: 'destructive' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
      } finally {
        setBillToDelete(null);
      }
  };
  
  return (
    <>
      <div className="space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold font-headline text-primary">Accounts Payable</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage and track all outstanding bills from your vendors.
          </p>
        </header>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Bills to Pay</CardTitle>
              <CardDescription>A list of unpaid invoices from vendors.</CardDescription>
            </div>
             <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-2xl font-bold text-destructive">{totalPayableAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button variant="outline" onClick={() => handleOpenBillDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Bill
              </Button>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payableLedger.map(bill => (
                    <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.vendor}</TableCell>
                        <TableCell>{bill.description}</TableCell>
                        <TableCell>{bill.dueDate}</TableCell>
                        <TableCell>{bill.category}</TableCell>
                        <TableCell className="text-right font-mono">
                        {bill.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                        </TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleRecordPayment(bill)}><HandCoins className="mr-2 h-4 w-4"/>Record Payment</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleOpenBillDialog(bill)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setBillToDelete(bill)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
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

      <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{billToEdit ? 'Edit Bill' : 'Add New Bill'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor <span className="text-destructive">*</span></Label>
                <Select value={newBill.vendor} onValueChange={(value) => setNewBill(p => ({ ...p, vendor: value }))}>
                  <SelectTrigger id="vendor"><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date <span className="text-destructive">*</span></Label>
                <Input id="dueDate" type="date" value={newBill.dueDate} onChange={e => setNewBill(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount <span className="text-destructive">*</span></Label>
                <Input id="amount" type="number" placeholder="0.00" value={newBill.amount} onChange={e => setNewBill(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Expense Category <span className="text-destructive">*</span></Label>
                <Select value={newBill.category} onValueChange={(value) => setNewBill(p => ({ ...p, category: value }))}>
                  <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>{expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice / Document #</Label>
                <Input id="invoiceNumber" value={newBill.invoiceNumber} onChange={e => setNewBill(p => ({ ...p, invoiceNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={newBill.description} onChange={e => setNewBill(p => ({ ...p, description: e.target.value }))} />
              </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsBillDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBill}>{billToEdit ? 'Save Changes' : 'Add Bill'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!billToDelete} onOpenChange={() => setBillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this bill from your payable list.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
