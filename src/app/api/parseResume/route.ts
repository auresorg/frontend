import { NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import Groq from "groq-sdk"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

const SYSTEM_PROMPT = `
You are a resume parser.

Return ONLY valid JSON.
No explanations. No markdown. No comments.

Rules:
- Do NOT generate IDs
- Omit missing fields
- Use ISO date strings where possible
- Arrays must exist (empty if none)
- Do NOT hallucinate

Dates (CRITICAL - must follow exactly):

- All dates MUST be strings.
- Allowed formats ONLY:

1. Full date (preferred when available):
   "YYYY-MM-DD"
   Example: "2024-09-15"

2. Month-level date (when day is unknown):
   "YYYY-MM"
   Example: "2024-09"

3. Year-only date (ONLY if nothing else is known):
   "YYYY"
   Example: "2023"

4. Ongoing roles:
   - Use null ONLY where explicitly allowed (e.g. Experience.endDate)
   - Do NOT use empty strings for ongoing roles.

Rules:
- Do NOT invent days or months.
- If only month+year exists, use "YYYY-MM".
- If only year exists, use "YYYY".
- Never use natural language dates.
- Never use formats like "Sep 2024", "09/2024", "2024/09".

Structure of Projects:

Project {
    name: string;
    repo: string; FORMAT: "username"/"reponame" 
    tech: string[];
    description: string;
    role: 'fullstack' | 'backend' | 'frontend' | 'devops' | 'mobile' | 'aiml' | 'product' | 'qa' | 'designer' | 'blockchain';
    startDate: string;
    endDate: string;
    url: string; DEFAULT: https://github.com/<VALUE OF REPO>
};

Education {
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    grade: string;
    description: string;
}

Certification {
    title: string;
    platform: string;
    description: string;
    role: '' | 'fullstack' | 'backend' | 'frontend' | 'devops' | 'mobile' | 'aiml' | 'product' | 'qa' | 'designer' | 'blockchain';
    url: string;
    completedOn: string;
};

Award {
    title: string;
    issuer: string;
    type: string;
    description: string;
    date: string;
    role: string;
}

Experience {
    title: string;
    company: string;
    startDate: string;
    endDate: string | null;
    description: string;
    role: string;
}

Return exactly this JSON schema:

{
  "user": {
    "firstName": string,
    "lastName": string,
    "linkedin": string,
    "portfolio": string,
    "leetcode": string
  },
  "projects": Project[],
  "education": Education[],
  "certifications": Certification[],
  "awards": Award[],
  "experience": Experience[]
}
`

const BULK_WITH_ROLE_PROMPT = `
You are a senior technical resume writer who thinks like an engineering hiring manager.

Your job is to convert EACH item in a JSON ARRAY into **one strong resume bullet written as a single sentence**.

Each array item represents ONE of:
- project
- work experience
- certification
- award

Treat EACH item independently.

Do not treat this as a formatting task. Treat it as causal writing.

For EACH item, mentally reason through:
- What was done?
- Why it was done (context or problem, if it adds value)
- How it was done (skills, tools, methods)
- What changed as a result (outcome, validation, learning, or impact)

This is fundamentally **STAR writing**, but you may compress or reorder elements naturally.
Small solo tasks may omit explicit situation.
Large or complex efforts should include context if it improves clarity.

Rules for EACH bullet:
- Write **one sentence only**
- Use action-driven, concrete language
- Focus on accomplishments, not responsibilities
- Outcomes do NOT need to be external; internal results are valid
- Quantify only when it adds meaning
- Do NOT include names, titles, issuers, platforms, companies, or project names
- Avoid fluff or vague responsibility statements

Determine whether EACH bullet genuinely follows:
- STAR
- CAR
- XYZ

If none apply, set format to "None".

Infer the **single most relevant technical role** for EACH item
based strictly on the skills and work demonstrated.
Donot treat it as fullstack unless and until you see clear evidence of both frontend and backend work or product building and deployment.

Allowed roles: "fullstack","backend","frontend","devops","mobile","aiml","product","qa","designer","blockchain"

### CRITICAL OUTPUT RULES

- Input will be a JSON ARRAY
- Output MUST be a JSON ARRAY of the SAME LENGTH
- Preserve item ORDER
- Do NOT merge items
- Do NOT drop items
- Do NOT invent missing data

Return ONLY valid JSON.
No explanations. No markdown. No extra text.

Return EXACTLY this shape:

[
  {
    "description": "<single-sentence bullet>",
    "format": "<STAR | CAR | XYZ | None>",
    "role": "<one role from enum>"
  }
]
`

async function bulkEnhance(
    systemPrompt: string,
    items: Record<string, unknown>[],
    field: string
) {
    if (!items.length) return items

    const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0,
        top_p: 1,
        max_completion_tokens: 4096,
        messages: [
            { role: "system", content: systemPrompt },
            {
                role: "user",
                content: JSON.stringify(items),
            },
        ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error("Empty AI response")

    const parsed = JSON.parse(raw)

    return items.map((item, i) => ({
        ...item,
        [field]: parsed[i]?.description ?? item[field],
        role: parsed[i]?.role ?? item.role,
        format: parsed[i]?.format ?? undefined,
    }))
}

export async function POST(req: NextRequest) {
    try {
        /* ------------ AUTH ------------ */
        const authHeader = req.headers.get("Authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(null, { status: 400 })
        }

        const token = authHeader.split(" ")[1]
        const publicKey = process.env.PUBLIC_KEY?.replace(/\\n/g, "\n")
        if (!publicKey) return NextResponse.json(null, { status: 500 })

        verify(token, publicKey, { algorithms: ["RS256"] })

        /* ----------- INPUT ------------ */
        const { text, username } = await req.json()
        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Invalid text" }, { status: 400 })
        }

        /* ----------- STEP 1: PARSE RESUME ------------ */
        const parseCompletion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            temperature: 0,
            top_p: 1,
            max_completion_tokens: 4096,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: SYSTEM_PROMPT + "The Github Username is: " + username },
                { role: "user", content: text },
            ],
        })

        const parsedResume = JSON.parse(
            parseCompletion.choices[0].message!.content!
        )

        let {
            projects = [],
            experience = [],
            certifications = [],
            awards = [],
            // eslint-disable-next-line prefer-const
            education,
            // eslint-disable-next-line prefer-const
            user,
        } = parsedResume

        /* ----------- STEP 2: BULK AI ENHANCEMENT ------------ */

        projects = await bulkEnhance(
            BULK_WITH_ROLE_PROMPT,
            projects,
            "description"
        )

        experience = await bulkEnhance(
            BULK_WITH_ROLE_PROMPT,
            experience,
            "description"
        )

        certifications = await bulkEnhance(
            BULK_WITH_ROLE_PROMPT,
            certifications,
            "description"
        )

        awards = await bulkEnhance(
            BULK_WITH_ROLE_PROMPT,
            awards,
            "description"
        )

        /* ----------- DONE ------------ */
        return NextResponse.json({
            ok: true,
            data: {
                user,
                education,
                projects,
                experience,
                certifications,
                awards,
            },
        })
    } catch (err) {
        //if TokenExpiredError
        if (err instanceof Error && err.name === "TokenExpiredError") {
            return NextResponse.json({ error: "Token expired" }, { status: 401 })
        }

        console.error("parseResume error:", err)
        return NextResponse.json({ error: "Failed" }, { status: 500 })
    }
}