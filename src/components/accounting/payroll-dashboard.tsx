
"use client";

import React, { useState } from 'react';
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
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Banknote, Rocket, UserPlus, MoreVertical, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { AccountingPageHeader } from './page-header';
import { format } from 'date-fns';
import { type Employee, type PayrollRun, mockEmployees, mockPayrollRuns } from '@/data/payroll';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { PayrollCraInfo } from './payroll-cra-info';
import { Separator } from '../ui/separator';

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export function PayrollDashboard() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRun[]>(mockPayrollRuns);

  const nextPayPeriodStart = new Date('2024-08-01');
  const nextPayPeriodEnd = new Date('2024-08-15');
  
  // Mock calculations for demonstration
  const estimatedGross = 12500.00;
  const estimatedCpp = 781.25; // Example deduction
  const estimatedEi = 206.25; // Example deduction
  const estimatedTax = 2500.00; // Example deduction
  const estimatedNet = estimatedGross - estimatedCpp - estimatedEi - estimatedTax;

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
                Next payroll run is for the period of {format(nextPayPeriodStart, 'PP')} to {format(nextPayPeriodEnd, 'PP')}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /> <span className="font-medium">Gross Payroll</span></div>
                        <span className="font-mono">{formatCurrency(estimatedGross)}</span>
                   </div>
                   <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" /> <span className="font-medium">Deductions</span></div>
                        <span className="font-mono text-red-500">({formatCurrency(estimatedCpp + estimatedEi + estimatedTax)})</span>
                   </div>
               </div>
               <Separator />
               <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-2 text-primary font-bold"><DollarSign className="h-5 w-5" /> <span className="text-lg">Estimated Net Payroll</span></div>
                    <span className="font-mono font-bold text-primary text-2xl">{formatCurrency(estimatedNet)}</span>
               </div>
            </CardContent>
            <CardFooter>
                 <Button size="lg" className="w-full sm:w-auto">
                    <Rocket className="mr-2 h-5 w-5" />
                    Run Payroll
                </Button>
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
