
import { initGenkit } from "./init";
import { summarizeDatabase } from "@/lib/ai/summarize-database";
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

    const { databaseDescription, collectionsDescription } = req.body;

    try {
        const result = await summarizeDatabase.run({
            databaseDescription,
            collectionsDescription,
        });
        res.status(200).json(.result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
