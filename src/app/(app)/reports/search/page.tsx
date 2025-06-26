
'use client';

import * as React from 'react';
import { LoaderCircle, Mic, Square } from 'lucide-react';
import { format } from 'date-fns';

import { ReportsPageHeader } from "@/components/reports/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { FileIcon } from '@/components/files/file-icon';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { cn } from '@/lib/utils';

// Import AI Flow
import { generateSearchQuery } from '@/ai/flows/ai-search-flow';

// Import mock data
import { mockContacts, mockFolders as mockContactFolders, type Contact } from '@/data/contacts';
import { initialProjects, type Project } from '@/data/projects';
import { getInitialEvents } from '@/data/events';
import { type Event } from '@/types/calendar';
import { mockFiles, mockFolders as mockFileFolders, type FileItem } from '@/data/files';
import { type Email, mockEmails } from '@/data/emails';

type DataSource = 'contacts' | 'projects' | 'tasks' | 'files' | 'emails';

interface Condition {
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

// --- Result Table Components (unchanged) ---
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
// --- End Result Table Components ---

const SearchResultsSkeleton = () => (
    <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-16 w-full" />
        </div>
    </div>
);


export default function AdvancedSearchPage() {
  const [selectedDataSources, setSelectedDataSources] = React.useState<DataSource[]>(['contacts']);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Partial<Record<DataSource, any[]>>>({});
  const [searchPerformed, setSearchPerformed] = React.useState(false);
  const { toast } = useToast();

  const allTasks = React.useMemo(() => getInitialEvents(), []);
  const allFiles = React.useMemo(() => mockFiles, []);
  
  const {
    isListening,
    startListening,
    stopListening,
    isSupported
  } = useSpeechToText({
    onTranscript: (transcript) => {
      setSearchQuery(transcript);
    }
  });

  const handleDataSourceChange = (sourceValue: DataSource) => {
    setSelectedDataSources(prev => 
        prev.includes(sourceValue)
            ? prev.filter(s => s !== sourceValue)
            : [...prev, sourceValue]
    );
  };

  const handleSelectAllDataSources = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedDataSources(dataSources.map(ds => ds.value));
    } else {
      setSelectedDataSources([]);
    }
  };
  
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Search',
        description: 'Please describe what you want to search for.',
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

    setIsSearching(true);
    setSearchPerformed(true);
    setSearchResults({});

    try {
      const { conditions, logic } = await generateSearchQuery({
        query: searchQuery,
        dataSources: selectedDataSources,
      });

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
                  if (!(condition.field in item)) return logic === 'AND';
                  
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

    } catch (error) {
      console.error("AI Search Error:", error);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'The AI could not process your request. Please try rephrasing your search.',
      });
      setSearchPerformed(false);
    } finally {
      setIsSearching(false);
    }
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
              Use AI to find exactly what you're looking for across all your apps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-base font-semibold">1. What do you want to search for?</label>
              <div className="flex items-center space-x-2">
                 <Checkbox
                    id="select-all"
                    checked={allSourcesSelected || someSourcesSelected ? (allSourcesSelected ? true : 'indeterminate') : false}
                    onCheckedChange={handleSelectAllDataSources}
                  />
                  <label htmlFor="select-all" className="font-medium">
                    Select All
                  </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {dataSources.map(source => (
                  <div key={source.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={source.value}
                      checked={selectedDataSources.includes(source.value)}
                      onCheckedChange={() => handleDataSourceChange(source.value)}
                    />
                    <label htmlFor={source.value} className="font-normal w-full cursor-pointer">{source.label}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-base font-semibold">2. Define Search Objective</label>
                <p className="text-sm text-muted-foreground">
                  Describe what you're looking for. For example, "find all emails from John Doe about Project Phoenix" or "show me all incomplete tasks".
                </p>
              </div>
              <div className="relative">
                <Textarea
                  placeholder="I'm looking for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  rows={3}
                  disabled={isSearching}
                  className="pr-12"
                />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute bottom-2 right-2 h-8 w-8",
                        isListening && "text-destructive"
                    )}
                    onClick={handleMicClick}
                    disabled={isSupported === false || isSearching}
                    title={isSupported === false ? "Voice not supported" : (isListening ? "Stop dictation" : "Dictate search query")}
                >
                    {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span className="sr-only">{isListening ? "Stop dictation" : "Dictate search query"}</span>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSearch} className="w-full sm:w-auto" disabled={isSearching}>
              {isSearching ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSearching ? 'Searching with AI...' : 'Search Now'}
            </Button>
          </CardFooter>
        </Card>

        {searchPerformed && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {isSearching ? 'AI is analyzing your request...' : `Found ${Object.values(searchResults).reduce((acc, val) => acc + (val?.length || 0), 0)} total results matching your criteria.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSearching ? <SearchResultsSkeleton /> : renderResults()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
