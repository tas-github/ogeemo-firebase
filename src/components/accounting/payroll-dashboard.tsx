
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
import { Banknote, Rocket, UserPlus, MoreVertical, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
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

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

interface PayrollDetails {
    hours?: number;
    deductions: number;
}

export function PayrollDashboard() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRun[]>(mockPayrollRuns);
  const [payrollDetails, setPayrollDetails] = useState<Record<string, PayrollDetails>>(() => {
    const details: Record<string, PayrollDetails> = {};
    mockEmployees.forEach(emp => {
        details[emp.id] = {
            hours: emp.payType === 'Hourly' ? 80 : undefined,
            deductions: emp.payType === 'Salary' ? (emp.payRate / 26) * 0.25 : (emp.payRate * 80) * 0.22,
        };
    });
    return details;
  });
  const { toast } = useToast();
  
  const defaultPayPeriod: DateRange = {
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
  };
  const [payPeriod, setPayPeriod] = useState<DateRange | undefined>(defaultPayPeriod);

  const estimatedGross = useMemo(() => {
    return employees.reduce((total, emp) => {
        const details = payrollDetails[emp.id];
        if (emp.payType === 'Salary') {
            return total + (emp.payRate / 26); // Bi-weekly salary
        }
        if (emp.payType === 'Hourly' && details?.hours) {
            return total + (emp.payRate * details.hours);
        }
        return total;
    }, 0);
  }, [employees, payrollDetails]);

  const estimatedDeductions = useMemo(() => {
      return Object.values(payrollDetails).reduce((total, details) => total + details.deductions, 0);
  }, [payrollDetails]);
  
  const estimatedNet = estimatedGross - estimatedDeductions;
  
  const handleDetailChange = (employeeId: string, field: keyof PayrollDetails, value: number) => {
      setPayrollDetails(prev => ({
          ...prev,
          [employeeId]: {
              ...prev[employeeId],
              [field]: value,
          }
      }));
  };
  
  const handleRunPayroll = () => {
    toast({
        title: "Payroll Submitted (Simulation)",
        description: "In a real application, this would trigger backend processing and payments."
    });
  }

  return (
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
                Set the pay period and review the estimated totals before running payroll.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <Label>Pay Period Timeframe</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !payPeriod && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {payPeriod?.from ? (
                                payPeriod.to ? (
                                    <>{format(payPeriod.from, "LLL dd, y")} - {format(payPeriod.to, "LLL dd, y")}</>
                                ) : (
                                    format(payPeriod.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={payPeriod?.from}
                            selected={payPeriod}
                            onSelect={setPayPeriod}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
               </div>
               <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /> <span className="font-medium">Gross Payroll</span></div>
                        <span className="font-mono">{formatCurrency(estimatedGross)}</span>
                   </div>
                   <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" /> <span className="font-medium">Deductions</span></div>
                        <span className="font-mono text-red-500">({formatCurrency(estimatedDeductions)})</span>
                   </div>
               </div>
               <Separator />
               <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-2 text-primary font-bold"><DollarSign className="h-5 w-5" /> <span className="text-lg">Estimated Net Payroll</span></div>
                    <span className="font-mono font-bold text-primary text-2xl">{formatCurrency(estimatedNet)}</span>
               </div>
            </CardContent>
            <CardFooter>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="lg" className="w-full sm:w-auto">
                            <Rocket className="mr-2 h-5 w-5" />
                            Run Payroll
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Run Payroll: {payPeriod?.from && payPeriod?.to ? `${format(payPeriod.from, 'MMM d')} - ${format(payPeriod.to, 'MMM d, yyyy')}` : 'Confirm Payroll'}</DialogTitle>
                            <DialogDescription>Confirm hours and amounts before processing. Deductions are pre-filled estimates.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="w-24">Hours</TableHead>
                                        <TableHead className="text-right">Gross Pay</TableHead>
                                        <TableHead className="w-32 text-right">Deductions</TableHead>
                                        <TableHead className="text-right">Net Pay</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map(emp => {
                                        const details = payrollDetails[emp.id];
                                        const grossPay = emp.payType === 'Salary'
                                            ? emp.payRate / 26
                                            : (details?.hours || 0) * emp.payRate;
                                        const netPay = grossPay - (details?.deductions || 0);

                                        return (
                                            <TableRow key={emp.id}>
                                                <TableCell className="font-medium">{emp.name}</TableCell>
                                                <TableCell>
                                                    {emp.payType === 'Hourly' ? (
                                                        <Input type="number" value={details?.hours} onChange={(e) => handleDetailChange(emp.id, 'hours', Number(e.target.value))} className="h-8"/>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Salary</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(grossPay)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Input type="number" value={details?.deductions} onChange={(e) => handleDetailChange(emp.id, 'deductions', Number(e.target.value))} className="h-8 text-right"/>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold">{formatCurrency(netPay)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={2} className="font-bold">Totals</TableCell>
                                        <TableCell className="text-right font-bold font-mono">{formatCurrency(estimatedGross)}</TableCell>
                                        <TableCell className="text-right font-bold font-mono">({formatCurrency(estimatedDeductions)})</TableCell>
                                        <TableCell className="text-right font-bold font-mono">{formatCurrency(estimatedNet)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                        <DialogFooter>
                            <DialogTrigger asChild>
                                <Button variant="ghost">Cancel</Button>
                            </DialogTrigger>
                             <DialogTrigger asChild>
                                <Button onClick={handleRunPayroll}>Confirm &amp; Run Payroll</Button>
                            </DialogTrigger>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardFooter>
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
              <Button size="sm" variant="outline">
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
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
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
  );
}
