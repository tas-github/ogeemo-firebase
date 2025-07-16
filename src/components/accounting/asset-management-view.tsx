
"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { PlusCircle, MoreVertical, Pencil, Trash2, LoaderCircle } from "lucide-react";
import { AccountingPageHeader } from "@/components/accounting/page-header";
import { AssetFormDialog } from './asset-form-dialog';
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useAuth } from "@/context/auth-context";
import { getAssets, addAsset, updateAsset, deleteAsset, type Asset } from "@/services/accounting-service";


const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function AssetManagementView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
  
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    const loadData = async () => {
        setIsLoading(true);
        try {
            const fetchedAssets = await getAssets(user.uid);
            setAssets(fetchedAssets);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Failed to load assets", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, [user, toast]);

  const totalAssetValue = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.cost, 0);
  }, [assets]);

  const handleOpenDialog = (asset?: Asset) => {
    setAssetToEdit(asset || null);
    setIsAssetFormOpen(true);
  };
  
  const handleSaveAsset = async (assetData: Asset | Omit<Asset, 'id' | 'userId'>) => {
    if (!user) return;
    try {
        if ('id' in assetData) {
            const { id, userId, ...dataToUpdate } = assetData;
            await updateAsset(id, dataToUpdate);
            setAssets(prev => prev.map(a => a.id === id ? { ...a, ...dataToUpdate } : a));
            toast({ title: 'Asset Updated', description: `"${assetData.name}" has been updated.` });
        } else {
            const newAssetData = { ...assetData, userId: user.uid };
            const newAsset = await addAsset(newAssetData);
            setAssets(prev => [newAsset, ...prev]);
            toast({ title: 'Asset Added', description: `"${newAsset.name}" has been added to the register.` });
        }
    } catch(error: any) {
        toast({ variant: "destructive", title: "Save failed", description: error.message });
    }
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    try {
        await deleteAsset(assetToDelete.id);
        setAssets(prev => prev.filter(a => a.id !== assetToDelete.id));
        toast({ variant: 'destructive', title: 'Asset Deleted', description: `"${assetToDelete.name}" has been removed.`});
    } catch (error: any) {
        toast({ variant: "destructive", title: "Delete failed", description: error.message });
    } finally {
        setAssetToDelete(null);
    }
  };

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
                  <p className="text-sm text-muted-foreground">Total Original Cost</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalAssetValue)}</p>
              </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <Button variant="outline" onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
              </Button>
            </div>
            <div className="border rounded-md">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Asset</TableHead>
                            <TableHead>Acquired</TableHead>
                            <TableHead className="text-right">Original Cost</TableHead>
                            <TableHead className="text-right">Undepreciated Capital Cost</TableHead>
                            <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {assets.map((asset) => (
                            <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.name}</TableCell>
                            <TableCell>{asset.purchaseDate}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(asset.cost)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(asset.undepreciatedCapitalCost)}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => handleOpenDialog(asset)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onSelect={() => setAssetToDelete(asset)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AssetFormDialog
        isOpen={isAssetFormOpen}
        onOpenChange={setIsAssetFormOpen}
        assetToEdit={assetToEdit}
        onSave={handleSaveAsset}
      />

      <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the asset "{assetToDelete?.name}" from your register.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
