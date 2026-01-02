import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type {
    Project,
    Education,
    Certification,
    Experience,
    Award,
} from "@/lib/types";
import { rateLimit } from "@/lib/valkey";
import { waitUntil } from "@vercel/functions";

const FILE_BASE = "https://vjuvnrvitnsvfopqukho.supabase.co";

const RESGEN_URL =
    "https://aures-docgen-d3ftgqf7fmdwbjff.centralindia-01.azurewebsites.net/api/cusres";
const RESGEN_TEX_URL =
    "https://aures-docgen-d3ftgqf7fmdwbjff.centralindia-01.azurewebsites.net/api/custex";

const ESCAPE_MAP: Record<string, string> = {
    "\\": "\\textbackslash",
    "&": "\\&",
    "%": "\\%",
    "$": "\\$",
    "#": "\\#",
    "_": "\\_",
    "{": "\\{",
    "}": "\\}",
    "~": "\\textasciitilde",
    "^": "\\textasciicircum",
    "\u2013": "-",
    "\u2014": "-",
    "\u00A0": " ",
};

const ESCAPE_REGEX = /[\\&%$#_{}~^\u2013\u2014\u00A0]/g;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safe = (v: any): string => {
    if (v == null || v === "") return "";
    let s = String(v);
    if (s.startsWith("##")) {
        const end = s.indexOf("##", 2);
        if (end !== -1) s = s.substring(end + 2).trim();
    }
    return s.replace(ESCAPE_REGEX, (m) => ESCAPE_MAP[m]);
};

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

    if (!res.ok) throw new Error("Failed to sign URL");

    const data = await res.json();
    let path = data.signedURL;

    if (!path.startsWith("/storage/v1")) {
        path = `/storage/v1${path.startsWith("/") ? path : "/" + path}`;
    }

    return `${FILE_BASE}${path}`;
}

async function fetchCusresData(slug: string) {
    const rows = await query<{
        cusres_id: number;
        user_id: number;
        username: string;
        email: string;
        firstname: string | null;
        lastname: string | null;
        linkedin: string | null;
        portfolio: string | null;
        leetcode: string | null;
        projects: number[];
        certifications: number[];
        awards: number[];
        experiences: number[];
    }>(
        `
        SELECT
          c.id AS cusres_id,
          u.id AS user_id,
          u.username,
          u.email,
          u.firstname,
          u.lastname,
          u.linkedin,
          u.portfolio,
          u.leetcode,
          c.projects,
          c.certifications,
          c.awards,
          c.experiences
        FROM cusres c
        JOIN users u ON u.id = c.user_id
        WHERE c.slug = $1
        LIMIT 1
        `,
        [slug]
    );

    const base = rows[0];
    if (!base) return null;

    const combined = await query<{
        education: Education | null;
        projects: Project[] | null;
        certifications: Certification[] | null;
        experiences: Experience[] | null;
        awards: Award[] | null;
    }>(
        `
        SELECT
          (SELECT row_to_json(e)
           FROM (
             SELECT id, school, degree, field,
                    start_date AS "startDate",
                    end_date AS "endDate",
                    grade, description
             FROM education
             WHERE user_id = $1
             LIMIT 1
           ) e) AS education,

          (SELECT json_agg(p ORDER BY ord)
           FROM unnest($2::int[]) WITH ORDINALITY AS sel(id, ord)
           JOIN project p ON p.id = sel.id
          ) AS projects,

          (SELECT json_agg(c ORDER BY ord)
           FROM unnest($3::int[]) WITH ORDINALITY AS sel(id, ord)
           JOIN certification c ON c.id = sel.id
          ) AS certifications,

          (SELECT json_agg(e2 ORDER BY ord)
           FROM unnest($4::int[]) WITH ORDINALITY AS sel(id, ord)
           JOIN experience e2 ON e2.id = sel.id
          ) AS experiences,

          (SELECT json_agg(a ORDER BY ord)
           FROM unnest($5::int[]) WITH ORDINALITY AS sel(id, ord)
           JOIN award a ON a.id = sel.id
          ) AS awards
        `,
        [
            base.user_id,
            base.projects,
            base.certifications,
            base.experiences,
            base.awards,
        ]
    );

    const data = combined[0];
    const fullName =
        base.firstname && base.lastname
            ? `${base.firstname} ${base.lastname}`
            : base.username;

    return {
        payload: {
            name: fullName,
            role: slug,
            email: safe(base.email),
            linkedin: safe(base.linkedin),
            portfolio: safe(base.portfolio),
            github: safe(base.username),
            leetcode: safe(base.leetcode),
            education: data.education
                ? {
                      name: safe(data.education.school),
                      location: "",
                      degree: safe(data.education.degree),
                      course: safe(data.education.field),
                      from: safe(data.education.startDate),
                      to: safe(data.education.endDate),
                      score: safe(data.education.grade),
                      maxscore: "",
                  }
                : null,
            courses: (data.certifications || []).map((c) => ({
                title: safe(c.title),
                provider: safe(c.platform),
                started_at: safe(c.completedOn),
                completed_at: safe(c.completedOn),
                highlights: c.description ? [safe(c.description)] : [],
            })),
            projects: (data.projects || []).map((p) => ({
                title: safe(p.name),
                url: safe(p.url || "https://github.com/" + p.repo),
                skills: Array.isArray(p.tech) ? p.tech : [],
                highlights: p.description ? [safe(p.description)] : [],
                from_date: safe(p.startDate),
                to_date: safe(p.endDate),
            })),
            experiences: (data.experiences || []).map((e) => ({
                title: safe(e.title),
                company: safe(e.company),
                location: "",
                from_date: safe(e.startDate),
                to_date: safe(e.endDate),
                highlights: e.description ? [safe(e.description)] : [],
            })),
            awards: (data.awards || []).map((a) => ({
                title: safe(a.title),
                issuer: safe(a.issuer),
                type: safe(a.type),
                date: safe(a.date),
                highlights: a.description ? [safe(a.description)] : [],
            })),
        },
        cusresId: base.cusres_id,
    };
}

export async function GET(
    req: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params;

        const limited = await rateLimit(req, {
            mode: "ip",
            route: "cusres",
            limit: 3,
            windowSec: 60,
            html: true,
        });
        if (limited) return limited;

        const cache = await query<{
            compiled_at: string | null;
            data_updated_at: string;
        }>(
            `
            SELECT compiled_at, data_updated_at
            FROM cusres
            WHERE slug = $1
            LIMIT 1
            `,
            [slug]
        );

        if (
            cache[0]?.compiled_at &&
            new Date(cache[0].compiled_at) >=
                new Date(cache[0].data_updated_at)
        ) {
            const signed = await signUrl(`${slug}.pdf`);
            return NextResponse.redirect(signed, { status: 307 });
        }

        const data = await fetchCusresData(slug);
        if (!data) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const gen = await fetch(RESGEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.payload),
        });

        if (!gen.ok) {
            const body = await gen.text();
            return NextResponse.json(
                { error: "resgen failed", body },
                { status: 500 }
            );
        }

        const pdf = Buffer.from(await gen.arrayBuffer());
        const filename = `${slug}.pdf`;

        waitUntil(
            query(
                `
                UPDATE cusres
                SET compiled_at = NOW()
                WHERE id = $1
                `,
                [data.cusresId]
            ).catch(() => {})
        );

        return new NextResponse(pdf, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${filename}"`,
                "Cache-Control": "public, max-age=12",
            },
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        return NextResponse.json(
            { error: "Internal Error", message: e?.message },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const limited = await rateLimit(req, {
            mode: "ip",
            route: "cusres-tex",
            limit: 1,
            windowSec: 15,
        });
        if (limited) return limited;

        if (!req.headers.get("Authorization")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug } = await req.json();
        if (!slug) {
            return NextResponse.json({ error: "Missing slug" }, { status: 400 });
        }

        const data = await fetchCusresData(slug);
        if (!data) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const gen = await fetch(RESGEN_TEX_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.payload),
        });

        if (!gen.ok) {
            return NextResponse.json({ error: "Tex gen failed" }, { status: 500 });
        }

        return new NextResponse(await gen.text(), {
            status: 200,
            headers: {
                "Content-Type": "application/x-tex",
                "Content-Disposition": `attachment; filename="${slug}.tex"`,
            },
        });
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
