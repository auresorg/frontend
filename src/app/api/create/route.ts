import { verify } from "jsonwebtoken";
import { Groq } from "groq-sdk";
import { rateLimit } from "@/lib/valkey";

const withRole: string = `
You are a product storyteller writing resume bullets. Your job is NOT to format a task — it is to make a hiring manager instantly understand what this thing IS, what pain it kills, and why it matters.

The user will describe a project, experience, certification, or award casually. You will write ONE sentence that:
1. Names what the thing actually is or does (its identity — not a generic "system" or "solution")
2. States the real-world problem or friction it eliminates
3. Ends with ONE concrete numeric outcome

Think of it as a headline + proof point, compressed into one powerful sentence.

---

STEP 1 — UNDERSTAND THE THING FIRST
Before writing anything, ask yourself:
- What IS this? (not its tech stack — its identity. What would you call it in plain English to a friend?)
- What specific problem does it solve for a specific person?
- What would that person's life look like WITHOUT it?
- What does it make possible that wasn't before?

If you cannot answer these, the description is too vague — infer from context.

---

STEP 2 — WRITE THE BULLET
Structure (flexible, not rigid):
  [What it is / what it does] + [the problem it kills or the gap it fills] + [one number that proves it works]

Examples of the WRONG way (generic, swappable, soulless):
  ✗ "Reduced manual maintenance by 90% by building a full-stack system with REST APIs and PostgreSQL"
  ✗ "Cut content creation time by 70% by building a real-time API that transforms data into personalized content"
  → These could describe any project. They say nothing about what the thing IS.

Examples of the RIGHT way (specific, rooted in the product's identity):
  ✓ "Built a career management super-app that eliminates the problem of maintaining multiple tailored resumes and an outdated portfolio — giving professionals a single live source of truth deployed at a unique URL, cutting update effort by ~90%"
  ✓ "Designed an IoT soil monitoring system that prevents crop overwatering by streaming real-time sensor readings to a farmer dashboard, reducing irrigation waste by 40%"
  ✓ "Created a peer-to-peer lending protocol that removes bank intermediaries from small business loans, enabling same-day funding for borrowers previously locked out of credit — processing $2M in transactions in pilot"
  → A stranger who reads this knows exactly what it is, who it helps, and what problem it solves.

---

Hard rules:
- ONE sentence only
- ONE numeric impact (do not pile on multiple metrics — pick the most meaningful one)
- If the user gave a number, use it; otherwise infer a conservative realistic one
- Do NOT start with the same verb as any bullet in ExistingBullets
- Do NOT use: "leveraged", "robust", "scalable", "innovative", "utilized", "cutting-edge"
- Do NOT name the project, company, platform, or people by their proper noun names
  - You MAY say what it IS (e.g. "a career management super-app") — just not its brand name
  - You MAY name generic tech (React, PostgreSQL, Next.js) if it adds signal
- Do NOT pad with tech stack unless it genuinely changes the meaning
- The sentence must FAIL the swap test: if it could describe a completely different project, rewrite it

---

Determine which format the bullet follows:
- STAR: has situation/context + action + result
- CAR: context + action + result (no explicit situation setup)
- XYZ: accomplished X as measured by Y by doing Z
- None: if none cleanly apply

Infer ALL relevant technical roles from the skills and work described (not from labels or titles).
Return every role that applies — do not artificially limit.

Role inference rules:
- Both frontend + backend present → return ["fullstack", "frontend", "backend"]
- Database/API/server work → backend (unless purely frontend signals)
- Desktop UI (e.g. Swing) + DB = fullstack
- IoT + cloud/server = backend
- AI/ML tools = aiml
- Preserve any explicitly provided role if consistent with the tech

Allowed roles: ["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"]

Return ONLY valid JSON, no explanation, no extra text:
{
  "bullet": "<single-sentence bullet>",
  "format": "<STAR | CAR | XYZ | None>",
  "role": ["<role>"]
}
`;

const withoutRole: string = `
You are a product storyteller writing resume bullets. Your job is NOT to format a task — it is to make a hiring manager instantly understand what this thing IS, what pain it kills, and why it matters.

The user will describe a project, experience, certification, or award casually. You will write ONE sentence that:
1. Names what the thing actually is or does (its identity — not a generic "system" or "solution")
2. States the real-world problem or friction it eliminates
3. Ends with ONE concrete numeric outcome

Think of it as a headline + proof point, compressed into one powerful sentence.

---

STEP 1 — UNDERSTAND THE THING FIRST
Before writing anything, ask yourself:
- What IS this? (not its tech stack — its identity. What would you call it in plain English to a friend?)
- What specific problem does it solve for a specific person?
- What would that person's life look like WITHOUT it?
- What does it make possible that wasn't before?

---

STEP 2 — WRITE THE BULLET
Structure (flexible, not rigid):
  [What it is / what it does] + [the problem it kills or the gap it fills] + [one number that proves it works]

Examples of the WRONG way:
  ✗ "Reduced manual maintenance by 90% by building a full-stack system with REST APIs and PostgreSQL"
  ✗ "Cut content creation time by 70% by building a real-time API that transforms data into personalized content"
  → These could describe any project. They say nothing about what the thing IS.

Examples of the RIGHT way:
  ✓ "Built a career management super-app that eliminates the problem of maintaining multiple tailored resumes and an outdated portfolio — giving professionals a single live source of truth deployed at a unique URL, cutting update effort by ~90%"
  ✓ "Designed an IoT soil monitoring system that prevents crop overwatering by streaming real-time sensor readings to a farmer dashboard, reducing irrigation waste by 40%"
  → A stranger who reads this knows exactly what it is, who it helps, and what problem it solves.

---

Hard rules:
- ONE sentence only
- ONE numeric impact — pick the most meaningful one, do not pile metrics
- If the user gave a number, use it; otherwise infer a conservative realistic one
- Do NOT start with the same verb as any bullet in ExistingBullets
- Do NOT use: "leveraged", "robust", "scalable", "innovative", "utilized", "cutting-edge"
- Do NOT name the project, company, platform, or people by proper noun
  - You MAY describe what it IS (e.g. "a job-matching platform") — just not its brand name
  - You MAY name generic technologies if they add meaningful signal
- Do NOT pad with tech stack details unless they change the meaning
- The sentence must FAIL the swap test: if it could describe a completely different project, rewrite it

---

Determine which format the bullet follows:
- STAR: situation/context + action + result
- CAR: context + action + result
- XYZ: accomplished X as measured by Y by doing Z
- None: if none cleanly apply

Return ONLY valid JSON, no explanation, no extra text:
{
  "bullet": "<single-sentence bullet>",
  "format": "<STAR | CAR | XYZ | None>"
}
`;

const roleOnly: string = `
You are an expert technical resume reviewer who thinks like a hiring manager.

Read the user's description and infer all relevant **technical roles** based strictly on the skills, tools, and type of work demonstrated.

Do not infer based on labels, titles, or award names.
Do not guess future intent.
Do not blend roles.

Choose up to 10 roles from:
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"]

You MUST return ALL roles that apply. If the project is full stack, output ["fullstack", "backend", "frontend"]. DO NOT artificially limit your selection to one role if multiple are applicable.

Output format MUST BE exactly this JSON array of strings and NOTHING ELSE:
["role1", "role2"]
No explanations.
No JSON.
Nothing else.
`;

// Helper function to get prompts based on type
function getPrompts() {
    return {
        withRole: withRole,
        withoutRole: withoutRole,
        roleOnly: roleOnly
    };
}

// Helper function to build context string
function buildContext(type: string, body: Record<string, string | undefined>): string {
    let preBody = "";

    switch (type) {
        case "experience":
            if (body.title) preBody += `Job Title: ${body.title}, `;
            if (body.company) preBody += `Company: ${body.company}, `;
            if (body.startDate) preBody += `Start: ${body.startDate}, `;
            if (body.endDate) preBody += `End: ${body.endDate}, `;
            if (body.role) preBody += `My Role: ${body.role}, `;
            break;

        case "award":
            if (body.title) preBody += `Award Title: ${body.title}, `;
            if (body.issuer) preBody += `Issuer: ${body.issuer}, `;
            if (body.type) preBody += `Award Type: ${body.type}, `;
            if (body.role) preBody += `My Role: ${body.role}, `;
            break;
        case "certification":
            if (body.title) preBody += `Certificate Title: ${body.title}, `;
            if (body.platform) preBody += `Platform: ${body.platform}, `;
            if (body.role) preBody += `My Role: ${body.role}, `;
            break;
        case "project":
            if (body.name) preBody += `Project Name: ${body.name}, `;
            if (body.tech) preBody += `Technologies Used: ${body.tech}, `;
            if (body.role) preBody += `My Role: ${body.role}, `;
            break;
    }

    return preBody;
}

// Helper function to get title field for role-only prompt
function getTitleField(type: string, body: Record<string, string | undefined>): string {
    switch (type) {
        case "experience":
            return body.title || "";
        case "award":
            return body.title || "";
        case "certification":
            return body.title || "";
        case "project":
            return body.name || "";
        default:
            return "";
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(null, { status: 400 });
        }

        const token = authHeader.split(" ")[1];
        const publicKey = process.env.PUBLIC_KEY?.replace(/\\n/g, '\n');

        if (!publicKey) {
            console.error("PUBLIC_KEY not set in environment");
            return new Response(null, { status: 500 });
        }

        // Verify and decode the JWT
        const decoded = verify(token, publicKey, { algorithms: ["RS256"] });

        if (decoded && typeof decoded === "object" && "plan" in decoded) {

            const limited = await rateLimit(request, { mode: "user", identifier: decoded["id"] as string, route: "create", limit: 20, windowSec: 10 });
            if (limited) return limited;

            const body = await request.json();
            const { type, descriptions } = body; // Extract type: "award", "certification", or "project"

            if (!type || !["award", "certification", "project", "experience"].includes(type)) {
                return new Response(
                    JSON.stringify({ error: "Invalid or missing type parameter" }),
                    { status: 400 }
                );
            }

            const plan = decoded["plan"];
            const groq = new Groq();
            const prompts = getPrompts();
            const preBody = buildContext(type, body);
            const existingBullets =
                Array.isArray(descriptions) && descriptions.length
                    ? `ExistingBullets:\n${descriptions.map((d: string) => `- ${d}`).join("\n")}\n\n`
                    : "";

            if (plan === "pro") {
                let responseText = "";
                const role = body.role;
                let chatCompletion;

                if (role && (!Array.isArray(role) || role.length > 0)) {
                    chatCompletion = await groq.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: prompts.withoutRole,
                            },
                            {
                                role: "user",
                                content: preBody + " " + body.description + " " + existingBullets,
                            },
                        ],
                        model: "openai/gpt-oss-20b",
                        temperature: 0.7,
                        max_completion_tokens: 1024,
                        top_p: 1,
                        stream: true,
                        stop: null
                    });
                } else {
                    chatCompletion = await groq.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: prompts.withRole
                            },
                            {
                                role: "user",
                                content: preBody + " " + body.description
                            },
                        ],
                        model: "openai/gpt-oss-20b",
                        temperature: 1,
                        max_completion_tokens: 1024,
                        top_p: 1,
                        stream: true,
                        stop: null
                    });
                }

                for await (const chunk of chatCompletion) {
                    responseText += chunk.choices[0]?.delta?.content || "";
                }

                const responseTextComplete = responseText.trim();
                let bullet = "";
                let format = "None";
                let returnedRole: string[] = [];

                if (responseTextComplete) {
                    console.log("raw: " + responseTextComplete);
                    try {
                        let jsonStr = responseTextComplete;
                        const firstBrace = jsonStr.indexOf('{');
                        const lastBrace = jsonStr.lastIndexOf('}');
                        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                        }
                        const response = JSON.parse(jsonStr);
                        bullet = response.bullet || "";
                        format = response.format || "None";
                        returnedRole = Array.isArray(response.role) ? response.role : (response.role ? [response.role] : []);
                    } catch (e) {
                        console.error("Failed to parse JSON response from Groq:", e, responseTextComplete);
                    }
                }

                // fallback to original role if nothing returned
                if (!returnedRole.length && role) {
                    returnedRole = Array.isArray(role) ? role : [role];
                }

                return new Response(JSON.stringify({
                    description: bullet,
                    role: returnedRole.filter(Boolean),
                    format: format,
                }));
            } else {
                // Free plan - only return role
                if (body.role && (!Array.isArray(body.role) || body.role.length > 0)) {
                    return new Response(JSON.stringify({ role: body.role }), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    });
                }

                let responseText = "";
                const titleField = getTitleField(type, body);

                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: prompts.roleOnly
                        },
                        {
                            role: "user",
                            content: `Title: ${titleField} ${body.description || ""}`
                        },
                    ],
                    model: "openai/gpt-oss-20b",
                    temperature: 1,
                    max_completion_tokens: 1024,
                    top_p: 1,
                    stream: true,
                    stop: null
                });

                for await (const chunk of chatCompletion) {
                    responseText += chunk.choices[0]?.delta?.content || "";
                }

                let parsedRoles: string[] = [];
                try {
                    let jsonStr = responseText.trim();
                    const firstBracket = jsonStr.indexOf('[');
                    const lastBracket = jsonStr.lastIndexOf(']');
                    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                        jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
                    }
                    parsedRoles = JSON.parse(jsonStr);
                    if (!Array.isArray(parsedRoles)) {
                        parsedRoles = [responseText.trim()];
                    }
                } catch {
                    parsedRoles = [responseText.trim()];
                }

                return new Response(JSON.stringify({ role: parsedRoles }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }
    } catch (error) {
        console.error("JWT verification failed:", error);
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
            status: 401
        });
    }
}
