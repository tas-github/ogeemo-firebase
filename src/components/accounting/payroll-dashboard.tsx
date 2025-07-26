
"use client";

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Banknote, Rocket, UserPlus, MoreVertical, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { AccountingPageHeader } from './page-header';
import { format, addDays } from 'date-fns';
import { type Employee, type PayrollRun, mockEmployees, mockPayrollRuns } from '@/data/payroll';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { PayrollCraInfo } from './payroll-cra-info';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

type PayrollStep = 'period' | 'hours' | 'review';
type EmployeeFormState = Omit<Employee, 'id' | 'userId'> & { id?: string };

interface EmployeeHours {
    [employeeId: string]: { hours: number | '' };
}

export function PayrollDashboard() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRun[]>(mockPayrollRuns);
  
  // State for the multi-step payroll dialog
  const [isRunPayrollDialogOpen, setIsRunPayrollDialogOpen] = useState(false);
  const [payrollStep, setPayrollStep] = useState<PayrollStep>('period');
  const [employeeHours, setEmployeeHours] = useState<EmployeeHours>(() => {
    const initialHours: EmployeeHours = {};
    mockEmployees.forEach(emp => {
        if (emp.payType === 'Hourly') {
            initialHours[emp.id] = { hours: 80 }; // Default to 80 hours
        }
    });
    return initialHours;
  });
  
  // State for the employee form dialog
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<EmployeeFormState | null>(null);

  const { toast } = useToast();
  
  const defaultPayPeriod: DateRange = {
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
  };
  const [payPeriod, setPayPeriod] = useState<DateRange | undefined>(defaultPayPeriod);

  const payrollSummary = useMemo(() => {
    const summary = employees.map(emp => {
        let grossPay = 0;
        if (emp.payType === 'Salary') {
            grossPay = emp.payRate / 26; // Bi-weekly salary assumption
        } else {
            const hours = employeeHours[emp.id]?.hours || 0;
            grossPay = emp.payRate * Number(hours);
        }
        
        // Simplified deduction calculation for review purposes
        const deductions = grossPay * 0.22; // 22% flat rate estimate
        const netPay = grossPay - deductions;
        
        return { ...emp, grossPay, deductions, netPay };
    });
    
    const totalGross = summary.reduce((sum, emp) => sum + emp.grossPay, 0);
    const totalDeductions = summary.reduce((sum, emp) => sum + emp.deductions, 0);
    const totalNet = summary.reduce((sum, emp) => sum + emp.netPay, 0);

    return { employeeSummary: summary, totalGross, totalDeductions, totalNet };
  }, [employees, employeeHours]);
  
  const handleRunPayroll = () => {
    toast({
        title: "Payroll Submitted (Simulation)",
        description: "In a real application, this would trigger backend processing and payments."
    });
    setIsRunPayrollDialogOpen(false);
    // Reset state after running
    setTimeout(() => setPayrollStep('period'), 500);
  }
  
  const handleHoursChange = (employeeId: string, hours: string) => {
    setEmployeeHours(prev => ({
        ...prev,
        [employeeId]: { hours: hours === '' ? '' : Number(hours) }
    }));
  };
  
  const canProceedFromHours = useMemo(() => {
    return employees
        .filter(emp => emp.payType === 'Hourly')
        .every(emp => {
            const hours = employeeHours[emp.id]?.hours;
            return hours !== '' && Number(hours) >= 0;
        });
  }, [employees, employeeHours]);

  const handleOpenEmployeeDialog = (employee?: Employee) => {
    if (employee) {
        setEmployeeToEdit({ ...employee, payRate: employee.payRate });
    } else {
        setEmployeeToEdit({ name: '', payType: 'Hourly', payRate: '' });
    }
    setIsEmployeeDialogOpen(true);
  };

  const handleSaveEmployee = () => {
    if (!employeeToEdit) return;
    
    // In a real app, you would have more robust validation here.
    if (!employeeToEdit.name.trim() || !employeeToEdit.payRate || Number(employeeToEdit.payRate) <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Data', description: 'Please provide a valid name and pay rate.' });
        return;
    }

    if (employeeToEdit.id) {
        // Editing existing employee
        setEmployees(prev => prev.map(emp => emp.id === employeeToEdit.id ? { ...emp, ...employeeToEdit, payRate: Number(employeeToEdit.payRate) } : emp));
        toast({ title: "Employee Updated", description: `${employeeToEdit.name}'s details have been saved.` });
    } else {
        // Adding new employee
        const newEmployee: Employee = {
            id: `emp-${Date.now()}`, // Simple unique ID for mock data
            userId: 'mock-user',
            ...employeeToEdit,
            payRate: Number(employeeToEdit.payRate),
        };
        setEmployees(prev => [...prev, newEmployee]);
        toast({ title: "Employee Added", description: `${newEmployee.name} has been added to your payroll.` });
    }

    setIsEmployeeDialogOpen(false);
  };
  
  const renderPayrollDialogContent = () => {
    switch(payrollStep) {
        case 'period':
            return (
                <>
                <DialogHeader>
                    <DialogTitle>Step 1: Set Pay Period</DialogTitle>
                    <DialogDescription>Define the timeframe for which you are paying your employees.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label>Pay Period Timeframe</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !payPeriod && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {payPeriod?.from ? (payPeriod.to ? <>{format(payPeriod.from, "LLL dd, y")} - {format(payPeriod.to, "LLL dd, y")}</> : format(payPeriod.from, "LLL dd, y")) : <span>Pick a date range</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={payPeriod?.from} selected={payPeriod} onSelect={setPayPeriod} numberOfMonths={2}/>
                        </PopoverContent>
                    </Popover>
                </div>
                <DialogFooter>
                    <Button onClick={() => setPayrollStep('hours')} disabled={!payPeriod?.from || !payPeriod?.to}>
                        Next: Enter Hours <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
                </>
            );
        case 'hours':
            return (
                 <>
                <DialogHeader>
                    <DialogTitle>Step 2: Enter Hours Worked</DialogTitle>
                    <DialogDescription>
                        Enter the total hours worked during the pay period for each hourly employee. Salaried employees are calculated automatically.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {employees.map(emp => (
                        <div key={emp.id} className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor={`hours-${emp.id}`}>{emp.name}</Label>
                            {emp.payType === 'Hourly' ? (
                                <Input
                                    id={`hours-${emp.id}`}
                                    type="number"
                                    value={employeeHours[emp.id]?.hours}
                                    onChange={(e) => handleHoursChange(emp.id, e.target.value)}
                                    className="col-span-2"
                                    placeholder="Enter total hours"
                                />
                            ) : (
                                <p className="col-span-2 text-sm text-muted-foreground">Salaried</p>
                            )}
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setPayrollStep('period')}>Back</Button>
                    <Button onClick={() => setPayrollStep('review')} disabled={!canProceedFromHours}>
                        Next: Review Payroll <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
                </>
            );
        case 'review':
             return (
                 <>
                <DialogHeader>
                    <DialogTitle>Step 3: Review & Confirm Payroll</DialogTitle>
                     <DialogDescription>
                        Confirm all amounts are correct before processing. Deductions are estimates.
                        For accuracy, use the official CRA calculator.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="text-right">Gross Pay</TableHead>
                                <TableHead className="text-right">Deductions (Est.)</TableHead>
                                <TableHead className="text-right">Net Pay</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrollSummary.employeeSummary.map(emp => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(emp.grossPay)}</TableCell>
                                    <TableCell className="text-right font-mono text-red-500">({formatCurrency(emp.deductions)})</TableCell>
                                    <TableCell className="text-right font-mono font-semibold">{formatCurrency(emp.netPay)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell className="font-bold">Totals</TableCell>
                                <TableCell className="text-right font-bold font-mono">{formatCurrency(payrollSummary.totalGross)}</TableCell>
                                <TableCell className="text-right font-bold font-mono">({formatCurrency(payrollSummary.totalDeductions)})</TableCell>
                                <TableCell className="text-right font-bold font-mono">{formatCurrency(payrollSummary.totalNet)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setPayrollStep('hours')}>Back</Button>
                    <Button onClick={handleRunPayroll}>Confirm & Run Payroll</Button>
                </DialogFooter>
                </>
             )
    }
  }


  return (
    <>
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Payroll" />
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
          <Banknote className="h-8 w-8" />
          Payroll Manager
        </h1>
        <p className="text-muted-foreground max-w-3xl mx-auto mt-2">
          Manage employees, run payroll, and view payment history.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payroll</CardTitle>
              <CardDescription>
                Click the button below to start a new payroll run for your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <Dialog open={isRunPayrollDialogOpen} onOpenChange={(open) => {
                    setIsRunPayrollDialogOpen(open);
                    if (!open) setTimeout(() => setPayrollStep('period'), 500); // Reset on close
                }}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="w-full sm:w-auto">
                            <Rocket className="mr-2 h-5 w-5" />
                            Run New Payroll
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                       {renderPayrollDialogContent()}
                    </DialogContent>
                </Dialog>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
              <CardDescription>A log of all completed payroll runs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pay Period</TableHead>
                    <TableHead>Pay Date</TableHead>
                    <TableHead className="text-right">Total Payroll</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollHistory.map(run => (
                    <TableRow key={run.id}>
                      <TableCell>{format(run.periodStart, 'MMM d')} - {format(run.periodEnd, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(run.payDate, 'PP')}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(run.totalPayroll)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">{run.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Employees</CardTitle>
                <CardDescription>Your team members for payroll.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleOpenEmployeeDialog()}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <p className="font-semibold">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.payType === 'Salary' ? formatCurrency(employee.payRate) + '/year' : formatCurrency(employee.payRate) + '/hour'}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleOpenEmployeeDialog(employee)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <PayrollCraInfo />
        </div>
      </div>
    </div>

    <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>{employeeToEdit?.id ? 'Edit' : 'Add'} Employee</DialogTitle>
            <DialogDescription>
                {employeeToEdit?.id ? `Update the details for ${employeeToEdit.name}.` : 'Add a new employee to your payroll.'}
            </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="emp-name">Employee Name</Label>
                <Input id="emp-name" value={employeeToEdit?.name || ''} onChange={(e) => setEmployeeToEdit(prev => prev ? {...prev, name: e.target.value} : null)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="emp-payType">Pay Type</Label>
                <Select
                    value={employeeToEdit?.payType}
                    onValueChange={(value: 'Salary' | 'Hourly') => setEmployeeToEdit(prev => prev ? {...prev, payType: value} : null)}
                >
                    <SelectTrigger id="emp-payType">
                        <SelectValue placeholder="Select pay type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Salary">Salary</SelectItem>
                        <SelectItem value="Hourly">Hourly</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="emp-payRate">{employeeToEdit?.payType === 'Salary' ? 'Annual Salary' : 'Hourly Rate'}</Label>
                <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                    <Input id="emp-payRate" type="number" value={employeeToEdit?.payRate || ''} onChange={(e) => setEmployeeToEdit(prev => prev ? {...prev, payRate: e.target.value === '' ? '' : Number(e.target.value) } : null)} className="pl-7" />
                </div>
            </div>
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEmployeeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEmployee}>Save Employee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
