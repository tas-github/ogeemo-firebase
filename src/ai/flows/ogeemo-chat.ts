
'use server';

import { ai } from "@/ai/ai";
import { z } from "zod";
import { MessageData } from 'genkit';
import { googleAI } from "@genkit-ai/googleai";
import fs from 'fs';
import path from 'path';

// Function to read knowledge base files
function getKnowledgeBase(): string {
  try {
    const guidelinesPath = path.join(process.cwd(), 'STUDIO_GUIDELINES.md');
    const trademarkPath = path.join(process.cwd(), 'TRADEMARK_DESCRIPTION.md');
    const bksPath = path.join(process.cwd(), 'src/app/(app)/accounting/bks/page.tsx');

    const guidelinesContent = fs.readFileSync(guidelinesPath, 'utf-8');
    const trademarkContent = fs.readFileSync(trademarkPath, 'utf-8');
    const bksContent = fs.readFileSync(bksPath, 'utf-8');
    
    // Extract relevant text from the BKS page component for the AI
    const bksTextContent = `
      - The title is "Bookkeeping Kept Simple".
      - The description is "Your straightforward path to financial clarity. Start with the basics, expand when you're ready."
      - The core concept is a simple cash-based accounting system focusing on two main ledgers: "Manage Income" and "Manage Expenses".
      - By recording all incoming and outgoing money, users can prepare for taxes and understand their business's financial health.
    `;

    const ogeemailTextContent = `
      - Ogeemo has a built-in email client called "OgeeMail".
      - Users can access it via the "OgeeMail" link in the main menu.
      - To compose a new email, the user should navigate to the OgeeMail section and click the "Compose" button. This will take them to the email composition page.
    `;

    const projectManagerTextContent = `
      - The Project Manager is where users can see all their projects.
      - Each project is a container for tasks.
      - Clicking on a project in the Project Manager will take the user to the Task Board for that specific project.
      - Users can also start planning a project from this view.
    `;
    
    const taskManagerTextContent = `
      - The Task Manager displays tasks in a Kanban board format with columns for "To Do", "In Progress", and "Done".
      - Tasks can be moved between columns to update their status.
      - The Task Manager is the primary view for managing the day-to-day work within a project.
    `;

    const contactsManagerTextContent = `
      - The Contacts manager is for organizing all client and personal contacts.
      - Contacts are organized into folders.
      - Users can create, edit, and delete contacts and folders.
      - It supports importing contacts from Google.
    `;

    const calendarManagerTextContent = `
      - The Calendar allows users to manage their schedule, events, and appointments.
      - It features multiple views (day, week, month) and supports drag-and-drop for rescheduling.
      - Events in the calendar can be linked to projects and contacts.
    `;

    const timeManagerTextContent = `
      - The Time Manager is used to track time spent on tasks.
      - It features a live timer that can be started, paused, and stopped.
      - Logged time can be associated with specific clients and projects, and marked as billable.
    `;

    return `
      <knowledge_base>
        <document name="STUDIO_GUIDELINES.md">
          ${guidelinesContent}
        </document>
        <document name="TRADEMARK_DESCRIPTION.md">
          ${trademarkContent}
        </document>
        <document name="BKS_INFO">
          ${bksTextContent}
        </document>
        <document name="OGEEMAIL_INFO">
          ${ogeemailTextContent}
        </document>
        <document name="PROJECT_MANAGER_INFO">
          ${projectManagerTextContent}
        </document>
        <document name="TASK_MANAGER_INFO">
          ${taskManagerTextContent}
        </document>
        <document name="CONTACTS_MANAGER_INFO">
          ${contactsManagerTextContent}
        </document>
        <document name="CALENDAR_MANAGER_INFO">
          ${calendarManagerTextContent}
        </document>
        <document name="TIME_MANAGER_INFO">
          ${timeManagerTextContent}
        </document>
      </knowledge_base>
    `;
  } catch (error) {
    console.error("Error reading knowledge base files:", error);
    return "<knowledge_base>Error: Could not load application documentation.</knowledge_base>";
  }
}

const systemPromptTemplate = `
You are Ogeemo, an AI assistant for the Ogeemo platform. Your primary role is to help users understand and use the Ogeemo application.
Your secondary role is to act as a general business assistant.
Your persona is helpful, knowledgeable, and slightly formal.
You must always respond in markdown format.

You have been provided with a knowledge base containing specific documentation about the Ogeemo application.
You MUST prioritize the information in this knowledge base when answering questions about Ogeemo's features, purpose, or functionality.
If a user asks a question you cannot answer from the provided history or the knowledge base, state that you do not have that information and then add the following text on a new line: "The Ogeemo Assistant is still under development and will be gaining even more power as we continue to enhance the Ogeemo app.". Do not make up information.

Here is the knowledge base:
{{{knowledgeBase}}}
`;

// Define a more specific Zod schema for the history objects to match the client
const messageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({
    text: z.string(),
  })),
});

const ogeemoChatFlowInputSchema = z.object({
  message: z.string(),
  history: z.array(messageSchema).optional(),
});

export async function ogeemoChatFlow(input: z.infer<typeof ogeemoChatFlowInputSchema>): Promise<{ reply: string }> {
  const { message, history } = input;
  
  const conversationHistory: MessageData[] = history || [];

  const messages: MessageData[] = [
    ...conversationHistory,
    { role: 'user', content: [{ text: message }] }
  ];
  
  const knowledgeBase = getKnowledgeBase();
  
  // Replace the placeholder in the template with the actual knowledge base content.
  const finalSystemPrompt = systemPromptTemplate.replace('{{knowledgeBase}}', knowledgeBase);

  const result = await ai.generate({
    model: googleAI.model('gemini-1.5-flash'),
    messages: messages,
    config: {
      temperature: 0.7,
    },
    system: finalSystemPrompt,
  });

  return {
    reply: result.text,
  };
}
