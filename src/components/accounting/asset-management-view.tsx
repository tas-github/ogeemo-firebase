
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { MoreVertical, PlusCircle, Trash2, Edit, LoaderCircle, Package } from 'lucide-react';
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getAssets, addAsset, updateAsset, deleteAsset, type Asset } from '@/services/accounting-service';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
// import { AssetFormDialog } from './asset-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { format } from 'date-fns';

const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export function AssetManagementView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchAssets = async () => {
        setIsLoading(true);
        try {
          const fetchedAssets = await getAssets(user.uid);
          setAssets(fetchedAssets);
        } catch (error) {
          console.error("Failed to fetch assets:", error);
          toast({ variant: "destructive", title: "Failed to load assets", description: "Could not retrieve assets from the database." });
        } finally {
          setIsLoading(false);
        }
      };
      fetchAssets();
    } else {
      setIsLoading(false);
    }
  }, [user, toast]);
  
  const handleOpenForm = (asset?: Asset) => {
    // setAssetToEdit(asset || null);
    // setIsFormOpen(true);
    toast({ title: "Feature Disabled", description: "The 'Add Asset' feature is temporarily disabled."})
  };
  
  const handleSaveAsset = async (data: Omit<Asset, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      if (assetToEdit) {
        await updateAsset(assetToEdit.id, data);
        setAssets(assets.map(a => a.id === assetToEdit.id ? { ...assetToEdit, ...data } : a));
        toast({ title: "Asset Updated" });
      } else {
        const newAsset = await addAsset({ ...data, userId: user.uid });
        setAssets([...assets, newAsset]);
        toast({ title: "Asset Added" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    }
  };
  
  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    try {
        await deleteAsset(assetToDelete.id);
        setAssets(assets.filter(a => a.id !== assetToDelete.id));
        toast({ title: "Asset Deleted" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Delete Failed", description: error.message });
    } finally {
        setAssetToDelete(null);
    }
  };
  
  const totalAssetValue = useMemo(() => {
    return assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
  }, [assets]);
  
  return (
    <>
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
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
                    </Button>
                </div>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Acquired</TableHead>
                                    <TableHead>Cost</TableHead>
                                    <TableHead>Accum. Depr.</TableHead>
                                    <TableHead>Current Value</TableHead>
                                    <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.length > 0 ? assets.map(asset => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="font-medium">{asset.name}</TableCell>
                                        <TableCell>{asset.assetClass}</TableCell>
                                        <TableCell>{format(new Date(asset.acquisitionDate), 'PP')}</TableCell>
                                        <TableCell>{formatCurrency(asset.acquisitionCost)}</TableCell>
                                        <TableCell className="text-red-600">({formatCurrency(asset.accumulatedDepreciation)})</TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(asset.currentValue)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handleOpenForm(asset)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => setAssetToDelete(asset)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            <Package className="mx-auto h-8 w-8 mb-2" />
                                            No assets found. Add your first capital asset to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
      
      {/* 
      <AssetFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveAsset}
        assetToEdit={assetToEdit}
      />
      */}
      
      <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the asset "{assetToDelete?.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAsset} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
