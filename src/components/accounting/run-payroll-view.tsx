
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ArrowLeft, CheckCircle, FileSpreadsheet, Users, DollarSign, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

type Employee = {
    id: string;
    name: string;
    payType: 'hourly' | 'salary';
    payRate: number;
    hours?: number;
};

type PayrollStatus = 'idle' | 'processing' | 'completed';

const initialEmployees: Employee[] = [
    { id: '1', name: 'Alice Johnson', payType: 'salary', payRate: 75000 },
    { id: '2', name: 'Bob Williams', payType: 'hourly', payRate: 25.50, hours: 0 },
    { id: '3', name: 'Charlie Brown', payType: 'hourly', payRate: 22.00, hours: 0 },
];

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export function RunPayrollView() {
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(initialEmployees.map(e => e.id));
    const [payPeriod, setPayPeriod] = useState<DateRange | undefined>({ from: new Date(), to: addDays(new Date(), 14) });
    const [payrollStatus, setPayrollStatus] = useState<PayrollStatus>('idle');
    const { toast } = useToast();

    const selectedEmployees = useMemo(() => {
        return employees.filter(e => selectedEmployeeIds.includes(e.id));
    }, [employees, selectedEmployeeIds]);

    const handleSelectEmployee = (employeeId: string) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };
    
    const handleHoursChange = (employeeId: string, hours: number) => {
        setEmployees(prev =>
            prev.map(emp => emp.id === employeeId ? { ...emp, hours: isNaN(hours) ? 0 : hours } : emp)
        );
    };

    const payrollSummary = useMemo(() => {
        return selectedEmployees.map(emp => {
            let grossPay = 0;
            if (emp.payType === 'salary') {
                grossPay = emp.payRate / 24; // Assuming bi-weekly pay periods
            } else {
                grossPay = (emp.hours || 0) * emp.payRate;
            }
            // In a real app, deductions would be calculated here
            const deductions = grossPay * 0.20; // Simplified 20% deduction
            const netPay = grossPay - deductions;
            return { ...emp, grossPay, deductions, netPay };
        });
    }, [selectedEmployees]);

    const totalGrossPay = useMemo(() => payrollSummary.reduce((sum, emp) => sum + emp.grossPay, 0), [payrollSummary]);
    const totalDeductions = useMemo(() => payrollSummary.reduce((sum, emp) => sum + emp.deductions, 0), [payrollSummary]);
    const totalNetPay = useMemo(() => payrollSummary.reduce((sum, emp) => sum + emp.netPay, 0), [payrollSummary]);
    
    const handleRunPayroll = () => {
        setPayrollStatus('processing');
        setTimeout(() => {
            setPayrollStatus('completed');
            toast({
                title: "Payroll Submitted",
                description: `Payroll for ${selectedEmployees.length} employees has been processed.`,
            });
        }, 2000);
    };

    const handleStartNewPayroll = () => {
        setPayrollStatus('idle');
        setSelectedEmployeeIds(initialEmployees.map(e => e.id));
        setEmployees(initialEmployees);
    }
    
    if (payrollStatus === 'completed') {
        return (
            <div className="p-4 sm:p-6 flex items-center justify-center h-full">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="mt-4 text-2xl">Payroll Submitted Successfully</CardTitle>
                        <CardDescription>
                            The payroll for the period of {payPeriod?.from ? format(payPeriod.from, "LLL dd, y") : ''} to {payPeriod?.to ? format(payPeriod.to, "LLL dd, y") : ''} has been processed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-left p-4 border rounded-lg bg-muted/50">
                            <h3 className="font-semibold mb-2">What Happens Next (in a real scenario):</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>Pay stubs for {selectedEmployees.length} employees have been generated.</li>
                                <li>Accounting entries for salaries and deductions have been posted to the General Ledger.</li>
                                <li>Reminders for tax remittances have been scheduled.</li>
                                <li>Direct deposits have been initiated.</li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row justify-center gap-4">
                        <Button onClick={handleStartNewPayroll}>Run Another Payroll</Button>
                        <Button variant="outline" asChild>
                            <Link href="/accounting/payroll/history">View Payroll History</Link>
                        </Button>
                         <Button variant="outline" asChild>
                            <Link href="/accounting/payroll">Back to Payroll Hub</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="relative text-center">
                 <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    <Button asChild variant="outline">
                        <Link href="/accounting/payroll">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Payroll Hub
                        </Link>
                    </Button>
                </div>
                <h1 className="text-3xl font-bold font-headline text-primary">Run Payroll</h1>
                <p className="text-muted-foreground">Follow the steps below to process payroll for your employees.</p>
            </header>

            <Card className="max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-6 w-6 text-primary"/>
                        Step 1: Pay Period & Employees
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Pay Period</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !payPeriod && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {payPeriod?.from ? payPeriod.to ? `${format(payPeriod.from, "LLL dd, y")} - ${format(payPeriod.to, "LLL dd, y")}` : format(payPeriod.from, "LLL dd, y") : <span>Pick a date range</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={payPeriod?.from} selected={payPeriod} onSelect={setPayPeriod} numberOfMonths={2}/></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Select Employees to Pay</Label>
                        <div className="space-y-2 rounded-md border p-4">
                            {employees.map(emp => (
                                <div key={emp.id} className="flex items-center space-x-2">
                                    <Checkbox id={`emp-${emp.id}`} checked={selectedEmployeeIds.includes(emp.id)} onCheckedChange={() => handleSelectEmployee(emp.id)} />
                                    <label htmlFor={`emp-${emp.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1">{emp.name}</label>
                                    <span className="text-xs text-muted-foreground capitalize">{emp.payType}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card className="max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary"/>
                        Step 2: Review & Enter Hours
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Pay Type</TableHead><TableHead>Rate</TableHead><TableHead className="w-48">Hours Worked</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {selectedEmployees.map(emp => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                    <TableCell className="capitalize">{emp.payType}</TableCell>
                                    <TableCell className="font-mono">{formatCurrency(emp.payRate)}{emp.payType === 'hourly' && '/hr'}</TableCell>
                                    <TableCell>
                                        {emp.payType === 'hourly' ? (
                                            <Input type="number" value={emp.hours} onChange={e => handleHoursChange(emp.id, parseInt(e.target.value))} />
                                        ) : (
                                            <span className="text-muted-foreground text-sm">N/A</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>

             <Card className="max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-primary"/>
                        Step 3: Payroll Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead className="text-right">Gross Pay</TableHead><TableHead className="text-right">Deductions (Est.)</TableHead><TableHead className="text-right">Net Pay</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {payrollSummary.map(emp => (
                                <TableRow key={emp.id}>
                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(emp.grossPay)}</TableCell>
                                    <TableCell className="text-right font-mono">({formatCurrency(emp.deductions)})</TableCell>
                                    <TableCell className="text-right font-mono font-bold">{formatCurrency(emp.netPay)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell className="font-bold">Totals</TableCell>
                                <TableCell className="text-right font-bold font-mono">{formatCurrency(totalGrossPay)}</TableCell>
                                <TableCell className="text-right font-bold font-mono">({formatCurrency(totalDeductions)})</TableCell>
                                <TableCell className="text-right font-bold font-mono">{formatCurrency(totalNetPay)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
                <CardFooter className="flex-col items-center gap-4">
                     <p className="text-xs text-muted-foreground text-center">By clicking "Submit Payroll", you are confirming the amounts are correct.</p>
                     <Button size="lg" onClick={handleRunPayroll} disabled={selectedEmployees.length === 0 || payrollStatus === 'processing'}>
                        {payrollStatus === 'processing' ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                        {payrollStatus === 'processing' ? 'Processing...' : `Submit Payroll for ${selectedEmployees.length} Employee(s)`}
                     </Button>
                </CardFooter>
             </Card>

        </div>
    );
}
