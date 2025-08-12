
// This file is obsolete and can be deleted. 
// The new App Router handler is at /src/app/api/genkit/chat/route.ts
export default function handler(req: any, res: any) {
    res.status(404).json({ error: "This endpoint is obsolete." });
}
