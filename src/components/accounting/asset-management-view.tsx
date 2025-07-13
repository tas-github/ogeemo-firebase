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
import { PlusCircle, MoreVertical } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";

// Mock Data
const mockAssets = [
  { id: "asset-1", name: "Company Vehicle", class: "Class 10 (30%)", acquired: "2023-01-15", cost: 35000, currentValue: 24500 },
  { id: "asset-2", name: "Office Computers", class: "Class 50 (55%)", acquired: "2023-06-01", cost: 8000, currentValue: 3600 },
  { id: "asset-3", name: "Office Furniture", class: "Class 8 (20%)", acquired: "2022-05-20", cost: 12000, currentValue: 7680 },
];

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function AssetManagementView() {
  const totalAssetValue = React.useMemo(() => {
    return mockAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <AccountingPageHeader pageTitle="Asset Management" />
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Capital Asset Management</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Track your business's capital assets, manage depreciation, and record disposals.
        </p>
      </header>

      <Card>
        <CardHeader className="flex-row justify-between items-start">
            <div>
                <CardTitle>Asset Register</CardTitle>
                <CardDescription>A list of all capital assets owned by the business.</CardDescription>
            </div>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Current Value</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalAssetValue)}</p>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
            </Button>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Acquired</TableHead>
                  <TableHead className="text-right">Original Cost</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.class}</TableCell>
                    <TableCell>{asset.acquired}</TableCell>
                    <TableCell className="text-right">{formatCurrency(asset.cost)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(asset.currentValue)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
