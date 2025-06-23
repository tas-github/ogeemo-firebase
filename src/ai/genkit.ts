import {genkit, type GenkitConfig} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

config();

const genkitConfig: GenkitConfig = {
  plugins: [],
};

export let aiFeaturesEnabled = false;

if (process.env.GOOGLE_API_KEY) {
  genkitConfig.plugins?.push(googleAI());
  genkitConfig.model = 'googleai/gemini-2.0-flash';
  aiFeaturesEnabled = true;
} else {
  console.warn(
    'WARNING: GOOGLE_API_KEY environment variable is not set. Genkit AI features will be disabled.'
  );
}

export const ai = genkit(genkitConfig);
