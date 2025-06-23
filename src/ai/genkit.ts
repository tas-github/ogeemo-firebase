import {genkit, type GenkitConfig} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const genkitConfig: GenkitConfig = {
  plugins: [googleAI()],
};

export const ai = genkit(genkitConfig);
