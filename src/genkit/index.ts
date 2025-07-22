
import { configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase';
import { dotprompt } from '@genkit-ai/dotprompt';
import { ai } from './ai';

// This is the single, server-side entry point for Genkit.
// By initializing here, we ensure that the Genkit plugins are only
// loaded in a pure server environment, which resolves the build errors.
configureGenkit({
  plugins: [googleAI(), firebase(), dotprompt({
    prompt: {
      model: googleAI.model('gemini-1.5-flash'),
    },
  })],
  logSinks: ['firebase'],
  enableTracingAndMetrics: true,
});

// We now export all of our flows from this single file.
// The API routes will import from here, creating a clean separation
// between the server-side AI logic and the client-side application.
export * from './ogeemo-chat';
export * from './ai-search-flow';
export * from './generate-form-flow';
export * from './summarize-database';
export { ai };
