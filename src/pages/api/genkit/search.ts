
import { aiSearchFlow } from "../../../genkit";
import { NextApiRequest, NextApiResponse } from "next";
import { initGenkit } from "./init";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    initGenkit();

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    const { query, dataSources } = req.body;

    try {
        const result = await aiSearchFlow.run({
            query,
            dataSources,
        });
        res.status(200).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
