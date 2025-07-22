
import { summarizeDatabaseFlow } from "../../../genkit";
import { NextApiRequest, NextApiResponse } from "next";

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
        const result = await summarizeDatabaseFlow({
            databaseDescription,
            collectionsDescription,
        });
        res.status(200).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
