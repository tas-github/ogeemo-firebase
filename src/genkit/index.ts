
import { configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { dotprompt } from '@genkit-ai/dotprompt';
import { ai } from '@/ai/ai';

// This is the single, server-side entry point for Genkit.
// By initializing here, we ensure that the Genkit plugins are only
// loaded in a pure server environment, which resolves the build errors.
configureGenkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY }), firebase(), dotprompt({
    prompt: {
      model: googleAI.model('gemini-1.5-flash'),
    },
  })],
  logSinks: ['firebase'],
  enableTracingAndMetrics: true,
});

// We now export all of our flows from this single file.
// Client components will import server actions from their respective files in src/ai/flows, not from here.
export * from '@/ai/flows/ogeemo-chat';
export * from '@/ai/flows/ai-search-flow';
export * from '@/ai/flows/generate-form-flow';
export * from '@/ai/flows/summarize-database';
export * from '@/ai/flows/experimental-chat-flow';
export * from '@/ai/tools/contact-tools';
export * from '@/services/project-service'; // Add this export
export { ai };
