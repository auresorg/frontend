import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/valkey";
import { ERROR_HTML, INVALID_REQUEST_HTML, NOT_FOUND_HTML } from "@/lib/html";

const FILE_BASE = "https://vjuvnrvitnsvfopqukho.supabase.co";

interface SignUrlResponse {
    signedURL: string;
}

interface SignError extends Error {
    statusCode?: number;
}

async function signUrl(filename: string): Promise<string> {
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
        const error = new Error(`Sign failed: ${t}`) as SignError;
        error.statusCode = res.status;
        throw error;
    }

    const data = (await res.json()) as SignUrlResponse;
    let path = data.signedURL;

    if (!path.startsWith("/storage/v1")) {
        path = `/storage/v1${path.startsWith("/") ? path : "/" + path}`;
    }

    return `${FILE_BASE}${path}`;
}

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

        const slug = params.slug;
        if (!slug || slug.length > 20) {
            return new NextResponse(INVALID_REQUEST_HTML, {
                status: 400,
                headers: { 'Content-Type': 'text/html' },
            });
        }

        const filename = `${slug}.pdf`;

        try {
            const signedUrl = await signUrl(filename);
            return NextResponse.redirect(signedUrl, { status: 307 });
        } catch (signError: unknown) {
            const error = signError as SignError;
            if (error.message?.includes('404') || error.statusCode === 404) {
                return new NextResponse(NOT_FOUND_HTML, {
                    status: 404,
                    headers: { 'Content-Type': 'text/html' },
                });
            }
            throw error;
        }
    } catch {
        return new NextResponse(ERROR_HTML, {
            status: 500,
            headers: { 'Content-Type': 'text/html' },
        });
    }
}