import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

function cleanDescriptions<T>(data: T): T {
    if (Array.isArray(data)) {
        return (data as unknown[]).map(cleanDescriptions) as T;
    } 
    
    if (data !== null && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        const cleaned: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj)) {
            if ((key === 'desc' || key === 'description') && typeof value === 'string') {
                cleaned[key] = value.replace(/##\w+##/g, '').trim();
            } else {
                cleaned[key] = cleanDescriptions(value);
            }
        }
        return cleaned as T;
    }
    
    return data;
}

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
    const requestedFields = selectParam ? selectParam.split(',').map(s => s.trim()) : [];
    
    const sql = `
        SELECT json_build_object(
            'username', u.username,
            'avatar', u.avatarurl,
            'email', CASE WHEN u.showemail IS TRUE THEN u.email ELSE NULL END,
            'projects', CASE 
                WHEN (('projects' = ANY($2) OR cardinality($2) = 0) AND u.showprojects IS TRUE) 
                THEN (
                    SELECT COALESCE(json_agg(
                        json_build_object('name', p.name, 'desc', p.description, 'url', p.url, 'tech', p.tech)
                    ), '[]'::json) FROM project p WHERE p.user_id = u.id
                ) ELSE NULL END,
            'experience', CASE 
                WHEN (('experience' = ANY($2) OR cardinality($2) = 0) AND u.showexperience IS TRUE) 
                THEN (
                    SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json) 
                    FROM experience e WHERE e.user_id = u.id
                ) ELSE NULL END,
            'awards', CASE 
                WHEN (('awards' = ANY($2) OR cardinality($2) = 0) AND u.showawards IS TRUE) 
                THEN (
                    SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json) 
                    FROM award a WHERE a.user_id = u.id
                ) ELSE NULL END,
            'skills', CASE
                WHEN ('skills' = ANY($2) OR cardinality($2) = 0) THEN u.skills ELSE NULL END
        ) AS data
        FROM users u
        WHERE u.username = $1
    `;

    try {
        const result = await query<{ data: unknown }>(sql, [username, requestedFields]);
        
        const rawData = result[0]?.data;

        if (!rawData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        const userData = cleanDescriptions(rawData);

        return NextResponse.json(userData, {
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