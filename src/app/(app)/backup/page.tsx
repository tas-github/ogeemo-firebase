
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatabaseBackup, History, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Backup = {
  id: string;
  createdAt: Date;
  status: "Completed" | "Failed";
  size: string;
  description: string;
};

const initialBackups: Backup[] = [
  {
    id: "bkp_1",
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    status: "Completed",
    size: "256.3 MB",
    description: "Weekly automatic backup",
  },
  {
    id: "bkp_2",
    createdAt: new Date(Date.now() - 86400000 * 9), // 9 days ago
    status: "Completed",
    size: "251.8 MB",
    description: "Weekly automatic backup",
  },
];

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>(initialBackups);
  const [backupStatus, setBackupStatus] = useState<"idle" | "running" | "complete">("idle");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (backupStatus !== "running") return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setBackupStatus("complete");
          const newBackup: Backup = {
            id: `bkp_${Date.now()}`,
            createdAt: new Date(),
            status: "Completed",
            size: `${(250 + Math.random() * 10).toFixed(1)} MB`,
            description: "Manual backup",
          };
          setBackups((prevBackups) => [newBackup, ...prevBackups]);
          toast({
            title: "Backup Complete",
            description: "Your application data has been successfully backed up.",
          });
          return 100;
        }
        return prev + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [backupStatus, toast]);
  
  const handleCreateBackup = () => {
    if (backupStatus === 'running') return;
    setBackupStatus("running");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Backup Manager
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Secure your application data by creating and managing backups. You can restore your data from any of the saved points.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto items-start">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create a New Backup</CardTitle>
            <CardDescription>
              Create a point-in-time backup of your entire Ogeemo application, including all files and database records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backupStatus === "running" ? (
              <div className="space-y-4 text-center">
                <p className="text-sm font-medium">Backup in progress...</p>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>
            ) : backupStatus === "complete" ? (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="font-semibold text-green-700 dark:text-green-400">Backup successfully created!</p>
                    <Button variant="link" onClick={() => setBackupStatus('idle')}>Create another backup</Button>
                </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This process may take several minutes depending on the size of your data. The application will remain available during the backup.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateBackup} disabled={backupStatus === "running"}>
              {backupStatus === "running" ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DatabaseBackup className="mr-2 h-4 w-4" />
              )}
              {backupStatus === 'running' ? 'Backing Up...' : 'Create Backup'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Backup History</CardTitle>
            <CardDescription>
              A log of all previous backups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div className="font-medium">{format(backup.createdAt, "MMM d, yyyy, h:mm a")}</div>
                        <div className="text-xs text-muted-foreground">{backup.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            backup.status === "Completed"
                              ? "secondary"
                              : "destructive"
                          }
                          className={
                            backup.status === "Completed" ? "bg-green-100 text-green-800" : ""
                          }
                        >
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="sm" disabled>
                           <History className="mr-2 h-4 w-4" /> Restore
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
