import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

const SYSTEM_PROMPT = `
You are an expert technical recruiter and resume screener.

Your job is to select the most relevant resume items for a given job description.

INPUT
You will receive:
- a job description
- resume items grouped by category
- VALID ID lists for each category

CATEGORIES
projects
certifications
awards
experiences

Each item contains:
- id
- name
- role
- description

CRITICAL RULES

1. You MUST ONLY select IDs from the VALID ID lists provided.
2. NEVER invent new IDs.
3. NEVER merge numbers together.

SELECTION LOGIC

For each category:

projects
certifications
awards
experiences

- Select all items that strongly match the job description.
- If nothing strongly matches, select 2 items that are closest in relevance.
- If there are less than 2 items available, select all of them.
- NEVER return an empty selection.
- If there is no direct match, choose the most loosely related items.

OUTPUT FORMAT

Return strictly valid JSON using this structure.

IMPORTANT:
IDs MUST be returned as a comma-separated string of numbers.

Example:
"13,15"

NOT:
[13,15]
NOT:
[1315]

Structure:

{
  "projects": "13,15",
  "certifications": "2",
  "awards": "1",
  "experiences": "71"
}

Rules:
Return ONLY JSON
No explanations
No markdown
No extra text
`;

export async function POST(req: NextRequest) {
    try {

        /* ---------- AUTH ---------- */

        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(null, { status: 400 });
        }

        const token = authHeader.split(" ")[1];

        const publicKey = process.env.PUBLIC_KEY?.replace(/\\n/g, "\n");
        if (!publicKey) {
            return NextResponse.json(null, { status: 500 });
        }

        verify(token, publicKey, { algorithms: ["RS256"] });

        /* ---------- INPUT ---------- */

        const {
            jobDescription,
            projects = [],
            certifications = [],
            awards = [],
            experiences = []
        } = await req.json();

        if (!jobDescription || typeof jobDescription !== "string") {
            return NextResponse.json(
                { error: "Invalid job description" },
                { status: 400 }
            );
        }

        const inputPayload = {
            jobDescription,
            validIds: {
                projects: projects.map((p: any) => p.id),
                certifications: certifications.map((c: any) => c.id),
                awards: awards.map((a: any) => a.id),
                experiences: experiences.map((e: any) => e.id)
            },
            projects,
            certifications,
            awards,
            experiences
        };

        /* ---------- AI ---------- */

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            temperature: 0,
            top_p: 1,
            max_completion_tokens: 2048,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: JSON.stringify(inputPayload)
                }
            ]
        });

        const raw = completion.choices[0]?.message?.content;

        if (!raw) {
            throw new Error("Empty AI response");
        }

        const parsed = JSON.parse(raw);

        const toArray = (s: string) =>
            s
                .split(",")
                .map((x) => Number(x.trim()))
                .filter((n) => !Number.isNaN(n));

        const result = {
            projects: toArray(parsed.projects || ""),
            certifications: toArray(parsed.certifications || ""),
            awards: toArray(parsed.awards || ""),
            experiences: toArray(parsed.experiences || "")
        };

        return NextResponse.json({
            ok: true,
            data: result
        });

    } catch (err) {

        if (err instanceof Error && err.name === "TokenExpiredError") {
            return NextResponse.json(
                { error: "Token expired" },
                { status: 401 }
            );
        }

        console.error("JD selection error:", err);

        return NextResponse.json(
            { error: "Failed to process job description" },
            { status: 500 }
        );
    }
}