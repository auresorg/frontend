import { verify } from "jsonwebtoken";
import { Groq } from "groq-sdk";

const awardScanPrompt: string = `
You are an AI that extracts structured award information from OCR text of certificates. 
Read the text carefully and return ONLY a valid JSON object using the following structure:

{
  "title": "",
  "issuer": "",
  "type": "",
  "date": ""
}

Rules:
- Do NOT invent or guess unrelated information.
- "title" must represent the *event or competition name* (e.g., "National Coding Championship", "AI Expo 2024"), not phrases like "Certificate of Achievement" or "Best Project Award".
- "issuer" should be the *organization, institution, or department* that issued the certificate. It should sound formal and complete, not abbreviated garbage.
- "type" must reflect the *position or rank achieved*: "first", "second", "third", or "fourth" (in lowercase). Do NOT use words like "winner", "best project", or "participation".
- "date" must be extracted from the text if a valid date is present. Convert it into ISO format (YYYY-MM-DD). If you see month names (like March 5, 2024), convert properly.

Additional behavior:
- Ignore all decorative or unrelated text (signatures, headings like CERTIFICATE, OF ACHIEVEMENT, etc.).
- Never hardcode or reuse examples from the prompt itself.
- Never include any explanatory text, comments, or markdown—return only the JSON.

Output must be strict JSON, with double quotes and no trailing commas.
`;

// Helper function to get prompts based on type
function getScanPrompt(type: string): string {
    switch (type) {
        case "award":
            return awardScanPrompt;
        // Add more scan types here in the future (e.g., certification, project)
        default:
            throw new Error(`Unknown scan type: ${type}`);
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
            const body = await request.json();
            const { type, certificate } = body;
            
            if (!type || !["award"].includes(type)) {
                return new Response(
                    JSON.stringify({ error: "Invalid or missing type parameter" }),
                    { status: 400 }
                );
            }

            if (!certificate) {
                return new Response(
                    JSON.stringify({ error: "Missing certificate text" }),
                    { status: 400 }
                );
            }

            const plan = decoded["plan"];

            if (plan === "pro") {
                const groq = new Groq();
                let responseText = "";
                const scanPrompt = getScanPrompt(type);

                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: scanPrompt,
                        },
                        {
                            role: "user",
                            content: certificate
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

                const response = JSON.parse(responseText);
                
                // Return different structures based on scan type
                if (type === "award") {
                    return new Response(JSON.stringify({
                        title: response.title || "",
                        issuer: response.issuer || "",
                        type: response.type || "",
                        date: response.date || ""
                    }));
                }
            } else {
                return new Response(
                    JSON.stringify({ error: "Scan feature requires pro plan" }),
                    { status: 403 }
                );
            }
        }
        
        return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401 }
        );
    } catch (error) {
        console.error("Error in scan endpoint:", error);
        return new Response(
            JSON.stringify({ error: "Invalid or expired token" }), 
            { status: 401 }
        );
    }
}
