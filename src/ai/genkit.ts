import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins = [];
if (process.env.GOOGLE_API_KEY) {
  plugins.push(googleAI());
} else {
  console.warn(
    'WARNING: GOOGLE_API_KEY environment variable is not set. Genkit AI features will be disabled.'
  );
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.0-flash',
});
