import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/valkey";

const RESUME_URL = "https://aures-docgen-d3ftgqf7fmdwbjff.centralindia-01.azurewebsites.net/api/resume";

interface TokenPayload {
    id: string | number;
    username: string;
}

export async function POST(req: Request) {
    try {
        // ---------- AUTH ----------
        const auth = req.headers.get("Authorization");
        if (!auth?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = auth.slice(7);
        const publicKey = process.env.PUBLIC_KEY?.replace(/\\n/g, "\n");
        if (!publicKey) {
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }

        const decoded = verify(token, publicKey, { algorithms: ["RS256"] }) as TokenPayload;
        if (!decoded?.id || !decoded?.username) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = Number(decoded.id);
        const username = decoded.username;

        // ---------- RATE LIMIT ----------
        const limited = await rateLimit(req, {
            mode: "user",
            identifier: String(userId),
            route: "resume-download",
            limit: 2,
            windowSec: 30,
        });
        if (limited) return limited;

        // ---------- BODY ----------
        const { slug } = await req.json();
        if (!slug) {
            return NextResponse.json({ error: "Missing slug" }, { status: 400 });
        }

        // ---------- CALL AZURE ----------
        const res = await fetch(RESUME_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "custom",
                slug,
                userId,
                username,
                mode: "download",
            }),
        });

        if (!res.ok) {
            const t = await res.text();
            console.error("Azure resume failed:", t);
            return NextResponse.json(
                { error: "Resume generation failed" },
                { status: 500 }
            );
        }

        const pdf = Buffer.from(await res.arrayBuffer());

        return new NextResponse(pdf, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${slug}.pdf"`,
            },
        });
    } catch (err) {
        console.error("Download fatal:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
