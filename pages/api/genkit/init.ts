
import { configureGenkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { firebase } from "@genkit-ai/firebase";
import { dotprompt } from "@genkit-ai/dotprompt";

export function initGenkit() {
    configureGenkit({
        plugins: [
            googleAI(),
            firebase(),
            dotprompt()
        ],
        logSinks: ["firebase"],
        enableTracingAndMetrics: true,
    });
}
