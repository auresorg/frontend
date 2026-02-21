import { NextResponse } from "next/server";
import { JsonWebTokenError, TokenExpiredError, verify } from "jsonwebtoken";

const FUNCTION_URL = "https://aures-docgen-d3ftgqf7fmdwbjff.centralindia-01.azurewebsites.net/api/resume-direct";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];

        const rawKey = process.env.PUBLIC_KEY;
        if (!rawKey) {
            console.error("PUBLIC_KEY missing");
            return new NextResponse(
                JSON.stringify({ error: "Server misconfigured" }),
                { status: 500 }
            );
        }

        const publicKey = rawKey.replace(/\\n/g, "\n");

        let decoded: { id: string };

        try {
            const verified = verify(token, publicKey, { algorithms: ["RS256"] });

            if (typeof verified !== "object" || !("id" in verified)) {
                return new NextResponse(
                    JSON.stringify({ error: "Invalid token payload" }),
                    { status: 401 }
                );
            }

            decoded = { id: String((verified as { id: unknown }).id) };
        } catch (err) {
            if (err instanceof TokenExpiredError) {
                return new NextResponse(
                    JSON.stringify({ error: "Session expired" }),
                    { status: 401 }
                );
            }

            if (err instanceof JsonWebTokenError) {
                return new NextResponse(
                    JSON.stringify({ error: "Invalid token" }),
                    { status: 401 }
                );
            }

            throw err;
        }

        const body = await req.json() as Record<string, unknown>;
        body.userId = decoded.id;

        const azureRes = await fetch(FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!azureRes.ok) {
            const text = await azureRes.text();
            console.error("Azure error:", text);

            return new NextResponse(
                JSON.stringify({ error: "Azure function failed" }),
                { status: 500 }
            );
        }

        const buffer = await azureRes.arrayBuffer();
        const filename =
            azureRes.headers.get("X-File-Name") || "resume.pdf";

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (err) {
        console.error("RESUME-DIRECT FATAL:", err);

        return new NextResponse(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500 }
        );
    }
}