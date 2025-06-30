
"use client";

import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type Project } from "@/data/projects";
import { type Event } from "@/types/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Calendar, Trash2 } from "lucide-react";


interface ProjectInfoCardProps {
  project: Project;
  tasks: Event[];
  onEditTask: (task: Event) => void;
  onInitiateDelete: (task: Event) => void;
}

export function ProjectInfoCard({ project, tasks, onEditTask, onInitiateDelete }: ProjectInfoCardProps) {
  if (!project) {
    return null;
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(task => task.status === 'done').length;
  const completionPercentage = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
  
  const getStatusVariant = (status: 'todo' | 'inProgress' | 'done') => {
    switch (status) {
      case 'done':
        return 'secondary';
      case 'inProgress':
        return 'default';
      case 'todo':
      default:
        return 'outline';
    }
  }

  return (
    <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <CardTitle className="text-2xl">{project.name} Overview</CardTitle>
                {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                )}
                 <div className="pt-4">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">Progress</p>
                        <p className="text-sm text-muted-foreground">{doneTasks} / {totalTasks} tasks completed</p>
                    </div>
                    <Progress value={completionPercentage} />
                    <p className="text-right text-sm font-bold mt-1">{Math.round(completionPercentage)}%</p>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
                <h3 className="text-lg font-semibold mb-2">Tasks</h3>
                <div className="flex-1 border rounded-md overflow-hidden">
                    <ScrollArea className="h-full">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted">
                                <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Assignee</TableHead>
                                    <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.length > 0 ? tasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(task.status)}>
                                                {task.status === 'inProgress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{format(task.end, 'PPP')}</TableCell>
                                        <TableCell>{task.attendees.join(', ')}</TableCell>
                                        <TableCell>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                                <span className="sr-only">Open task menu</span>
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem onSelect={() => onEditTask(task)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Edit</span>
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onSelect={() => onEditTask(task)}>
                                                <Calendar className="mr-2 h-4 w-4" />
                                                <span>Add to Calendar</span>
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onSelect={() => onInitiateDelete(task)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Delete</span>
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No tasks for this project yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
