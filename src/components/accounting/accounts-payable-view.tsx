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
import { PlusCircle, MoreVertical, Pencil, Trash2, HandCoins } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

// Types
interface PayableBill {
  id: string;
  vendor: string;
  invoiceNumber: string;
  dueDate: string;
  amount: number;
  category: string;
  description: string;
}

interface ExpenseTransaction {
  id: string;
  date: string;
  company: string;
  description: string;
  amount: number;
  category: string;
  explanation: string;
  documentNumber: string;
  type: "business" | "personal";
}

// LocalStorage Keys
const PAYABLE_LEDGER_KEY = "accountingPayableLedger";
const EXPENSE_LEDGER_KEY = "accountingExpenseLedger"; // Re-using from other components
const EXPENSE_CATEGORIES_KEY = "accountingExpenseCategories";
const COMPANIES_KEY = "accountingCompanies";

// Mock Data for initialization
const initialPayableData: PayableBill[] = [
  { id: "bill_1", vendor: "Cloud Hosting Inc.", invoiceNumber: "CH-98765", dueDate: "2024-08-01", amount: 150, category: "Utilities", description: "Monthly server maintenance" },
  { id: "bill_2", vendor: "SaaS Tools Co.", invoiceNumber: "STC-11223", dueDate: "2024-08-15", amount: 75.99, category: "Software", description: "Team software licenses" },
  { id: "bill_3", vendor: "Jane Designs", invoiceNumber: "INV-JD-001", dueDate: "2024-07-30", amount: 800, category: "Contractors", description: "New logo design" },
];

const defaultExpenseCategories = ["Utilities", "Software", "Office Supplies", "Contractors", "Marketing", "Travel", "Meals"];
const defaultCompanies = ["Cloud Hosting Inc.", "SaaS Tools Co.", "Jane Designs", "Office Supply Hub"];
const emptyBillForm = { vendor: '', invoiceNumber: '', dueDate: '', amount: '', category: '', description: '' };

export function AccountsPayableView() {
  const [payableLedger, setPayableLedger] = React.useState<PayableBill[]>([]);
  const [expenseCategories, setExpenseCategories] = React.useState<string[]>([]);
  const [companies, setCompanies] = React.useState<string[]>([]);
  
  const [isBillDialogOpen, setIsBillDialogOpen] = React.useState(false);
  const [billToEdit, setBillToEdit] = React.useState<PayableBill | null>(null);
  const [billToDelete, setBillToDelete] = React.useState<PayableBill | null>(null);
  const [newBill, setNewBill] = React.useState(emptyBillForm);

  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const savedPayables = localStorage.getItem(PAYABLE_LEDGER_KEY);
      setPayableLedger(savedPayables ? JSON.parse(savedPayables) : initialPayableData);
      
      const savedExpenseCats = localStorage.getItem(EXPENSE_CATEGORIES_KEY);
      setExpenseCategories(savedExpenseCats ? JSON.parse(savedExpenseCats) : defaultExpenseCategories);
      
      const savedCompanies = localStorage.getItem(COMPANIES_KEY);
      setCompanies(savedCompanies ? JSON.parse(savedCompanies) : defaultCompanies);
    } catch (error) {
        console.error("Failed to load A/P data from localStorage", error);
    }
  }, []);
  
  const totalPayableAmount = React.useMemo(() => {
    return payableLedger.reduce((sum, bill) => sum + bill.amount, 0);
  }, [payableLedger]);

  const updatePayableLedger = (updatedLedger: PayableBill[]) => {
      setPayableLedger(updatedLedger);
      localStorage.setItem(PAYABLE_LEDGER_KEY, JSON.stringify(updatedLedger));
  };
  
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
  
  const handleSaveBill = () => {
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

      if (billToEdit) {
          updatePayableLedger(payableLedger.map(item => item.id === billToEdit.id ? { ...item, ...billData } : item));
          toast({ title: "Bill Updated" });
      } else {
          const newEntry: PayableBill = { id: `bill_${Date.now()}`, ...billData };
          updatePayableLedger([newEntry, ...payableLedger]);
          toast({ title: "Bill Added" });
      }
      
      setIsBillDialogOpen(false);
  };
  
  const handleRecordPayment = (bill: PayableBill) => {
      try {
          // Add to expense ledger
          const expenseLedgerRaw = localStorage.getItem(EXPENSE_LEDGER_KEY);
          const expenseLedger: ExpenseTransaction[] = expenseLedgerRaw ? JSON.parse(expenseLedgerRaw) : [];
          
          const newExpense: ExpenseTransaction = {
              id: `exp_pmt_${bill.id}_${Date.now()}`,
              date: format(new Date(), 'yyyy-MM-dd'),
              company: bill.vendor,
              description: bill.description || `Payment for Invoice #${bill.invoiceNumber}`,
              amount: bill.amount,
              category: bill.category,
              explanation: `Paid bill from A/P on ${format(new Date(), 'PP')}`,
              documentNumber: bill.invoiceNumber,
              type: 'business',
          };
          const updatedExpenseLedger = [newExpense, ...expenseLedger];
          localStorage.setItem(EXPENSE_LEDGER_KEY, JSON.stringify(updatedExpenseLedger));
          
          // Remove from payable ledger
          updatePayableLedger(payableLedger.filter(b => b.id !== bill.id));

          toast({ title: "Payment Recorded", description: `Bill from ${bill.vendor} marked as paid and moved to expenses.` });
      } catch (error) {
           console.error("Failed to record payment:", error);
           toast({ variant: 'destructive', title: 'Error', description: 'Could not record payment.' });
      }
  };

  const handleConfirmDelete = () => {
      if (!billToDelete) return;
      updatePayableLedger(payableLedger.filter(b => b.id !== billToDelete.id));
      toast({ title: 'Bill Deleted', variant: 'destructive' });
      setBillToDelete(null);
  };
  
  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <AccountingPageHeader pageTitle="Accounts Payable" />
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Accounts Payable</h1>
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
