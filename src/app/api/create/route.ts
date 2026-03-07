import { verify } from "jsonwebtoken";
import { Groq } from "groq-sdk";
import { rateLimit } from "@/lib/valkey";

const withRole: string = `
You are a senior technical resume writer who thinks like an engineering hiring manager.

Your job is to convert a user's casual description (award, certification, project, or work experience) into **one strong resume bullet written as a single sentence**.

Do not treat this as a formatting task. Treat it as causal writing.

Mentally reason through the work by answering:
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
- The bullet MUST NOT start with the same action verb as any bullet listed in "ExistingBullets"
- Use a different action verb if a conflict exists
- Avoid repeating phrasing patterns already present in ExistingBullets

Determine whether the final sentence genuinely follows:
- STAR (has clear situation/context + task/action + result)
- CAR (context/action/result)
- XYZ (accomplished X as measured by Y by doing Z)

If none cleanly apply, set format to "None".

Infer the **most relevant technical roles** based strictly on the skills and work demonstrated (not the label of the item). You MUST return ALL appropriate roles (e.g. return ["backend", "frontend", "fullstack"] if both are involved or if it is a large application). You can return up to 10 roles.

Role inference rules (STRICT):

- If an application has both backend and frontend, you MUST return "fullstack", AND you should ALSO return "frontend" and "backend" if they are prominent.
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

Return output in **valid JSON only**, exactly as:
{
  "bullet": "<single-sentence bullet>",
  "format": "<STAR | CAR | XYZ | None>",
  "role": ["<array>", "<of>", "<roles>"]
}
`;

const withoutRole: string = `
You are a senior technical resume writer who thinks like an engineering hiring manager.

Your job is to convert a user's casual description (award, certification, project, or work experience) into **one strong resume bullet written as a single sentence**.

Do not treat this as a formatting task. Treat it as causal writing.

Mentally reason through the work by answering:
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
- The bullet MUST NOT start with the same action verb as any bullet listed in "ExistingBullets"
- Use a different action verb if a conflict exists
- Avoid repeating phrasing patterns already present in ExistingBullets

Determine whether the final sentence genuinely follows:
- STAR (has clear situation/context + task/action + result)
- CAR (context/action/result)
- XYZ (accomplished X as measured by Y by doing Z)

If none cleanly apply, set format to "None".

Do not generate multiple versions.
Do not explain your reasoning.
Do not include labels or parentheses in the bullet.

Return output in **valid JSON only**, exactly as:
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
                        temperature: 1,
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
