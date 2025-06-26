
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
import { cn } from '@/lib/utils';

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
        description: 'Please ensure all filters have a value before searching.',
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

      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {/* Search Criteria Card */}
        <Card>
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
            <CardDescription>
              Build a custom search to find exactly what you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Source Selection */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">1. What do you want to search for?</Label>
              <RadioGroup
                value={dataSource}
                onValueChange={handleDataSourceChange}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {dataSources.map(source => (
                  <div key={source.value}>
                    <RadioGroupItem value={source.value} id={source.value} className="sr-only" />
                    <Label
                      htmlFor={source.value}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                        dataSource === source.value && "border-primary"
                      )}
                    >
                      <span className="text-lg font-bold">{source.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <Separator />

            {/* Filters Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">2. Add your filters</Label>
                <RadioGroup
                  value={logic}
                  onValueChange={(value) => setLogic(value as 'AND' | 'OR')}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AND" id="and" />
                    <Label htmlFor="and" className="font-normal">Match all filters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="OR" id="or" />
                    <Label htmlFor="or" className="font-normal">Match any filter</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                {conditions.map((condition) => (
                  <div key={condition.id} className="p-3 border rounded-md space-y-2 relative bg-background/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Field Select */}
                      <Select
                        value={condition.field}
                        onValueChange={(value) => handleUpdateCondition(condition.id, { field: value })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select a field..." /></SelectTrigger>
                        <SelectContent>
                          {fieldOptions[dataSource].map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Operator Select */}
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => handleUpdateCondition(condition.id, { operator: value as Condition['operator'] })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select an operator..." /></SelectTrigger>
                        <SelectContent>
                          {operatorOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Value Input */}
                    <Input
                      placeholder="Enter a value..."
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
                        <span className="sr-only">Remove filter</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={handleAddCondition}>
                <Plus className="mr-2 h-4 w-4" /> Add Filter
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSearch} className="w-full sm:w-auto">
              Search Now
            </Button>
          </CardFooter>
        </Card>

        {/* Results Card */}
        {searchPerformed && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {`Found ${searchResults.length} ${dataSource} matching your criteria.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderResultsTable()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

