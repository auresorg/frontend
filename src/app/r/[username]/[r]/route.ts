import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/valkey";

const FILE_BASE = "https://vjuvnrvitnsvfopqukho.supabase.co";

const AllowedRoles = new Set([
    "frontend",
    "backend",
    "fullstack",
    "devops",
    "mobile",
    "aiml",
    "product",
    "qa",
    "designer",
    "blockchain",
]);

async function signUrl(filename: string) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

    const res = await fetch(
        `${FILE_BASE}/storage/v1/object/sign/aurespdf/${filename}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ expiresIn: 10 }),
        }
    );

    if (!res.ok) {
        const t = await res.text();
        throw new Error(`Sign failed: ${t}`);
    }

    const data = await res.json();
    let path = data.signedURL;

    if (!path.startsWith("/storage/v1")) {
        path = `/storage/v1${path.startsWith("/") ? path : "/" + path}`;
    }

    return `${FILE_BASE}${path}`;
}

export async function GET(
    req: Request,
    { params }: { params: { username: string; r: string } }
) {
    try {
        const limited = await rateLimit(req, {
            mode: "ip",
            route: "resume-view",
            limit: 5,
            windowSec: 60,
            html: true,
        });
        if (limited) return limited;

        const { username, r } = params;
        const role = r.endsWith(".pdf") ? r.slice(0, -4) : r;

        if (!username || !AllowedRoles.has(role)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // 🔑 Default resume filename rule
        const filename = `${username}-${role}.pdf`;

        const signedUrl = await signUrl(filename);

        return NextResponse.redirect(signedUrl, { status: 307 });
    } catch {
        return NextResponse.json(
            { error: "Failed to load resume" },
            { status: 500 }
        );
    }
}
