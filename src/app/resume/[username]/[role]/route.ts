import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { User, Project, Education, Certification, Experience, Award } from "@/lib/types";
import { rateLimit } from "@/lib/rateLimit";

const FILE_BASE = "https://vjuvnrvitnsvfopqukho.supabase.co";
const RESGEN_URL = "https://aures-docgen-d3ftgqf7fmdwbjff.centralindia-01.azurewebsites.net/api/resume";
const AllowedRoles = new Set(["frontend", "backend", "fullstack", "devops", "mobile", "aiml", "product", "qa", "designer", "blockchain"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safe = (v: any): string => {
    if (!v) return "";

    let s = String(v);

    // --- strip any leading ##FORMAT## block ---
    if (s.startsWith("##")) {
        const end = s.indexOf("##", 2);
        if (end !== -1) {
            s = s.substring(end + 2).trim();
        }
    }

    // --- normalize odd unicode dash/space artifacts if needed ---
    s = s.replace(/\u2013|\u2014/g, "-")  // long dashes → hyphen
        .replace(/\u00A0/g, " ");       // non-breaking space → space

    return s;
};

function fullUrl(p: string) {
    return `${FILE_BASE}${p.startsWith("/") ? p : `/${p}`}`;
}

async function file(stored: string, filename: string) {
    const pdfUrl = fullUrl(stored);

    const pdfRes = await fetch(pdfUrl);

    if (!pdfRes.ok) {
        return NextResponse.json(
            { error: "Failed to load PDF from storage" },
            { status: 500 }
        );
    }

    const buffer = Buffer.from(await pdfRes.arrayBuffer());

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
            "Cache-Control": "public, max-age=12"
        }
    });
}


export async function GET(
    _req: Request,
    { params }: { params: { username: string; role: string } }
) {
    try {
        const limited = await rateLimit(_req, { mode: "ip", route: "resume", limit: 3, windowSec: 60, html: true });
        if (limited) return limited;

        const { username, role } = params;

        if (!AllowedRoles.has(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const users = await query<User>(
            `SELECT id, username, email, avatarurl, firstname as "firstName", lastname as "lastName", linkedin, portfolio, leetcode, plan, skills, projectscount, certcount, awardscount, experiencecount FROM users WHERE username = $1 LIMIT 1`,
            [username]
        );
        const user = users[0];
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const fullName = (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.username;

        const userId = user.id;

        // 2) CACHE
        const cache = await query<{
            url: string;
            compiled_at: string;
            data_updated_at: string | null;
        }>(
            ` SELECT url, compiled_at, data_updated_at FROM resumes WHERE user_id = $1 AND role = $2 LIMIT 1`,
            [userId, role]
        );

        if (cache.length > 0) {
            const { url, compiled_at, data_updated_at } = cache[0];
            if (!data_updated_at || new Date(compiled_at) >= new Date(data_updated_at)) {
                return file(url, `${username}-${role}.pdf`);
            }
        }

        // 3) RELATED DATA (typed to your existing types)
        const combined = await query<{
            education: Education | null;
            projects: Project[] | null;
            certifications: Certification[] | null;
            experiences: Experience[] | null;
            awards: Award[] | null;
        }>(
            `
        SELECT
            (
                SELECT row_to_json(e)
                FROM (
                    SELECT id, school, degree, field, start_date AS "startDate", end_date AS "endDate", grade, description
                    FROM education
                    WHERE user_id = $1
                    LIMIT 1
                ) e
            ) AS education,
            (
                SELECT json_agg(p)
                FROM (
                    SELECT id, name, repo, url, tech, description, role, start_date AS "startDate", end_date AS "endDate"
                    FROM project
                    WHERE user_id = $1 AND role = $2
                    ORDER BY start_date DESC
                ) p
            ) AS projects,
            (
                SELECT json_agg(c)
                FROM (
                    SELECT id, title, platform, description, url, completed_on AS "completedOn", role
                    FROM certification
                    WHERE user_id = $1 AND role = $2
                    ORDER BY completed_on DESC
                ) c
            ) AS certifications,
            (
                SELECT json_agg(e2)
                FROM (
                    SELECT id, title, company, start_date AS "startDate", end_date AS "endDate", description, role
                    FROM experience
                    WHERE user_id = $1 AND role = $2
                    ORDER BY start_date DESC
                ) e2
            ) AS experiences,
             (
                SELECT json_agg(a)
                FROM (
                    SELECT id, title, issuer, type, description, date, role
                    FROM award
                    WHERE user_id = $1 AND (role = $2 OR role IS NULL)
                    ORDER BY date DESC
                ) a
            ) AS awards
        `,
            [userId, role]
        );

        const educationRows = combined[0].education ? [combined[0].education] : [];
        const projectRows = combined[0].projects || [];
        const certRows = combined[0].certifications || [];
        const expRows = combined[0].experiences || [];
        const awardRows = combined[0].awards || [];

        const education: Education | undefined = educationRows[0];

        const projects: Project[] = projectRows;
        const certifications: Certification[] = certRows;
        const experiences: Experience[] = expRows;
        const awards: Award[] = awardRows

        // 4) NORMALIZE FOR RESGEN (arrays always exist; strings sanitized)
        const formattedEducation = education
            ? {
                name: safe(education.school),
                location: "",
                degree: safe(education.degree),
                course: safe(education.field),
                from: safe(education.startDate),
                to: safe(education.endDate),
                score: safe(education.grade),
                maxscore: "",
            }
            : null;

        const courses = certifications.map((c) => ({
            title: safe(c.title),
            provider: safe(c.platform),
            started_at: safe(c.completedOn),
            completed_at: safe(c.completedOn),
            highlights: c.description ? [safe(c.description)] : [],
        }));

        const formattedProjects = projects.map((p) => (typeof p === "object" ? {
            title: safe(p.name),
            url: safe(p.url || "https://github.com/"+p.repo),
            skills: Array.isArray(p.tech) ? p.tech : [],
            highlights: p.description ? [safe(p.description)] : [],
            from_date: safe(p.startDate),
            to_date: safe(p.endDate),
        } : p));

        const formattedExperiences = experiences.map((e) => (typeof e === "object" ? {
            title: safe(e.title),
            company: safe(e.company),
            location: "",
            from_date: safe(e.startDate),
            to_date: safe(e.endDate),
            highlights: e.description ? [safe(e.description)] : [],
        } : e));

        const formattedAwards = awards.map((a) => ({
            title: safe(a.title),
            issuer: safe(a.issuer),
            type: safe(a.type), // e.g., "First Prize", "Participation"
            date: safe(a.date),
            highlights: a.description ? [safe(a.description)] : [],
        }));

        const payload = {
            name: fullName,
            role,
            email: safe(user.email),
            linkedin: safe(user.linkedin),
            portfolio: safe(user.portfolio),
            github: safe(user.username),
            leetcode: safe(user.leetcode),
            education: formattedEducation,
            courses,
            projects: formattedProjects,
            experiences: formattedExperiences,
            awards: formattedAwards
        };

        // 5) CALL RESGEN
        const gen = await fetch(RESGEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!gen.ok) {
            let errBody = "";
            try { errBody = await gen.text(); } catch { }

            return NextResponse.json(
                {
                    error: "resgen failed",
                    status: gen.status,
                    statusText: gen.statusText,
                    body: errBody,
                    debugPayload: payload,
                },
                { status: 500 },
            );
        }

        const pdfArrayBuffer = await gen.arrayBuffer();
        const pdfBuffer = Buffer.from(pdfArrayBuffer);
        const filename = `${username}-${role}.pdf`;
        const storedPath = `/storage/v1/object/public/aurespdf/${filename}`;

        await query(
            `INSERT INTO resumes (user_id, username, role, url, compiled_at) 
            VALUES ($1, $2, $3, $4, NOW()) 
            ON CONFLICT (username, role) 
            DO UPDATE SET url = EXCLUDED.url, compiled_at = EXCLUDED.compiled_at`,
            [userId, username, role, storedPath]
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
            {
                error: "unhandled error in resume GET",
                message: err?.message ?? String(err),
                stack: err?.stack ?? null,
            },
            { status: 500 },
        );
    }
}
