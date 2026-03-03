import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/valkey";
import { ERROR_HTML, INVALID_REQUEST_HTML, NOT_FOUND_HTML } from "@/lib/html";
import { verify } from "jsonwebtoken";

const TEX_FUNCTION_URL =
    "https://aures-docgen-d3ftgqf7fmdwbjff.centralindia-01.azurewebsites.net/api/custex";

const FILE_BASE = "https://vjuvnrvitnsvfopqukho.supabase.co";

export async function GET(
    req: Request,
    { params }: { params: { slug: string } }
): Promise<NextResponse> {
    try {
        const limited = await rateLimit(req, {
            mode: "ip",
            route: "cusres-view",
            limit: 5,
            windowSec: 60,
            html: true,
        });
        if (limited) return limited;

        const { slug } = params;

        // stricter validation
        if (!slug || slug.length > 20 || !/^[a-z0-9-]+$/i.test(slug)) {
            return new NextResponse(INVALID_REQUEST_HTML, {
                status: 400,
                headers: { "Content-Type": "text/html" },
            });
        }

        const filename = `${slug}.pdf`;
        const fileUrl = `${FILE_BASE}/storage/v1/object/public/aurespdf/${filename}`;

        const supabaseRes = await fetch(fileUrl);

        // file truly missing
        if (supabaseRes.status === 404) {
            return new NextResponse(NOT_FOUND_HTML, {
                status: 404,
                headers: { "Content-Type": "text/html" },
            });
        }

        // treat forbidden same as missing
        if (supabaseRes.status === 403) {
            return new NextResponse(NOT_FOUND_HTML, {
                status: 404,
                headers: { "Content-Type": "text/html" },
            });
        }

        if (!supabaseRes.ok) {
            console.error("Supabase fetch failed:", supabaseRes.status);
            return new NextResponse(NOT_FOUND_HTML, {
                status: 404,
                headers: { "Content-Type": "text/html" },
            });
        }

        if (!supabaseRes.body) {
            return new NextResponse(NOT_FOUND_HTML, {
                status: 404,
                headers: { "Content-Type": "text/html" },
            });
        }

        return new NextResponse(supabaseRes.body, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${filename}"`,
                "Cache-Control": "public, max-age=60",
            },
        });

    } catch (err) {
        console.error("Cusres GET error:", err);

        return new NextResponse(ERROR_HTML, {
            status: 500,
            headers: { "Content-Type": "text/html" },
        });
    }
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new NextResponse(null, { status: 400 });
        }

        const token = authHeader.split(" ")[1];
        const publicKey = process.env.PUBLIC_KEY?.replace(/\\n/g, "\n");

        if (!publicKey) {
            return new NextResponse(ERROR_HTML, {
                status: 500,
                headers: { "Content-Type": "text/html" },
            });
        }

        const decoded = verify(token, publicKey, { algorithms: ["RS256"] });

        if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
            return new NextResponse(ERROR_HTML, {
                status: 401,
                headers: { "Content-Type": "text/html" },
            });
        }

        const userId = decoded["id"] as number;

        const body = await req.json();
        const { slug } = body;

        if (!slug) {
            return new NextResponse(ERROR_HTML, {
                status: 400,
                headers: { "Content-Type": "text/html" },
            });
        }

        const texRes = await fetch(TEX_FUNCTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
            body: JSON.stringify({
                userId,
                slug,
            }),
        });

        if (!texRes.ok) {
            console.log("response from tex function:", await texRes.text());
            return new NextResponse(ERROR_HTML, {
                status: 500,
                headers: { "Content-Type": "text/html" },
            });
        }

        const texContent = await texRes.text();
        const filename = texRes.headers.get("X-File-Name") || "resume.tex";

        return new NextResponse(texContent, {
            status: 200,
            headers: {
                "Content-Type": "application/x-tex",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (err) {
        console.error("Error in POST /c/[slug]:", err);
        return new NextResponse(ERROR_HTML, {
            status: 401,
            headers: { "Content-Type": "text/html" },
        });
    }
}