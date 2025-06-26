
'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';

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
import { Checkbox } from '@/components/ui/checkbox';
import { FileIcon } from '@/components/files/file-icon';

// Import mock data
import { mockContacts, mockFolders as mockContactFolders, type Contact } from '@/data/contacts';
import { initialProjects, type Project } from '@/data/projects';
import { getInitialEvents } from '@/data/events';
import { type Event } from '@/types/calendar';
import { mockFiles, mockFolders as mockFileFolders, type FileItem } from '@/data/files';
import { type Email, mockEmails } from '@/data/emails';

type DataSource = 'contacts' | 'projects' | 'tasks' | 'files' | 'emails';

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
  { value: 'files', label: 'Files' },
  { value: 'emails', label: 'Emails' },
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
  files: [
    { value: 'name', label: 'File Name' },
    { value: 'type', label: 'File Type' },
  ],
  emails: [
    { value: 'from', label: 'From' },
    { value: 'subject', label: 'Subject' },
    { value: 'text', label: 'Body' },
  ],
};

const operatorOptions: { value: Condition['operator']; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'is', label: 'Is' },
  { value: 'is_not', label: 'Is Not' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
];

// Result Table Components
const ContactsTable = ({ items }: { items: Contact[] }) => (
  <Table>
    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Folder</TableHead></TableRow></TableHeader>
    <TableBody>
      {items.map((contact) => (
        <TableRow key={contact.id}>
          <TableCell>{contact.name}</TableCell>
          <TableCell>{contact.email}</TableCell>
          <TableCell>{mockContactFolders.find(f => f.id === contact.folderId)?.name || 'N/A'}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const ProjectsTable = ({ items }: { items: Project[] }) => (
  <Table>
    <TableHeader><TableRow><TableHead>Project Name</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
    <TableBody>
      {items.map((project) => (
        <TableRow key={project.id}>
          <TableCell>{project.name}</TableCell>
          <TableCell>{project.description}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const TasksTable = ({ items }: { items: Event[] }) => (
  <Table>
    <TableHeader><TableRow><TableHead>Task Title</TableHead><TableHead>Status</TableHead><TableHead>Project</TableHead></TableRow></TableHeader>
    <TableBody>
      {items.map((task) => (
        <TableRow key={task.id}>
          <TableCell>{task.title}</TableCell>
          <TableCell>{task.status}</TableCell>
          <TableCell>{initialProjects.find(p => p.id === task.projectId)?.name || 'N/A'}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const FilesTable = ({ items }: { items: FileItem[] }) => (
  <Table>
    <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>File Name</TableHead><TableHead>Type</TableHead><TableHead>Folder</TableHead></TableRow></TableHeader>
    <TableBody>
      {items.map((file) => (
        <TableRow key={file.id}>
          <TableCell><FileIcon fileType={file.type} /></TableCell>
          <TableCell>{file.name}</TableCell>
          <TableCell>{file.type}</TableCell>
          <TableCell>{mockFileFolders.find(f => f.id === file.folderId)?.name || 'N/A'}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const EmailsTable = ({ items }: { items: Email[] }) => (
  <Table>
    <TableHeader><TableRow><TableHead>From</TableHead><TableHead>Subject</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
    <TableBody>
      {items.map((email) => (
        <TableRow key={email.id}>
          <TableCell>{email.from}</TableCell>
          <TableCell>{email.subject}</TableCell>
          <TableCell>{format(new Date(email.date), 'PP')}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default function AdvancedSearchPage() {
  const [selectedDataSources, setSelectedDataSources] = React.useState<DataSource[]>(['contacts']);
  const [conditions, setConditions] = React.useState<Condition[]>([{ id: 1, field: 'name', operator: 'contains', value: '' }]);
  const [logic, setLogic] = React.useState<'AND' | 'OR'>('AND');
  const [searchResults, setSearchResults] = React.useState<Partial<Record<DataSource, any[]>>>({});
  const [searchPerformed, setSearchPerformed] = React.useState(false);
  const { toast } = useToast();

  const allTasks = React.useMemo(() => getInitialEvents(), []);
  const allFiles = React.useMemo(() => mockFiles, []);
  
  const allFieldOptions = React.useMemo(() => {
    const allOptions = Object.values(fieldOptions).flat();
    const uniqueOptions = Array.from(new Map(allOptions.map(item => [item.value, item])).values());
    return uniqueOptions.sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const handleDataSourceChange = (sourceValue: DataSource) => {
    setSelectedDataSources(prev => {
        const newSources = prev.includes(sourceValue)
            ? prev.filter(s => s !== sourceValue)
            : [...prev, sourceValue];
        
        if (newSources.length === 0 && conditions.length === 0) {
            setConditions([{ id: 1, field: allFieldOptions[0].value, operator: 'contains', value: '' }]);
        }
        
        return newSources;
    });
  };

  const handleSelectAllDataSources = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedDataSources(dataSources.map(ds => ds.value));
    } else {
      setSelectedDataSources([]);
    }
  };

  const handleAddCondition = () => {
    const newId = (conditions.at(-1)?.id || 0) + 1;
    setConditions([
      ...conditions,
      { id: newId, field: allFieldOptions[0].value, operator: 'contains', value: '' },
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

    if (selectedDataSources.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data Source Selected',
        description: 'Please select at least one data source to search.',
      });
      return;
    }

    const dataMap: Record<DataSource, any[]> = {
      contacts: mockContacts,
      projects: initialProjects,
      tasks: allTasks,
      files: allFiles,
      emails: mockEmails,
    };
    
    const results: Partial<Record<DataSource, any[]>> = {};

    for (const source of selectedDataSources) {
        const dataToSearch = dataMap[source];
        if (!dataToSearch) continue;

        const sourceResults = dataToSearch.filter(item => {
            const checkCondition = (condition: Condition) => {
                if (!(condition.field in item)) {
                    return logic === 'AND' ? true : false;
                }
                const itemValue = (item[condition.field as keyof typeof item] as string)?.toLowerCase() || '';
                const conditionValue = condition.value.toLowerCase();
                
                switch (condition.operator) {
                    case 'contains': return itemValue.includes(conditionValue);
                    case 'is': return itemValue === conditionValue;
                    case 'is_not': return itemValue !== conditionValue;
                    case 'starts_with': return itemValue.startsWith(conditionValue);
                    case 'ends_with': return itemValue.endsWith(conditionValue);
                    default: return false;
                }
            };

            if (logic === 'AND') {
                return conditions.every(checkCondition);
            } else {
                return conditions.some(checkCondition);
            }
        });
        
        if (sourceResults.length > 0) {
            results[source] = sourceResults;
        }
    }

    setSearchResults(results);
    setSearchPerformed(true);
  };

  const renderResults = () => {
    const resultEntries = Object.entries(searchResults);
    
    if (resultEntries.length === 0) {
      return (
        <div className="flex h-full min-h-48 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">No results found.</p>
        </div>
      );
    }
    
    return (
        <div className="space-y-6">
            {resultEntries.map(([source, items]) => (
                <div key={source}>
                    <h3 className="text-xl font-semibold mb-2 capitalize">{source} ({items.length})</h3>
                    {source === 'contacts' && <ContactsTable items={items as Contact[]} />}
                    {source === 'projects' && <ProjectsTable items={items as Project[]} />}
                    {source === 'tasks' && <TasksTable items={items as Event[]} />}
                    {source === 'files' && <FilesTable items={items as FileItem[]} />}
                    {source === 'emails' && <EmailsTable items={items as Email[]} />}
                </div>
            ))}
        </div>
    );
  };
  
  const allSourcesSelected = selectedDataSources.length === dataSources.length;
  const someSourcesSelected = selectedDataSources.length > 0 && !allSourcesSelected;

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full space-y-6">
      <ReportsPageHeader pageTitle="Advanced Search" />

      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Advanced Search
        </h1>
        <p className="text-muted-foreground">
          Perform deep, conditional searches across all your data to find exactly what you need.
        </p>
      </header>

      <div className="space-y-6 max-w-4xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
            <CardDescription>
              Build a custom search to find exactly what you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">1. What do you want to search for?</Label>
              <div className="flex items-center space-x-2">
                 <Checkbox
                    id="select-all"
                    checked={allSourcesSelected || someSourcesSelected ? (allSourcesSelected ? true : 'indeterminate') : false}
                    onCheckedChange={handleSelectAllDataSources}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    Select All
                  </Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dataSources.map(source => (
                  <div key={source.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={source.value}
                      checked={selectedDataSources.includes(source.value)}
                      onCheckedChange={() => handleDataSourceChange(source.value)}
                    />
                    <Label htmlFor={source.value} className="font-normal w-full cursor-pointer">{source.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />

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
                      <Select
                        value={condition.field}
                        onValueChange={(value) => handleUpdateCondition(condition.id, { field: value })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select a field..." /></SelectTrigger>
                        <SelectContent>
                          {allFieldOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

        {searchPerformed && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {Object.values(searchResults).reduce((acc, val) => acc + val.length, 0)} total results matching your criteria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderResults()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
