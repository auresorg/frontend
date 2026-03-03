import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/valkey";
import { ERROR_HTML, INVALID_REQUEST_HTML, NOT_FOUND_HTML } from "@/lib/html";

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

export async function GET(
    req: Request,
    { params }: { params: { username: string; r: string } }
): Promise<NextResponse> {
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
            return new NextResponse(INVALID_REQUEST_HTML, {
                status: 400,
                headers: { "Content-Type": "text/html" },
            });
        }

        const filename = `${username}-${role}.pdf`;

        // 👇 Direct public object path (no signing)
        const fileUrl = `${FILE_BASE}/storage/v1/object/public/aurespdf/${filename}`;

        const supabaseRes = await fetch(fileUrl);

        if (supabaseRes.status === 404) {
            return new NextResponse(NOT_FOUND_HTML, {
                status: 404,
                headers: { "Content-Type": "text/html" },
            });
        }

        if (!supabaseRes.ok || !supabaseRes.body) {
            throw new Error("Failed to fetch PDF from Supabase");
        }

        // 👇 Stream directly to client
        return new NextResponse(supabaseRes.body, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${filename}"`,
                "Cache-Control": "public, max-age=60",
            },
        });
    } catch (err) {
        console.error("Resume GET error:", err);
        return new NextResponse(ERROR_HTML, {
            status: 500,
            headers: { "Content-Type": "text/html" },
        });
    }
}