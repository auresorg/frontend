import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/valkey";
import { Award, Certification, Experience, Project } from "@/lib/types";

const RESGEN_URL = "https://aures-docgen-d3ftgqf7fmdwbjff.centralindia-01.azurewebsites.net/api/cusresd";

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

const safe = (v: string | null): string => {
    if (!v) return "";
    let s = v;
    if (s.startsWith("##")) {
        const end = s.indexOf("##", 2);
        if (end !== -1) s = s.substring(end + 2).trim();
    }
    return s.replace(ESCAPE_REGEX, (m) => ESCAPE_MAP[m]);
};


export async function POST(req: Request) {
    try {
        // ---------- AUTH ----------
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const publicKey = process.env.PUBLIC_KEY?.replace(/\\n/g, "\n");
        if (!publicKey) {
            console.error("PUBLIC_KEY missing");
            return NextResponse.json({ error: "Server error" }, { status: 500 });
        }

        const decoded = verify(token, publicKey, { algorithms: ["RS256"] });
        if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = Number(decoded.id);

        // ---------- RATE LIMIT ----------
        const limited = await rateLimit(req, {
            mode: "user",
            identifier: String(userId),
            route: "download",
            limit: 2,
            windowSec: 30,
        });
        if (limited) return limited;

        // ---------- BODY ----------
        const {
            projects = [],
            certifications = [],
            experiences = [],
            awards = [],
        } = await req.json();

        // ---------- SINGLE DB QUERY ----------
        const rows = await query<{
            username: string;
            email: string;
            firstname: string | null;
            lastname: string | null;
            linkedin: string | null;
            portfolio: string | null;
            leetcode: string | null;
            projects: Project[];
            certifications: Certification[];
            experiences: Experience[];
            awards: Award[];
        }>(
            `
            WITH base AS (
                SELECT
                    id,
                    username,
                    email,
                    firstname,
                    lastname,
                    linkedin,
                    portfolio,
                    leetcode
                FROM users
                WHERE id = $1::int
                LIMIT 1
            )
            SELECT
                b.username,
                b.email,
                b.firstname,
                b.lastname,
                b.linkedin,
                b.portfolio,
                b.leetcode,

                (
                    SELECT json_agg(p ORDER BY sel.ord)
                    FROM unnest($2::int[]) WITH ORDINALITY sel(id, ord)
                    JOIN (
                        SELECT id, user_id, name, repo, url, tech, description,
                            start_date AS "startDate",
                            end_date   AS "endDate"
                        FROM project
                    ) p
                    ON p.id = sel.id
                    AND p.user_id = b.id
                ) AS projects,

                (
                    SELECT json_agg(c ORDER BY sel.ord)
                    FROM unnest($3::int[]) WITH ORDINALITY sel(id, ord)
                    JOIN (
                        SELECT id, user_id, title, platform, description,
                            completed_on AS "completedOn"
                        FROM certification
                    ) c ON c.id = sel.id
                     AND c.user_id = b.id
                ) AS certifications,

                (
                    SELECT json_agg(e ORDER BY sel.ord)
                    FROM unnest($4::int[]) WITH ORDINALITY sel(id, ord)
                    JOIN (
                        SELECT id, user_id, title, company, description,
                            start_date AS "startDate",
                            end_date   AS "endDate"
                        FROM experience
                    ) e ON e.id = sel.id
                     AND e.user_id = b.id
                ) AS experiences,

                (
                    SELECT json_agg(a ORDER BY sel.ord)
                    FROM unnest($5::int[]) WITH ORDINALITY sel(id, ord)
                    JOIN award a
                      ON a.id = sel.id
                     AND a.user_id = b.id
                ) AS awards

            FROM base b
            `,
            [
                userId,
                projects,
                certifications,
                experiences,
                awards,
            ]
        );

        if (!rows[0]) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const u = rows[0];

        // ---------- FINAL PAYLOAD (MATCHES DEPLOY STRUCTURE) ----------
        const payload = {
            name: safe(
                u.firstname && u.lastname
                    ? `${u.firstname} ${u.lastname}`
                    : u.username
            ),
            role: "download",
            email: safe(u.email),
            linkedin: safe(u.linkedin),
            portfolio: safe(u.portfolio),
            github: safe(u.username),
            leetcode: safe(u.leetcode),

            education: null,

            courses: (u.certifications ?? []).map((c: Certification) => ({
                title: safe(c.title),
                provider: safe(c.platform),
                started_at: safe(c.completedOn),
                completed_at: safe(c.completedOn),
                highlights: c.description ? [safe(c.description)] : [],
            })),

            projects: (u.projects ?? []).map((p: Project) => ({
                title: safe(p.name),
                url: safe(p.url ?? (p.repo ? `https://github.com/${p.repo}` : "")),
                skills: Array.isArray(p.tech) ? p.tech : [],
                highlights: p.description ? [safe(p.description)] : [],
                from_date: safe(p.startDate),
                to_date: safe(p.endDate ?? null),
            })),

            experiences: (u.experiences ?? []).map((e: Experience) => ({
                title: safe(e.title),
                company: safe(e.company),
                location: "",
                from_date: safe(e.startDate),
                to_date: safe(e.endDate),
                highlights: e.description ? [safe(e.description)] : [],
            })),

            awards: (u.awards ?? []).map((a: Award) => ({
                title: safe(a.title),
                issuer: safe(a.issuer),
                type: safe(a.type),
                date: safe(a.date),
                highlights: a.description ? [safe(a.description)] : [],
            })),
        };



        // ---------- RESUME GEN ----------
        const gen = await fetch(RESGEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!gen.ok) {
            const text = await gen.text();
            console.error("ResGen failed:", text);
            return NextResponse.json(
                { error: "Resume generation failed" },
                { status: 500 }
            );
        }

        const pdf = Buffer.from(await gen.arrayBuffer());

        return new NextResponse(pdf, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="resume.pdf"`,
            },
        });
    } catch (err) {
        console.error("Download fatal error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
