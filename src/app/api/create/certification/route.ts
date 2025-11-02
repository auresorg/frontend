import { verify } from "jsonwebtoken";
//CJS: const { verify } = require("jsonwebtoken");
import { Groq } from "groq-sdk";

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
            const body = await request.json();
            const plan = decoded["plan"];
            const groq = new Groq();

            let preBody = "";
            if (body.title) {
                preBody += `Certificate Title: ${body.title}, `;
            }
            if (body.platform) {
                preBody += `Platform: ${body.platform}, `;
            }
            if (body.role) {
                preBody += `My Role: ${body.role}, `;
            }

            if (plan == "pro") {
                let responseText = "";

                const role = body.role;
                let chatCompletion;

                if (role) {
                    chatCompletion = await groq.chat.completions.create({
                        "messages": [
                            {
                                "role": "system",
                                "content": certificationPromptWithoutRole,
                            },
                            {
                                "role": "user",
                                "content": preBody + " " + body.description
                            },
                        ],
                        "model": "openai/gpt-oss-20b",
                        "temperature": 1,
                        "max_completion_tokens": 1024,
                        "top_p": 1,
                        "stream": true,
                        "stop": null
                    });
                } else {
                    chatCompletion = await groq.chat.completions.create({
                        "messages": [
                            {
                                "role": "system",
                                "content": certificationAndRolePrompt
                            },
                            {
                                "role": "user",
                                "content": preBody + " " + body.description
                            },
                        ],
                        "model": "openai/gpt-oss-20b",
                        "temperature": 1,
                        "max_completion_tokens": 1024,
                        "top_p": 1,
                        "stream": true,
                        "stop": null
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
                if (body.role) {
                    return new Response(JSON.stringify({ role: body.role }), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    });
                }
                
                let responseText = "";
                const chatCompletion = await groq.chat.completions.create({
                    "messages": [
                        {
                            "role": "system",
                            "content": certificationRolePrompt
                        },
                        {
                            "role": "user",
                            "content": "Title: " + body.title + " " + body.description
                        },
                    ],
                    "model": "openai/gpt-oss-20b",
                    "temperature": 1,
                    "max_completion_tokens": 1024,
                    "top_p": 1,
                    "stream": true,
                    "stop": null
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
        return new Response(JSON.stringify({ error: "Invalid or expired token"}));
    }
}