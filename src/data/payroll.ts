
export interface Employee {
  id: string;
  name: string;
  payType: 'Salary' | 'Hourly';
  payRate: number; // Annual salary or hourly rate
  userId: string;
}

export interface PayrollRun {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  payDate: Date;
  totalPayroll: number;
  status: 'Paid';
  userId: string;
}

export const mockEmployees: Employee[] = [
  { id: 'emp-1', name: 'Alice Johnson', payType: 'Salary', payRate: 80000, userId: 'mock-user' },
  { id: 'emp-2', name: 'Bob Williams', payType: 'Hourly', payRate: 45, userId: 'mock-user' },
  { id: 'emp-3', name: 'Charlie Brown', payType: 'Hourly', payRate: 55, userId: 'mock-user' },
];

export const mockPayrollRuns: PayrollRun[] = [
    {
        id: 'run-1',
        periodStart: new Date('2024-07-16'),
        periodEnd: new Date('2024-07-31'),
        payDate: new Date('2024-08-05'),
        totalPayroll: 12350.50,
        status: 'Paid',
        userId: 'mock-user'
    },
    {
        id: 'run-2',
        periodStart: new Date('2024-07-01'),
        periodEnd: new Date('2024-07-15'),
        payDate: new Date('2024-07-20'),
        totalPayroll: 12175.00,
        status: 'Paid',
        userId: 'mock-user'
    }
];
