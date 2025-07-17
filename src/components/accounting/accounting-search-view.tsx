
'use client';

import * as React from 'react';
import { LoaderCircle, Mic, Square, Search, AlertTriangle, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { AccountingPageHeader } from "@/components/accounting/page-header";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Import AI Flow
import { generateSearchQuery } from '@/ai/flows/ai-search-flow';

// Import mock data/services
import { type Invoice, type IncomeTransaction, type ExpenseTransaction, getInvoices, getIncomeTransactions, getExpenseTransactions } from '@/services/accounting-service';
import { useAuth } from '@/context/auth-context';


type DataSource = 'invoices' | 'income' | 'expenses';

// --- Result Table Components ---
const InvoicesTable = ({ items }: { items: Invoice[] }) => (
  <Table>
    <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
    <TableBody>
      {items.map((invoice) => (
        <TableRow key={invoice.id}>
          <TableCell>{invoice.invoiceNumber}</TableCell>
          <TableCell>{invoice.clientName}</TableCell>
          <TableCell><Badge variant={invoice.status === 'paid' ? 'secondary' : 'outline'}>{invoice.status}</Badge></TableCell>
          <TableCell className="text-right font-mono">{invoice.originalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
const IncomeTable = ({ items }: { items: IncomeTransaction[] }) => (
  <Table>
    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
    <TableBody>
      {items.map((tx) => (
        <TableRow key={tx.id}>
          <TableCell>{tx.date}</TableCell>
          <TableCell>{tx.description}</TableCell>
          <TableCell>{tx.incomeType}</TableCell>
          <TableCell className="text-right font-mono text-green-600">{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
const ExpensesTable = ({ items }: { items: ExpenseTransaction[] }) => (
  <Table>
    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
    <TableBody>
      {items.map((tx) => (
        <TableRow key={tx.id}>
          <TableCell>{tx.date}</TableCell>
          <TableCell>{tx.description}</TableCell>
          <TableCell>{tx.category}</TableCell>
          <TableCell className="text-right font-mono text-red-600">({tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</TableCell>
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


export default function AccountingSearchView() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Partial<Record<DataSource, any[]>>>({});
  const [searchPerformed, setSearchPerformed] = React.useState(false);
  const { toast } = useToast();
  const baseTextRef = React.useRef('');
  const [allData, setAllData] = React.useState<Record<DataSource, any[]>>({ invoices: [], income: [], expenses: [] });
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const { user } = useAuth();
  
  React.useEffect(() => {
    async function loadData() {
        if (!user) {
            setIsDataLoading(false);
            return;
        }
        setIsDataLoading(true);
        try {
            const [invoices, income, expenses] = await Promise.all([
                getInvoices(user.uid),
                getIncomeTransactions(user.uid),
                getExpenseTransactions(user.uid)
            ]);
            setAllData({ invoices, income, expenses });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load accounting data', description: error.message });
        } finally {
            setIsDataLoading(false);
        }
    }
    loadData();
  }, [user, toast]);

  const {
    isListening,
    startListening,
    stopListening,
    isSupported
  } = useSpeechToText({
    onTranscript: (transcript) => {
      const newText = baseTextRef.current
        ? `${baseTextRef.current} ${transcript}`
        : transcript;
      setSearchQuery(newText);
    }
  });

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      baseTextRef.current = searchQuery.trim();
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

    setIsSearching(true);
    setSearchPerformed(true);
    setSearchResults({});

    try {
      const dataSources: DataSource[] = ['invoices', 'income', 'expenses'];
      const { conditions, logic } = await generateSearchQuery({
        query: searchQuery,
        dataSources,
      });

      const results: Partial<Record<DataSource, any[]>> = {};

      for (const source of dataSources) {
          const dataToSearch = allData[source];
          if (!dataToSearch || dataToSearch.length === 0) continue;

          const sourceResults = dataToSearch.filter(item => {
              const checkCondition = (condition: {field: string, operator: string, value: string}) => {
                  if (!(condition.field in item)) return logic === 'AND'; // Fail open for AND logic if field doesn't exist
                  
                  let itemValue = item[condition.field as keyof typeof item];
                  if (typeof itemValue === 'number') {
                      itemValue = String(itemValue);
                  } else if (itemValue instanceof Date) {
                      itemValue = format(itemValue, 'yyyy-MM-dd');
                  } else if (itemValue === null || itemValue === undefined) {
                      itemValue = '';
                  }

                  const conditionValue = condition.value.toLowerCase();
                  
                  switch (condition.operator) {
                      case 'contains': return (itemValue as string)?.toLowerCase().includes(conditionValue);
                      case 'is': return (itemValue as string)?.toLowerCase() === conditionValue;
                      case 'is_not': return (itemValue as string)?.toLowerCase() !== conditionValue;
                      case 'starts_with': return (itemValue as string)?.toLowerCase().startsWith(conditionValue);
                      case 'ends_with': return (itemValue as string)?.toLowerCase().endsWith(conditionValue);
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
                    {source === 'invoices' && <h3 className="flex items-center text-xl font-semibold mb-2"><FileText className="mr-2 h-5 w-5 text-primary"/> Invoices ({items.length})</h3>}
                    {source === 'income' && <h3 className="flex items-center text-xl font-semibold mb-2"><TrendingUp className="mr-2 h-5 w-5 text-green-500"/> Income ({items.length})</h3>}
                    {source === 'expenses' && <h3 className="flex items-center text-xl font-semibold mb-2"><TrendingDown className="mr-2 h-5 w-5 text-red-500"/> Expenses ({items.length})</h3>}

                    {source === 'invoices' && <InvoicesTable items={items as Invoice[]} />}
                    {source === 'income' && <IncomeTable items={items as IncomeTransaction[]} />}
                    {source === 'expenses' && <ExpensesTable items={items as ExpenseTransaction[]} />}
                </div>
            ))}
        </div>
    );
  };
  
  if (isDataLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full space-y-6">
      <AccountingPageHeader pageTitle="Search" />

      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Universal Accounting Search
        </h1>
        <p className="text-muted-foreground">
          Use natural language to find anything across your accounting data.
        </p>
      </header>

      <div className="space-y-6 max-w-4xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle>What are you looking for?</CardTitle>
            <CardDescription>
              For example, "invoices for client alpha", "software expenses over $50", or "all income from consulting".
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter>
            <Button onClick={handleSearch} className="w-full sm:w-auto" disabled={isSearching}>
              {isSearching ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4"/>}
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
