import { NextRequest, NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import Groq from "groq-sdk"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY!,
})

const SYSTEM_PROMPT = `
You are a resume parser.

Return ONLY valid JSON. No explanation.

CORE RULES:
- Do NOT rewrite or enhance descriptions. Keep text as-is.
- Do NOT invent data.
- If a field is missing, omit it EXCEPT required fields below.

REQUIRED FIELDS (MUST NEVER BE NULL OR MISSING):
- Project.title
- Project.repo
- Experience.title
- Certification.title
- Certification.issuer
- Dates (startDate, completedOn, date)

DATES:
- Use ISO format: YYYY-MM-DD
- If only year is present → YYYY-01-01
- If only month+year → YYYY-MM-01
- If completely missing:
  - startDate → "1970-01-01"
  - completedOn → "1970-01-01"
  - date → "1970-01-01"

PROJECT RULES (CRITICAL):
- title is MANDATORY
- NEVER leave title empty or null
- Extract project title from:
  - project heading
  - GitHub repo name
  - top-level project name in resume
- If not found:
  - derive from repo name (e.g., "note-saas" → "Note SaaS")

- repo is MANDATORY → "<username>/<project-name>"
- url → "https://github.com/<repo>"

TECH:
- Use "tech" field ONLY (NOT "technologies")
- Must be an array if present

ROLES:
- Infer from BOTH tech and explicit keywords in description/title (e.g., "FullStack", "Backend", "Frontend")
ROLE INFERENCE RULES (STRICT):

- If "FullStack", "Full Stack", or "Full-Stack" appears anywhere → include "fullstack"

- Frontend signals:
  HTML, CSS, JavaScript, TypeScript, React, Next.js, Tailwind → "frontend"

- Backend signals:
  Node.js, Express, APIs, MongoDB, SQL, Prisma, server → "backend"

- If BOTH frontend + backend signals exist → include ALL of:
  ["frontend","backend","fullstack"]

- MULTIPLE ROLES ARE ALLOWED AND EXPECTED

- When multiple valid signals exist, INCLUDE ALL matching roles
  Example:
  - React + Node.js → ["frontend","backend","fullstack"]
  - Next.js + MongoDB → ["frontend","backend","fullstack"]

- "fullstack" does NOT replace other roles
  - It must be INCLUDED along with "frontend" and "backend", not instead of them

- NEVER return empty role array

- Return ONLY values from:
["fullstack","backend","frontend","devops","mobile","aiml","product","qa","designer","blockchain"]

- Allowed values ONLY:
["fullstack","backend","frontend","devops","mobile","aiml","product","qa","designer","blockchain"]
- Must be lowercase
- Must be array

- If no clear signals, default to ["fullstack"]

STRICT ROLE RULES:
- NEVER put job titles (Intern, Developer, etc.) inside role
- role is ONLY technical classification

EXPERIENCE RULES:
- title is MANDATORY
- Extract job role like:
  - "Software Engineer Intern"
  - "Backend Developer"
- NEVER leave title empty

CERTIFICATION RULES:
- title is MANDATORY
- issuer is MANDATORY (company/platform issuing it)
- Do NOT use "platform" field

AWARD RULES:
- title is MANDATORY if award exists


EDUCATION RULES:

- Extract ALL education entries (DO NOT drop entries)
- Each entry MUST include:
  - institution (school/college name)
  - title (degree or class, e.g., "B.Tech", "Class XII")
- Include ALL entries found in resume (even school level)

- NEVER return empty education array if any education exists

STRICT:
- No empty strings → omit field instead
- Arrays must exist (empty if none)

IMPORTANT:
- Do NOT rename fields
- Use EXACT field names:
  - title (NOT name)
  - tech (NOT technologies)
  - issuer (NOT platform)

Return EXACT schema:

{
  "user": {
    "firstName": string,
    "lastName": string,
    "linkedin": string,
    "portfolio": string,
    "leetcode": string,
    "phoneNumber": string
  },
  "projects": [
    {
      "title": string,
      "repo": string,
      "tech": string[],
      "description": string,
      "role": string[],
      "startDate": string,
      "endDate": string,
      "url": string
    }
  ],
  "education": [
    {
        "title": string,
        "institution": string,
        "startDate": string,
        "endDate": string,
        "description": string
    }
  ],
  "certifications": [
    {
      "title": string,
      "issuer": string,
      "description": string,
      "role": string[],
      "url": string,
      "completedOn": string
    }
  ],
  "awards": [],
  "experience": [
    {
      "title": string,
      "company": string,
      "startDate": string,
      "endDate": string | null,
      "description": string,
      "role": string[]
    }
  ]
}
`

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
            model: "openai/gpt-oss-20b",
            temperature: 0,
            top_p: 1,
            max_completion_tokens: 4096,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: SYSTEM_PROMPT + "The Github Username is: " + username },
                { role: "user", content: text.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') },
            ],
        })

        const parsedResume = JSON.parse(
            parseCompletion.choices[0].message!.content!
        )

        const {
            projects = [],
            experience = [],
            certifications = [],
            awards = [],
            education,
            user,
        } = parsedResume

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