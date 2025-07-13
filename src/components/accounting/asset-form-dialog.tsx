
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { type Asset } from '@/services/accounting-service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const assetSchema = z.object({
  name: z.string().min(2, { message: "Asset name is required." }),
  description: z.string().optional(),
  acquisitionDate: z.date({ required_error: "Acquisition date is required." }),
  acquisitionCost: z.coerce.number().min(0, { message: "Cost must be a positive number." }),
  undepreciatedCapitalCost: z.coerce.number().optional(),
  assetClass: z.string().min(1, { message: "Asset class is required." }),
  depreciationMethod: z.enum(['straight-line', 'declining-balance']),
  usefulLife: z.coerce.number().optional(),
  depreciationRate: z.coerce.number().optional(),
  applyHalfYearRule: z.boolean().optional(),
}).refine(data => {
    if (data.depreciationMethod === 'straight-line' && (data.usefulLife === undefined || data.usefulLife <= 0)) {
        return false;
    }
    return true;
}, {
    message: "Useful life (in years) is required for straight-line depreciation.",
    path: ["usefulLife"],
}).refine(data => {
    if (data.depreciationMethod === 'declining-balance' && (data.depreciationRate === undefined || data.depreciationRate <= 0)) {
        return false;
    }
    return true;
}, {
    message: "Depreciation rate (%) is required for declining balance.",
    path: ["depreciationRate"],
}).refine(data => {
    if (data.undepreciatedCapitalCost !== undefined && data.undepreciatedCapitalCost > data.acquisitionCost) {
        return false;
    }
    return true;
}, {
    message: "Undepreciated cost cannot be greater than the acquisition cost.",
    path: ["undepreciatedCapitalCost"],
});


interface AssetFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Asset, 'id' | 'userId'>) => void;
  assetToEdit?: Asset | null;
}

export function AssetFormDialog({ isOpen, onOpenChange, onSave, assetToEdit }: AssetFormDialogProps) {
  const form = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: '',
      description: '',
      acquisitionCost: 0,
      undepreciatedCapitalCost: undefined,
      assetClass: '',
      depreciationMethod: 'declining-balance',
      applyHalfYearRule: true,
    },
  });

  const depreciationMethod = form.watch('depreciationMethod');

  useEffect(() => {
    if (assetToEdit && isOpen) {
      form.reset({
        ...assetToEdit,
        acquisitionDate: assetToEdit.acquisitionDate ? new Date(assetToEdit.acquisitionDate) : undefined,
        undepreciatedCapitalCost: assetToEdit.currentValue,
        applyHalfYearRule: assetToEdit.applyHalfYearRule ?? true,
      });
    } else if (!assetToEdit && isOpen) {
      form.reset({
        name: '',
        description: '',
        acquisitionCost: 0,
        undepreciatedCapitalCost: undefined,
        assetClass: '',
        depreciationMethod: 'declining-balance',
        usefulLife: undefined,
        depreciationRate: undefined,
        acquisitionDate: new Date(),
        applyHalfYearRule: true,
      });
    }
  }, [assetToEdit, isOpen, form]);

  const handleSubmit = (values: z.infer<typeof assetSchema>) => {
    
    const currentValue = values.undepreciatedCapitalCost !== undefined ? values.undepreciatedCapitalCost : values.acquisitionCost;
    const accumulatedDepreciation = values.acquisitionCost - currentValue;
    
    const dataToSave: Omit<Asset, 'id' | 'userId'> = {
        name: values.name,
        description: values.description,
        acquisitionDate: values.acquisitionDate,
        acquisitionCost: values.acquisitionCost,
        assetClass: values.assetClass,
        depreciationMethod: values.depreciationMethod,
        usefulLife: values.usefulLife,
        depreciationRate: values.depreciationRate,
        applyHalfYearRule: values.applyHalfYearRule,
        currentValue: currentValue,
        accumulatedDepreciation: accumulatedDepreciation,
        disposalDate: null,
        disposalPrice: null,
        capitalGainOrLoss: null,
        terminalLoss: null,
    };
    onSave(dataToSave);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{assetToEdit ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          <DialogDescription>
            Enter the details of the capital asset.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Asset Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="assetClass" render={({ field }) => ( <FormItem><FormLabel>Asset Class</FormLabel><FormControl><Input placeholder="e.g., Class 8, Class 10" {...field} /></FormControl><FormDescription>As per tax authority guidelines (e.g., CRA).</FormDescription><FormMessage /></FormItem> )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField control={form.control} name="acquisitionDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Acquisition Date</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                <FormMessage /> </FormItem> )} />
            
            <FormField
              control={form.control}
              name="acquisitionCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acquisition Cost</FormLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      $
                    </span>
                    <FormControl>
                      <Input
                        type="number"
                        className="pl-7"
                        placeholder="0.00"
                        step="0.01"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="undepreciatedCapitalCost"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Undepreciated Capital Cost (Optional)</FormLabel>
                    <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        $
                    </span>
                    <FormControl>
                        <Input
                        type="number"
                        className="pl-7"
                        placeholder="0.00"
                        step="0.01"
                        {...field}
                        value={field.value ?? ''}
                        />
                    </FormControl>
                    </div>
                    <FormDescription>For assets purchased in a previous fiscal year, enter the starting value for this year.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            <FormField control={form.control} name="depreciationMethod" render={({ field }) => (
                <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Depreciation Method</FormLabel>
                       <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0" aria-label="Depreciation method help">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="p-1 max-w-xs space-y-2">
                                <div>
                                  <h4 className="font-semibold">Declining Balance (CCA)</h4>
                                  <p className="text-xs text-muted-foreground">Best for tax purposes (e.g., CRA's Capital Cost Allowance). Applies a fixed % to the remaining value each year.</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Straight-Line</h4>
                                  <p className="text-xs text-muted-foreground">Best for simple internal bookkeeping. Spreads the cost evenly over the asset's useful life.</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="declining-balance">Declining Balance (CCA)</SelectItem>
                            <SelectItem value="straight-line">Straight-Line</SelectItem>
                        </SelectContent>
                    </Select>
                <FormMessage /></FormItem>
            )} />

            {depreciationMethod === 'straight-line' && (
                <FormField control={form.control} name="usefulLife" render={({ field }) => ( <FormItem><FormLabel>Useful Life (Years)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
            )}

            {depreciationMethod === 'declining-balance' && (
                <div className="grid grid-cols-2 gap-4 items-end">
                    <FormField control={form.control} name="depreciationRate" render={({ field }) => ( <FormItem><FormLabel>Depreciation Rate (%)</FormLabel><FormControl><Input type="number" placeholder="e.g., 20 for Class 8" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField
                        control={form.control}
                        name="applyHalfYearRule"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-start space-x-2 pb-1">
                            <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                            <FormLabel>
                                Apply half-year rule
                            </FormLabel>
                            </div>
                        </FormItem>
                        )}
                    />
                </div>
            )}


            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Asset</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
