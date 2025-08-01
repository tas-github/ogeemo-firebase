
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

// By initializing the googleAI() plugin here, the `ai` object
// becomes aware of all the available Google AI models.
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});
