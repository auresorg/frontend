import { verify } from "jsonwebtoken";
import { Groq } from "groq-sdk";
import { rateLimit } from "@/lib/rateLimit";

// Award prompts
const awardAndRolePrompt: string = `You are an expert technical resume writer specializing in awards, hackathons, and achievements.  
Convert the user's casual award description into a single, concise, strong resume bullet point, written as **one sentence**.  
Do **NOT** include the award title or issuer name in the response.  
Use action-driven language and focus on achievements, impact, and recognition received. Include measurable outcomes, competition results, or recognition levels wherever possible.  
Analyze the award description and rewrite the bullet point using an appropriate outcome-focused format. Recognized formats are **STAR (Situation, Task, Action, Result)**, **CAR (Context, Action, Result)**, and **XYZ (Accomplished X as measured by Y by doing Z)**.  
Only assign the "format" key if the bullet genuinely follows one of these formats; otherwise, set "format": "None".  
Select an appropriate role from the following enum of common tech roles in India and include it in the JSON under the key "role":  
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"].
Choose the role based on the skills and technologies demonstrated in the award; pick the role from the enum that **best matches the competency areas and technical focus** of the award achievement.  
Do not create multiple bullets or alternative versions.  
Keep it fully self-contained, clear, and impactful; avoid fluff and unnecessary words.  
Return the output in **JSON** exactly like this:  
{
  "bullet": "<your rewritten bullet>",
  "format": "<STAR | CAR | XYZ | None>",
  "role": "<one role from the enum>"
}  
Do not include explanations, parentheses, or format labels.
`;

const awardPromptWithoutRole: string = `You are an expert technical resume writer specializing in awards, hackathons, and achievements.  
Convert the user's casual award description into a single, concise, strong resume bullet point, written as **one sentence**.  
Do **NOT** include the award title or issuer name in the response.  
Use action-driven language and focus on achievements, impact, and recognition received. Include measurable outcomes, competition results, or recognition levels wherever possible.  
Analyze the award description and rewrite the bullet point using an appropriate outcome-focused format. Recognized formats are **STAR (Situation, Task, Action, Result)**, **CAR (Context, Action, Result)**, and **XYZ (Accomplished X as measured by Y by doing Z)**.  
Only assign the "format" key if the bullet genuinely follows one of these formats; otherwise, set "format": "None".  
Do not create multiple bullets or alternative versions.  
Keep it fully self-contained, clear, and impactful; avoid fluff and unnecessary words.  
Return the output in **JSON** exactly like this:  
{
  "bullet": "<your rewritten bullet>",
  "format": "<STAR | CAR | XYZ | None>"
}  
Do not include explanations, parentheses, or format labels.
`;

const awardRolePrompt: string = `You are an expert at identifying technical roles from award achievements.  
Read the user's award description and return only the most relevant role from this enum:  
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"].  
Base your choice strictly on the skills, technologies, and competency areas demonstrated in the award achievement.  
Output only the role name — no punctuation, no explanations, no JSON, nothing else.`

// Certification prompts
const certificationAndRolePrompt: string = `You are an expert technical resume writer specializing in certifications and professional development.  
Convert the user's casual certificate description into a single, concise, strong resume bullet point, written as **one sentence**.  
Do **NOT** include the certificate title or platform name in the response.  
Use action-driven language and focus on skills acquired, knowledge gained, and practical applications. Include measurable outcomes, proficiency levels, or competency achievements wherever possible.  
Analyze the certification description and rewrite the bullet point using an appropriate outcome-focused format. Recognized formats are **STAR (Situation, Task, Action, Result)**, **CAR (Context, Action, Result)**, and **XYZ (Accomplished X as measured by Y by doing Z)**.  
Only assign the "format" key if the bullet genuinely follows one of these formats; otherwise, set "format": "None".  
Select an appropriate role from the following enum of common tech roles in India and include it in the JSON under the key "role":  
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"].
Choose the role based on the skills and technologies covered in the certification; pick the role from the enum that **best matches the competency areas and technical focus** of the certificate.  
Do not create multiple bullets or alternative versions.  
Keep it fully self-contained, clear, and impactful; avoid fluff and unnecessary words.  
Return the output in **JSON** exactly like this:  
{
  "bullet": "<your rewritten bullet>",
  "format": "<STAR | CAR | XYZ | None>",
  "role": "<one role from the enum>"
}  
Do not include explanations, parentheses, or format labels.
`;

const certificationPromptWithoutRole: string = `You are an expert technical resume writer specializing in certifications and professional development.  
Convert the user's casual certificate description into a single, concise, strong resume bullet point, written as **one sentence**.  
Do **NOT** include the certificate title or platform name in the response.  
Use action-driven language and focus on skills acquired, knowledge gained, and practical applications. Include measurable outcomes, proficiency levels, or competency achievements wherever possible.  
Analyze the certification description and rewrite the bullet point using an appropriate outcome-focused format. Recognized formats are **STAR (Situation, Task, Action, Result)**, **CAR (Context, Action, Result)**, and **XYZ (Accomplished X as measured by Y by doing Z)**.  
Only assign the "format" key if the bullet genuinely follows one of these formats; otherwise, set "format": "None".  
Do not create multiple bullets or alternative versions.  
Keep it fully self-contained, clear, and impactful; avoid fluff and unnecessary words.  
Return the output in **JSON** exactly like this:  
{
  "bullet": "<your rewritten bullet>",
  "format": "<STAR | CAR | XYZ | None>"
}  
Do not include explanations, parentheses, or format labels.
`;

const certificationRolePrompt: string = `You are an expert at identifying technical roles from certification descriptions.  
Read the user's certification description and return only the most relevant role from this enum:  
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"].  
Base your choice strictly on the skills, technologies, and competency areas covered by the certification.  
Output only the role name — no punctuation, no explanations, no JSON, nothing else.`

// Project prompts
const projectAndRolePrompt: string = `You are an expert technical resume writer.  
Convert the user's casual project description into a single, concise, strong resume bullet point, written as **one sentence**.  
Do **NOT** include the project name in the response.  
Use action-driven language and include measurable outcomes, numbers, or scale estimates (e.g., users, performance, efficiency, time saved, lines of code) wherever possible.  
Analyze the project description and rewrite the bullet point using an appropriate outcome-focused format. Recognized formats are **STAR (Situation, Task, Action, Result)**, **CAR (Context, Action, Result)**, and **XYZ (Accomplished X as measured by Y by doing Z)**.  
Only assign the "format" key if the bullet genuinely follows one of these formats; otherwise, set "format": "None".  
Select an appropriate role from the following enum of common tech roles in India and include it in the JSON under the key "role":  
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"].
Choose the role based on the actual work described in the project; pick the role from the enum that **best matches the responsibilities and technical focus**.  
Do not create multiple bullets or alternative versions.  
Keep it fully self-contained, clear, and impactful; avoid fluff and unnecessary words.  
Return the output in **JSON** exactly like this:  
{
  "bullet": "<your rewritten bullet>",
  "format": "<STAR | CAR | XYZ | None>",
  "role": "<one role from the enum>"
}  
Do not include explanations, parentheses, or format labels.
`;

const projectPromptWithoutRole: string = `You are an expert technical resume writer.  
Convert the user's casual project description into a single, concise, strong resume bullet point, written as **one sentence**.  
Do **NOT** include the project name in the response.  
Use action-driven language and include measurable outcomes, numbers, or scale estimates (e.g., users, performance, efficiency, time saved, lines of code) wherever possible.  
Analyze the project description and rewrite the bullet point using an appropriate outcome-focused format. Recognized formats are **STAR (Situation, Task, Action, Result)**, **CAR (Context, Action, Result)**, and **XYZ (Accomplished X as measured by Y by doing Z)**.  
Only assign the "format" key if the bullet genuinely follows one of these formats; otherwise, set "format": "None".  
Do not create multiple bullets or alternative versions.  
Keep it fully self-contained, clear, and impactful; avoid fluff and unnecessary words.  
Return the output in **JSON** exactly like this:  
{
  "bullet": "<your rewritten bullet>",
  "format": "<STAR | CAR | XYZ | None>"
}  
Do not include explanations, parentheses, or format labels.
`;

const projectRolePrompt: string = `You are an expert at identifying technical roles from project descriptions.  
Read the user's project description and return only the most relevant role from this enum:  
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"].  
Base your choice strictly on the skills, responsibilities, and technologies mentioned.  
Output only the role name — no punctuation, no explanations, no JSON, nothing else.`

// Experience prompts
const experienceAndRolePrompt: string = `You are an expert technical resume writer specializing in work experience.  
Convert the user's casual experience description into a single, concise, strong resume bullet point, written as **one sentence**.  
Do **NOT** include the company name or job title in the response.  
Use action-driven language and quantify impact where possible (users, performance, revenue, time saved, reliability, cost).  
Analyze the description and rewrite the bullet point using an outcome-focused format. Recognized formats are **STAR (Situation, Task, Action, Result)**, **CAR (Context, Action, Result)**, and **XYZ (Accomplished X as measured by Y by doing Z)**.  
Only assign the "format" key if the bullet genuinely follows one of these formats; otherwise, set "format": "None".  
Select an appropriate role from this enum and include it under "role":  
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"].  
Return JSON exactly as:  
{
  "bullet": "<your rewritten bullet>",
  "format": "<STAR | CAR | XYZ | None>",
  "role": "<one role from the enum>"
}`;
const experiencePromptWithoutRole: string = `You are an expert technical resume writer specializing in work experience.  
Convert the user's casual experience description into a single, concise, strong resume bullet point, written as **one sentence**.  
Do **NOT** include the company name or job title in the response.  
Use action-driven language and quantify impact where possible.  
Analyze and use **STAR/CAR/XYZ** when applicable; otherwise "None".  
Return JSON exactly as:  
{
  "bullet": "<your rewritten bullet>",
  "format": "<STAR | CAR | XYZ | None>"
}`;
const experienceRolePrompt: string = `You are an expert at identifying technical roles from experience descriptions.  
Read the user's description and return only the most relevant role from this enum:  
["fullstack", "backend", "frontend", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"].  
Output only the role name — no punctuation, no explanations, no JSON, nothing else.`;

// Helper function to get prompts based on type
function getPrompts(type: string) {
    switch (type) {
        case "award":
            return {
                withRole: awardAndRolePrompt,
                withoutRole: awardPromptWithoutRole,
                roleOnly: awardRolePrompt,
            };
        case "certification":
            return {
                withRole: certificationAndRolePrompt,
                withoutRole: certificationPromptWithoutRole,
                roleOnly: certificationRolePrompt,
            };
        case "project":
            return {
                withRole: projectAndRolePrompt,
                withoutRole: projectPromptWithoutRole,
                roleOnly: projectRolePrompt,
            };

        case "experience":
            return {
                withRole: experienceAndRolePrompt,
                withoutRole: experiencePromptWithoutRole,
                roleOnly: experienceRolePrompt,
            };

        default:
            throw new Error(`Unknown type: ${type}`);
    }
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

            const limited = await rateLimit(request, { mode: "user", identifier: decoded["id"] as string, route: "create", limit: 2, windowSec: 10 });
            if (limited) return limited;

            const body = await request.json();
            const { type } = body; // Extract type: "award", "certification", or "project"
            
            if (!type || !["award", "certification", "project", "experience"].includes(type)) {
                return new Response(
                    JSON.stringify({ error: "Invalid or missing type parameter" }),
                    { status: 400 }
                );
            }

            const plan = decoded["plan"];
            const groq = new Groq();
            const prompts = getPrompts(type);
            const preBody = buildContext(type, body);

            if (plan === "pro") {
                let responseText = "";
                const role = body.role;
                let chatCompletion;

                if (role) {
                    chatCompletion = await groq.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: prompts.withoutRole,
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

                const response = JSON.parse(responseText);
                return new Response(JSON.stringify({
                    description: response.bullet,
                    role: response.role,
                    format: response.format,
                }));
            } else {
                // Free plan - only return role
                if (body.role) {
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

                return new Response(JSON.stringify({ role: responseText }), {
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
