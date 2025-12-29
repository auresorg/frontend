import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { User, Project, Education, Certification, Experience, Award } from "@/lib/types";
import { rateLimit } from "@/lib/valkey";
import { waitUntil } from '@vercel/functions';

const FILE_BASE = "https://vjuvnrvitnsvfopqukho.supabase.co";
const RESGEN_URL = "https://aures-docgen-d3ftgqf7fmdwbjff.centralindia-01.azurewebsites.net/api/resume";
const RESGEN_TEX_URL = "https://aures-docgen-d3ftgqf7fmdwbjff.centralindia-01.azurewebsites.net/api/tex";

const AllowedRoles = new Set(["frontend", "backend", "fullstack", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"]);

const ESCAPE_MAP: Record<string, string> = {
    '\\': '\\textbackslash', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#',
    '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde', '^': '\\textasciicircum',
    '\u2013': '-', '\u2014': '-', '\u00A0': ' '
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
    return s.replace(ESCAPE_REGEX, (match) => ESCAPE_MAP[match]);
};

async function signUrl(filename: string) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

    // Supabase Admin API to sign URL
    const signRes = await fetch(`${FILE_BASE}/storage/v1/object/sign/aurespdf/${filename}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ expiresIn: 10 })
    });

    if (!signRes.ok) throw new Error("Failed to sign URL");

    const data = await signRes.json();

    let signedPath = data.signedURL;
    if (!signedPath.startsWith("/storage/v1")) {
        signedPath = `/storage/v1${signedPath.startsWith("/") ? signedPath : "/" + signedPath}`;
    }

    return `${FILE_BASE}${signedPath}`;
}

async function fetchResumeData(username: string, role: string) {
    const users = await query<User>(
        `SELECT id, username, email, avatarurl, firstname as "firstName", lastname as "lastName", linkedin, portfolio, leetcode, plan, skills, projectscount, certcount, awardscount, experiencecount FROM users WHERE username = $1 LIMIT 1`,
        [username]
    );

    const user = users[0];
    if (!user) return null;

    const combined = await query<{
        education: Education | null;
        projects: Project[] | null;
        certifications: Certification[] | null;
        experiences: Experience[] | null;
        awards: Award[] | null;
    }>(
        `SELECT
            (SELECT row_to_json(e) FROM (SELECT id, school, degree, field, start_date AS "startDate", end_date AS "endDate", grade, description FROM education WHERE user_id = $1 LIMIT 1) e) AS education,
            (SELECT json_agg(p) FROM (SELECT id, name, repo, url, tech, description, role, start_date AS "startDate", end_date AS "endDate" FROM project WHERE user_id = $1 AND role = $2 ORDER BY start_date DESC) p) AS projects,
            (SELECT json_agg(c) FROM (SELECT id, title, platform, description, url, completed_on AS "completedOn", role FROM certification WHERE user_id = $1 AND role = $2 ORDER BY completed_on DESC) c) AS certifications,
            (SELECT json_agg(e2) FROM (SELECT id, title, company, start_date AS "startDate", end_date AS "endDate", description, role FROM experience WHERE user_id = $1 AND role = $2 ORDER BY start_date DESC) e2) AS experiences,
            (SELECT json_agg(a) FROM (SELECT id, title, issuer, type, description, date, role FROM award WHERE user_id = $1 AND (role = $2 OR role IS NULL) ORDER BY date DESC) a) AS awards`,
        [user.id, role]
    );

    const data = combined[0];
    const fullName = (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.username;

    const payload = {
        name: fullName,
        role,
        email: safe(user.email),
        linkedin: safe(user.linkedin),
        portfolio: safe(user.portfolio),
        github: safe(user.username),
        leetcode: safe(user.leetcode),
        education: data.education ? {
            name: safe(data.education.school),
            location: "",
            degree: safe(data.education.degree),
            course: safe(data.education.field),
            from: safe(data.education.startDate),
            to: safe(data.education.endDate),
            score: safe(data.education.grade),
            maxscore: "",
        } : null,
        courses: (data.certifications || []).map(c => ({
            title: safe(c.title),
            provider: safe(c.platform),
            started_at: safe(c.completedOn),
            completed_at: safe(c.completedOn),
            highlights: c.description ? [safe(c.description)] : []
        })),
        projects: (data.projects || []).map(p => ({
            title: safe(p.name),
            url: safe(p.url || "https://github.com/" + p.repo),
            skills: Array.isArray(p.tech) ? p.tech : [],
            highlights: p.description ? [safe(p.description)] : [],
            from_date: safe(p.startDate),
            to_date: safe(p.endDate)
        })),
        experiences: (data.experiences || []).map(e => ({
            title: safe(e.title),
            company: safe(e.company),
            location: "",
            from_date: safe(e.startDate),
            to_date: safe(e.endDate),
            highlights: e.description ? [safe(e.description)] : []
        })),
        awards: (data.awards || []).map(a => ({
            title: safe(a.title),
            issuer: safe(a.issuer),
            type: safe(a.type),
            date: safe(a.date),
            highlights: a.description ? [safe(a.description)] : []
        }))
    };

    return { user, payload };
}

export async function GET(
    _req: Request,
    { params }: { params: { username: string; r: string } }
) {
    try {
        const { username, r } = params;
        const role = r.endsWith(".pdf") ? r.slice(0, -4) : r;

        if (!AllowedRoles.has(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

        const limited = await rateLimit(_req, { mode: "ip", route: "resume", limit: 3, windowSec: 60, html: true });
        if (limited) return limited;

        // Check Cache
        const cacheResult = await query<{
            url: string;
            compiled_at: string;
            data_updated_at: string | null;
        }>(
            `SELECT url, compiled_at, data_updated_at 
             FROM resumes 
             WHERE username = $1 AND role = $2 
             LIMIT 1`,
            [username, role]
        );

        // Cache Hit
        if (cacheResult.length > 0) {
            const { compiled_at, data_updated_at } = cacheResult[0];

            if (!data_updated_at || new Date(compiled_at) >= new Date(data_updated_at)) {
                const signedUrl = await signUrl(`${username}-${role}.pdf`);
                return NextResponse.redirect(signedUrl, { status: 307 });
            }
        }

        // Cache Miss - Generate
        const data = await fetchResumeData(username, role);

        if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const gen = await fetch(RESGEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.payload),
        });

        if (!gen.ok) {
            const errBody = await gen.text();
            return NextResponse.json({ error: "resgen failed", body: errBody }, { status: 500 });
        }

        const pdfBuffer = Buffer.from(await gen.arrayBuffer());

        const filename = `${username}-${role}.pdf`;
        const storedPath = `/storage/v1/object/public/aurespdf/${filename}`;

        waitUntil(
            query(
                `INSERT INTO resumes (user_id, username, role, url, compiled_at, created_at, updated_at, projects, certificates, awards, experience)
                VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW(), 0, 0, 0, 0)
                ON CONFLICT (username, role) 
                DO UPDATE SET url = $4, compiled_at = NOW(), updated_at = NOW()`,
                [data.user.id, username, role, storedPath]
            ).catch(err => console.error("Background DB Update Failed:", err))
        );

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${filename}"`,
                "Cache-Control": "public, max-age=12"
            }
        });

    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;
        return NextResponse.json(
            { error: "Internal Error", message: err?.message },
            { status: 500 },
        );
    }
}

export async function POST(
    req: Request
) {
    try {
        const limited = await rateLimit(req, { mode: "ip", route: "tex-gen", limit: 1, windowSec: 15 });
        if (limited) return limited;

        if (!req.headers.get("Authorization")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { username, role } = await req.json();

        if (!username || !role) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

        if (!AllowedRoles.has(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

        const data = await fetchResumeData(username, role);
        if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const gen = await fetch(RESGEN_TEX_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.payload),
        });

        if (!gen.ok) return NextResponse.json({ error: "Tex gen failed" }, { status: 500 });

        return new NextResponse(await gen.text(), {
            status: 200,
            headers: {
                "Content-Type": "application/x-tex",
                "Content-Disposition": `attachment; filename="${username}-${role}.tex"`,
            }
        });

    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}