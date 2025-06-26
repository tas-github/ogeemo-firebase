
export const REPORT_TEMPLATE_MIMETYPE = 'application/vnd.og-report-template+html';

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number; // in bytes
  modifiedAt: Date;
  folderId: string;
  content?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
}

export const mockFolders: FolderItem[] = [
  { id: 'folder-reports', name: 'Report Templates', parentId: null },
  { id: 'folder-1', name: 'Client Documents', parentId: null },
  { id: 'folder-2', name: 'Invoices', parentId: 'folder-1' },
  { id: 'folder-3', name: 'Marketing Assets', parentId: 'folder-1' },
  { id: 'folder-4', name: 'Internal Projects', parentId: null },
  { id: 'folder-5', name: 'Website V2', parentId: 'folder-4' },
  { id: 'folder-6', name: 'Design', parentId: 'folder-5' },
  { id: 'folder-7', name: 'Development', parentId: 'folder-5' },
];

export const mockFiles: FileItem[] = [
  {
    id: 'file-1',
    name: 'Website_Redesign_Brief.pdf',
    type: 'application/pdf',
    size: 1204857,
    modifiedAt: new Date('2024-07-20T10:00:00Z'),
    folderId: 'folder-6',
  },
  {
    id: 'file-2',
    name: 'Q1_Financials.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 34567,
    modifiedAt: new Date('2024-07-21T14:30:00Z'),
    folderId: 'folder-1',
  },
  {
    id: 'file-3',
    name: 'Invoice_INV-2024-001.pdf',
    type: 'application/pdf',
    size: 78234,
    modifiedAt: new Date('2024-07-22T09:00:00Z'),
    folderId: 'folder-2',
  },
  {
    id: 'file-4',
    name: 'Invoice_INV-2024-002.pdf',
    type: 'application/pdf',
    size: 81234,
    modifiedAt: new Date('2024-07-25T11:00:00Z'),
    folderId: 'folder-2',
  },
  {
    id: 'file-5',
    name: 'logo_final.png',
    type: 'image/png',
    size: 56345,
    modifiedAt: new Date('2024-07-19T18:00:00Z'),
    folderId: 'folder-3',
  },
  {
    id: 'file-6',
    name: 'social_media_banner.jpg',
    type: 'image/jpeg',
    size: 980432,
    modifiedAt: new Date('2024-07-23T16:45:00Z'),
    folderId: 'folder-3',
  },
  {
    id: 'file-7',
    name: 'api-endpoints.json',
    type: 'application/json',
    size: 1234,
    modifiedAt: new Date('2024-07-26T10:15:00Z'),
    folderId: 'folder-7',
  },
  {
    id: 'file-8',
    name: 'Component.tsx',
    type: 'text/javascript',
    size: 2456,
    modifiedAt: new Date('2024-07-26T11:30:00Z'),
    folderId: 'folder-7',
  },
  {
    id: 'file-9',
    name: 'landing-page-v1.fig',
    type: 'application/octet-stream',
    size: 4500123,
    modifiedAt: new Date('2024-07-24T09:00:00Z'),
    folderId: 'folder-6',
  },
  {
    id: 'file-10',
    name: 'landing-page-v2.fig',
    type: 'application/octet-stream',
    size: 5100234,
    modifiedAt: new Date('2024-07-25T15:20:00Z'),
    folderId: 'folder-6',
  },
  {
    id: 'file-11',
    name: 'How to create voice to text in a manager.',
    type: REPORT_TEMPLATE_MIMETYPE,
    size: 2800,
    modifiedAt: new Date(),
    folderId: 'folder-reports',
    content: `<h3>How to Create a Voice-to-Text Feature</h3>
<p>This report outlines the standard procedure for integrating voice-to-text functionality into a component within the Ogeemo platform. The process leverages the custom <code>useSpeechToText</code> hook, which abstracts the browser's Web Speech API.</p>
<h4>Step 1: Import the Hook</h4>
<p>In your component file, import the <code>useSpeechToText</code> hook and any necessary UI components like <code>Button</code>, <code>Input</code>, and icons from <code>lucide-react</code>.</p>
<pre><code class="language-tsx">import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Square } from 'lucide-react';
import { useState, useRef } from 'react';</code></pre>
<h4>Step 2: Initialize State and the Hook</h4>
<p>Set up state variables to hold the input text and a ref to store text content before dictation begins. Then, initialize the hook, providing a function to handle the incoming transcript.</p>
<pre><code class="language-tsx">const [inputValue, setInputValue] = useState('');
const baseTextRef = useRef('');

const {
  isListening,
  startListening,
  stopListening,
  isSupported
} = useSpeechToText({
  onTranscript: (transcript) => {
    // Combine base text with new transcript
    const newText = baseTextRef.current
      ? \`\${baseTextRef.current} \${transcript}\`
      : transcript;
    setInputValue(newText);
  }
});</code></pre>
<h4>Step 3: Create the UI Elements</h4>
<p>Add an input field and a microphone button to your component's JSX. The button's appearance and behavior should change based on the <code>isListening</code> and <code>isSupported</code> states from the hook.</p>
<pre><code class="language-jsx">&lt;div className="relative"&gt;
  &lt;Input
    value={inputValue}
    onChange={(e) => setInputValue(e.target.value)}
    placeholder="Type or click the mic to speak..."
  /&gt;
  &lt;Button
    type="button"
    variant={isListening ? 'destructive' : 'ghost'}
    size="icon"
    className="absolute right-2 top-2 h-7 w-7"
    onClick={handleMicClick}
    disabled={isSupported === false}
    title={isListening ? 'Stop dictation' : 'Dictate text'}
  &gt;
    {isListening ? &lt;Square className="h-4 w-4" /&gt; : &lt;Mic className="h-4 w-4" /&gt;}
  &lt;/Button&gt;
&lt;/div&gt;</code></pre>
<h4>Step 4: Implement the Click Handler</h4>
<p>Create the function that will be called when the microphone button is clicked. This function toggles the listening state and saves the current input value before starting a new dictation.</p>
<pre><code class="language-tsx">const handleMicClick = () => {
  if (isListening) {
    stopListening();
  } else {
    // Save current text to prepend to transcript
    baseTextRef.current = inputValue.trim();
    startListening();
  }
};</code></pre>
<p>By following these steps, you can consistently and reliably add voice-to-text capabilities to any manager or component in the application.</p>
`,
  },
];
