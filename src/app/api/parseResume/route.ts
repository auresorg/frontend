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
- Omit fields that are unknown or missing EXCEPT for startDate and date.
- Use ISO date strings where possible
- startDate is MANDATORY. If missing from text, you MUST estimate a reasonable one.
- date is MANDATORY. If missing from text, you MUST estimate a reasonable one.
- Arrays must exist (empty if none)
- Do NOT hallucinate
- Ongoing roles:
   - Use null ONLY where explicitly allowed (e.g. Experience.endDate)
   - Do NOT use empty strings for ongoing roles.
- IF NO START DATE IS PROVIDED, ASSUME A DATE WITH REASONABLE DURATION THAT ITEM COULD HAVE TAKEN, AND A START DATE THAT LOGICALLY PRECEDES ANY PROVIDED END DATE.
- If only month+year exists, assume the first day of the month for startDate and the last day of the month for endDate.
- If only year exists, assume January 1st for startDate and December 31st for endDate.
- Never use natural language dates.
- Never use formats like "Sep 2024", "09/2024", "2024/09".
- If NO start date is provided, ASSUME
- Ensure proper capitalization where applicable
- Ensure flawless spelling and grammar.

Classification rules (STRICT - MUST FOLLOW):

1) Each item must appear in EXACTLY ONE section.
   Never duplicate an item across projects, certifications, awards, or experience.

2) Awards:
   - Competitive achievements (won, winner, prize, rank, first, second, third, medal).
   - Hackathon wins, expo prizes, competition results.
   - If an item includes prize/rank language → it MUST be an Award.
   - Awards must NOT appear in certifications.
   - Type of award can either be "first", 
   - Date must always be of form "YYYY-MM-DD" or a reasonable approximation (e.g., "2024-09-01" for "September 2024").

3) Certifications:
   - Formal credentials issued by recognized institutions, platforms, or companies.
   - Must represent course completion or official certification.
   - Events, expos, competitions, and participation without credential must NOT be certifications.

4) Experience:
   - Internships, jobs, freelance, contract work.
   - Any role where work was performed for an organization.
   - Internships must ALWAYS be classified as Experience, never Certification.

5) Projects:
   - Personal, academic, or independent technical builds.
   - GitHub repos or self-developed systems not tied to employment classification.

6) If an item qualifies for multiple sections, use this precedence order:
   Award > Experience > Project > Certification

7) Never invent section membership.
   If uncertain, choose the single most semantically accurate section.

Field rules (STRICT):

- Omit fields that are unknown, except for startDate and date which must be estimated if missing
- Do NOT output empty strings.
- Do NOT fabricate platform, issuer, type, url, or grade.
- repo is MANDATORY for all Projects. 
- If no repo is found, GENERATE one using the format: "<username>/project-name"
- NEVER return null for the repo field.
- issuer is MANDATORY for all Awards. 
- If no issuer is found, idnetify the organization or event responsible for granting the award and use that as the issuer.
- NEVER return null for the issuer field.


Structures:

Project {
    name: string;
    repo: string; FORMAT: "username"/"reponame" 
    tech: string[];
    description: string;
    role: ('fullstack' | 'backend' | 'frontend' | 'devops' | 'mobile' | 'aiml' | 'product' | 'qa' | 'designer' | 'blockchain')[];
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
    role: ('fullstack' | 'backend' | 'frontend' | 'devops' | 'mobile' | 'aiml' | 'product' | 'qa' | 'designer' | 'blockchain')[];
    url: string;
    completedOn: string;
};

Award {
    title: string;
    issuer: string;
    type: string;
    description: string;
    date: string;
    role: string[];
}

Experience {
    title: string;
    company: string;
    startDate: string;
    endDate: string | null;
    description: string;
    role: string[];
}

Return exactly this JSON schema:

{
  "user": {
    "firstName": string,
    "lastName": string,
    "linkedin": string,
    "portfolio": string,
    "leetcode": string,
    "phoneNumber": string
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

Your job is to convert a EACH item description (award, certification, project, or work experience) in a JSON ARRAY into **one strong resume bullet written as a single sentence**.
Your job is to convert EACH item in a JSON ARRAY into **one strong resume bullet written as a single sentence**.

Each array item represents ONE of:
- project
- work experience
- certification
- award

Treat EACH item independently.

For EACH item, Mentally reason through the work by answering:
- What was done?
- Why it was done (context or problem, if it adds value)
- How it was done (skills, tools, methods)
- What changed as a result (outcome, validation, learning, or impact)

This is fundamentally **STAR writing**, but you may compress or reorder elements naturally when appropriate.
Small solo tasks may omit explicit situation.
Large or complex efforts should include context if it improves clarity or interest.

Rules for the bullet:
- Write **one sentence only**
- Use action-driven, concrete language
- Focus on accomplishments, not responsibilities
- Outcomes do NOT need to be external; internal results like validation, certification, prototypes, risk reduction, learning, or readiness are valid
- Prefer specific results (passed testing, enabled next phase, reduced risk, informed decisions, created IP, validated assumptions)
- Quantification is mandatory.
- Every bullet MUST include at least one measurable numeric impact (%, time saved, performance improvement, scale, volume, latency reduction, accuracy gain, cost reduction, user growth, throughput, etc.).
- If a number is explicitly mentioned in the input, use it.
- If no numeric impact is provided, infer a realistic and conservative quantified outcome based on the described work.
- You must not skip quantification under any circumstance.
- The impact must describe improvement, scale, or measurable change — not just a count of tasks.
- Do NOT include names, titles, issuers, platforms, companies, or project names
- Avoid fluff, generic claims, or vague responsibility statements
- Avoid repeating the same starting verb across bullets in the same batch.
- Vary action verbs naturally.
- Use correct industry-standard capitalization for all technologies and frameworks.
- Never output inconsistent casing.
- Use consistent capitalization for technologies, tools, and proper nouns.
- Ensure flawless spelling and grammar.

Determine whether the EACH FINAL SENTENCE genuinely follows:
- STAR (has clear situation/context + task/action + result)
- CAR (context/action/result)
- XYZ (accomplished X as measured by Y by doing Z)

If none apply, set format to "None".

Infer **all relevant technical roles** based strictly on the skills and work demonstrated (not the label of the item) for EACH item. Output an array of up to 10 valid roles.

Role inference rules (STRICT):

- If both backend and frontend technologies are present, classify as fullstack.
- If database access (SQL, JDBC, ORM, server, API, backend frameworks) is present, prefer backend unless strong frontend-only signals exist.
- Desktop UI frameworks (e.g., Java Swing) combined with database connectivity must be classified as fullstack.
- IoT + cloud/server connectivity must be classified as backend.
- AI/ML tools (e.g., Gemini AI, ML models) must be classified as aiml.
- Do NOT downgrade an explicitly provided role unless clearly incorrect.
- If original role is provided and consistent with tech stack, preserve it.

Allowed roles:
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"]

Do not generate multiple versions.
Do not explain your reasoning.
Do not include labels or parentheses in the bullet.

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
    "role": ["<array>", "<of>", "<roles>"]
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
        model: "openai/gpt-oss-20b",
        temperature: 0.4,
        top_p: 0.9,
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
                { role: "user", content: text.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') },
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