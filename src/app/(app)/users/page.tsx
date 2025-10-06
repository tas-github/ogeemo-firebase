
'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Trash2, AlertTriangle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllAuthUsers, deleteAuthUser } from '@/app/actions/user-actions';
import { UserRecord } from 'firebase-admin/auth';

export default function AuthUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
  const { toast } = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const authUsers = await getAllAuthUsers();
      setUsers(authUsers);
    } catch (error) {
      console.error('Failed to load auth users:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load users',
        description: 'Could not retrieve your Firebase Authentication user list.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleForceDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteAuthUser(userToDelete.uid);
      toast({
        title: 'User Deleted',
        description: `"${userToDelete.displayName || userToDelete.email}" has been permanently removed.`,
      });
      loadUsers(); // Refresh the list from the server
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'The user could not be deleted from Firebase Authentication.',
      });
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Auth User Management</h1>
          <p className="text-muted-foreground">Directly manage users in Firebase Authentication.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Users</CardTitle>
            <CardDescription>
              A direct view of the users in Firebase Authentication. This is separate from your Contacts list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-4 mb-4 text-sm text-destructive-foreground bg-destructive rounded-md">
                <AlertTriangle className="h-5 w-5" />
                <div>
                    <h3 className="font-bold">Warning: Direct User Deletion</h3>
                    <p>Deleting a user here is permanent and cannot be undone. This will revoke their access to the application entirely.</p>
                </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <LoaderCircle className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>User ID (UID)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.uid}>
                          <TableCell className="font-medium">{user.displayName || '(No display name)'}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="font-mono text-xs">{user.uid}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setUserToDelete(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No users found in Firebase Authentication.
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

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{userToDelete?.displayName || userToDelete?.email}" (UID: {userToDelete?.uid}). This action cannot be undone and will revoke all access for this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
