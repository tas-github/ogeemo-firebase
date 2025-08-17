// This file is obsolete and has been replaced by the App Router handler
// at /src/app/api/genkit/chat/route.ts.
// It is now safe to delete this file.
export default function handler(req: any, res: any) {
    res.status(404).json({ error: "This endpoint is obsolete." });
}
