import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

interface Project {
    name: string;
    desc: string;
    url?: string;
    tech?: string[];
}

interface Experience {
    description?: string;
    [key: string]: unknown; 
}

interface Award {
    description?: string;
    [key: string]: unknown;
}

interface UserData {
    username: string;
    avatar: string; 
    email?: string | null;
    projects?: Project[];
    experience?: Experience[];
    awards?: Award[];
    skills?: string[] | string | null;
}

// Helper to clean strings
const clean = (text: string | undefined) => text ? text.replace(/##\w+##/g, '').trim() : "";

export async function GET(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    const limited = await rateLimit(request, { 
        mode: "ip", 
        route: "public_api", 
        limit: 2, 
        windowSec: 30 
    });

    if (limited) return limited;
    
    const { username } = params;
    const searchParams = request.nextUrl.searchParams;
    const selectParam = searchParams.get('select') || request.headers.get('x-select');

    if (!selectParam) {
        return NextResponse.json({ 
            error: "Missing 'select' parameter. Please specify fields (e.g., ?select=projects,skills)." 
        }, { status: 400 });
    }

    const requestedFields = new Set(selectParam.split(',').map(s => s.trim()));
    
    // 1. Build Query
    const jsonParts = [
        "'username', u.username",
        "'avatar', u.avatarurl"
    ];

    if (requestedFields.has('email')) {
        jsonParts.push("'email', CASE WHEN u.showemail IS TRUE THEN u.email ELSE NULL END");
    }

    if (requestedFields.has('projects')) {
        jsonParts.push(`
            'projects', CASE WHEN u.showprojects IS TRUE THEN (
                SELECT COALESCE(json_agg(
                    json_build_object('name', p.name, 'desc', p.description, 'url', p.url, 'tech', p.tech)
                ), '[]'::json) FROM project p WHERE p.user_id = u.id
            ) ELSE NULL END
        `);
    }

    if (requestedFields.has('experience')) {
        jsonParts.push(`
            'experience', CASE WHEN u.showexperience IS TRUE THEN (
                SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json) 
                FROM experience e WHERE e.user_id = u.id
            ) ELSE NULL END
        `);
    }

    if (requestedFields.has('awards')) {
        jsonParts.push(`
            'awards', CASE WHEN u.showawards IS TRUE THEN (
                SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json) 
                FROM award a WHERE a.user_id = u.id
            ) ELSE NULL END
        `);
    }

    if (requestedFields.has('skills')) {
        jsonParts.push("'skills', u.skills");
    }

    const sql = `
        SELECT json_build_object(${jsonParts.join(',')}) AS data
        FROM users u
        WHERE u.username = $1
    `;

    try {
        const result = await query<{ data: UserData }>(sql, [username]);
        const rawData = result[0]?.data;

        if (!rawData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const responseData: Record<string, unknown> = {
            username: rawData.username,
            avatar: rawData.avatar,
        };

        if (rawData.email) responseData.email = rawData.email;
        if (rawData.skills) responseData.skills = rawData.skills;

        if (rawData.projects) {
            responseData.projects = rawData.projects.map((p: Project) => ({
                ...p,
                desc: clean(p.desc)
            }));
        }

        if (rawData.experience) {
            responseData.experience = rawData.experience.map((e: Experience) => ({
                ...e,
                description: clean(e.description)
            }));
        }

        if (rawData.awards) {
            responseData.awards = rawData.awards.map((a: Award) => ({
                ...a,
                description: clean(a.description)
            }));
        }

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30"
            }
        });
    } catch (error) {
        console.error("Public API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}