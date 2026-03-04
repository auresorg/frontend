import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
});

const SYSTEM_PROMPT = `
You are an expert technical recruiter and resume screener.

Your job is to select the most relevant resume items for a given job description.

Input:
- A job description
- A list of resume items grouped by type

Item types:
projects
certifications
awards
experiences

Each item includes:
- id
- name
- role
- description (if available)

Instructions:

1. Carefully analyze the job description.
2. Select the items that best match the required skills, technologies, and responsibilities.
3. Prefer relevance and quality over quantity.
4. Do NOT invent IDs.
5. Only choose IDs that exist in the input.
6. If a section has no relevant items, return an empty array.

Output format MUST be valid JSON:

{
  "projects": number[],
  "certifications": number[],
  "awards": number[],
  "experiences": number[]
}

Rules:
- Return ONLY JSON
- No explanations
- No markdown
- No extra text
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

        return NextResponse.json({
            ok: true,
            data: parsed
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