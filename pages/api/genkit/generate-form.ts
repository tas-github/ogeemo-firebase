
import { initGenkit } from "./init";
import { generateFormFlow } from "@/lib/ai/generate-form-flow";
import { NextApiRequest, NextApiResponse } from "next";

initGenkit();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    const { topic } = req.body;

    try {
        const result = await generateFormFlow.run({
            topic,
        });
        res.status(200).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
