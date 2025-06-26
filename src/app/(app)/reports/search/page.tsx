
'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';

import { ReportsPageHeader } from "@/components/reports/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Import mock data
import { mockContacts, mockFolders, type Contact } from '@/data/contacts';
import { initialProjects, type Project } from '@/data/projects';
import { getInitialEvents } from '@/data/events';
import { type Event } from '@/types/calendar';

type DataSource = 'contacts' | 'projects' | 'tasks';

interface Condition {
  id: number;
  field: string;
  operator: 'contains' | 'is' | 'is_not' | 'starts_with' | 'ends_with';
  value: string;
}

const dataSources: { value: DataSource; label: string }[] = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
];

const fieldOptions: Record<DataSource, { value: string; label: string }[]> = {
  contacts: [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'notes', label: 'Notes' },
  ],
  projects: [
    { value: 'name', label: 'Project Name' },
    { value: 'description', label: 'Description' },
  ],
  tasks: [
    { value: 'title', label: 'Task Title' },
    { value: 'description', label: 'Description' },
    { value: 'status', label: 'Status' },
  ],
};

const operatorOptions: { value: Condition['operator']; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'is', label: 'Is' },
  { value: 'is_not', label: 'Is Not' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
];

export default function AdvancedSearchPage() {
  const [dataSource, setDataSource] = React.useState<DataSource>('contacts');
  const [conditions, setConditions] = React.useState<Condition[]>([{ id: 1, field: 'name', operator: 'contains', value: '' }]);
  const [logic, setLogic] = React.useState<'AND' | 'OR'>('AND');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searchPerformed, setSearchPerformed] = React.useState(false);
  const { toast } = useToast();

  const allTasks = React.useMemo(() => getInitialEvents(), []);

  const handleDataSourceChange = (value: string) => {
    const newDataSource = value as DataSource;
    setDataSource(newDataSource);
    setConditions([{ id: 1, field: fieldOptions[newDataSource][0].value, operator: 'contains', value: '' }]);
    setSearchResults([]);
    setSearchPerformed(false);
  };

  const handleAddCondition = () => {
    const newId = (conditions.at(-1)?.id || 0) + 1;
    setConditions([
      ...conditions,
      { id: newId, field: fieldOptions[dataSource][0].value, operator: 'contains', value: '' },
    ]);
  };

  const handleRemoveCondition = (id: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((c) => c.id !== id));
    }
  };

  const handleUpdateCondition = (id: number, updatedValue: Partial<Condition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updatedValue } : c)));
  };

  const handleSearch = () => {
    if (conditions.some(c => !c.value.trim())) {
      toast({
        variant: 'destructive',
        title: 'Empty search value',
        description: 'Please ensure all conditions have a value before searching.',
      });
      return;
    }

    let results: any[] = [];
    const dataMap = {
      contacts: mockContacts,
      projects: initialProjects,
      tasks: allTasks,
    };
    const dataToSearch = dataMap[dataSource];

    results = dataToSearch.filter(item => {
      const checkCondition = (condition: Condition) => {
        const itemValue = (item[condition.field as keyof typeof item] as string)?.toLowerCase() || '';
        const conditionValue = condition.value.toLowerCase();
        
        switch (condition.operator) {
          case 'contains':
            return itemValue.includes(conditionValue);
          case 'is':
            return itemValue === conditionValue;
          case 'is_not':
            return itemValue !== conditionValue;
          case 'starts_with':
            return itemValue.startsWith(conditionValue);
          case 'ends_with':
            return itemValue.endsWith(conditionValue);
          default:
            return false;
        }
      };

      if (logic === 'AND') {
        return conditions.every(checkCondition);
      } else {
        return conditions.some(checkCondition);
      }
    });

    setSearchResults(results);
    setSearchPerformed(true);
  };

  const renderResultsTable = () => {
    if (searchResults.length === 0) {
      return (
        <div className="flex h-full min-h-48 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">No results found.</p>
        </div>
      );
    }

    switch (dataSource) {
      case 'contacts':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Folder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((contact: Contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{mockFolders.find(f => f.id === contact.folderId)?.name || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      case 'projects':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((project: Project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      case 'tasks':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Project</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((task: Event) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.status}</TableCell>
                  <TableCell>{initialProjects.find(p => p.id === task.projectId)?.name || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full space-y-6">
      <ReportsPageHeader pageTitle="Advanced Search" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1">
        {/* Query Builder */}
        <Card className="lg:col-span-1 sticky top-4">
          <CardHeader>
            <CardTitle>Query Builder</CardTitle>
            <CardDescription>Construct your search query here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-source">Data Source</Label>
              <Select value={dataSource} onValueChange={handleDataSourceChange}>
                <SelectTrigger id="data-source">
                  <SelectValue placeholder="Select a data source..." />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Conditions</Label>
              <RadioGroup value={logic} onValueChange={(value) => setLogic(value as 'AND' | 'OR')} className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="AND" id="and" />
                  <Label htmlFor="and">Match all (AND)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="OR" id="or" />
                  <Label htmlFor="or">Match any (OR)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="p-3 border rounded-md space-y-2 relative bg-background">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => handleUpdateCondition(condition.id, { field: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fieldOptions[dataSource].map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => handleUpdateCondition(condition.id, { operator: value as Condition['operator'] })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {operatorOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Value..."
                    value={condition.value}
                    onChange={(e) => handleUpdateCondition(condition.id, { value: e.target.value })}
                  />
                  {conditions.length > 1 && (
                     <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                        onClick={() => handleRemoveCondition(condition.id)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

             <Button variant="outline" size="sm" onClick={handleAddCondition}>
              <Plus className="mr-2 h-4 w-4" /> Add Condition
            </Button>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSearch} className="w-full">Search</Button>
          </CardFooter>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {searchPerformed ? `Showing results for ${dataSource}` : 'Results will appear here after you perform a search.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!searchPerformed ? (
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground">Perform a search to see results.</p>
                </div>
              ) : (
                renderResultsTable()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
