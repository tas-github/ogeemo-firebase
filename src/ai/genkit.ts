import {genkit, type GenkitConfig} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const genkitConfig: GenkitConfig = {
  plugins: [],
};

export const aiFeaturesEnabled = !!process.env.GOOGLE_API_KEY;

if (aiFeaturesEnabled) {
  genkitConfig.plugins?.push(googleAI());
  genkitConfig.model = 'googleai/gemini-1.5-flash-latest';
  
} else {
  console.warn(
    'WARNING: GOOGLE_API_KEY environment variable is not set. Genkit AI features will be disabled.'
  );
}

export const ai = genkit(genkitConfig);
