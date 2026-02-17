import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { rateLimit } from "@/lib/valkey";

interface UserData {
    data: Record<string, unknown>;
    [key: string]: unknown;
}

const SQL_CLEAN = (col: string) => `REGEXP_REPLACE(${col}, '##\\w+##', '', 'g')`;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-select",
};

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}

export async function GET(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    const limited = await rateLimit(request, {
        mode: "ip",
        route: "public_api",
        limit: 10,
        windowSec: 60
    });

    if (limited) return limited;

    const { username } = params;
    const selectParam =
        request.nextUrl.searchParams.get("select") ||
        request.headers.get("x-select");

    if (!selectParam) {
        return NextResponse.json(
            { error: "Missing 'select' parameter" },
            { status: 400, headers: CORS_HEADERS }
        );
    }

    const requestedFields = new Set(
        selectParam.split(",").map((s) => s.trim())
    );

    const jsonParts = [
        "'username', u.username",
        "'avatar', u.avatarurl",
    ];

    if (requestedFields.has("email")) {
        jsonParts.push(
            "'email', CASE WHEN u.showemail IS TRUE THEN u.email ELSE NULL END"
        );
    }

    if (requestedFields.has("projects")) {
        jsonParts.push(`
            'projects', CASE WHEN u.showprojects IS TRUE THEN (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'name', p.name,
                        'desc', ${SQL_CLEAN("p.description")},
                        'url', p.url,
                        'tech', p.tech
                    )
                ), '[]'::json)
                FROM project p
                WHERE p.user_id = u.id
            ) ELSE NULL END
        `);
    }

    if (requestedFields.has("experience")) {
        jsonParts.push(`
            'experience', CASE WHEN u.showexperience IS TRUE THEN (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'title', e.title,
                        'company', e.company,
                        'description', ${SQL_CLEAN("e.description")},
                        'startDate', e.start_date,
                        'endDate', e.end_date
                    )
                ), '[]'::json)
                FROM experience e
                WHERE e.user_id = u.id
            ) ELSE NULL END
        `);
    }

    if (requestedFields.has("awards")) {
        jsonParts.push(`
            'awards', CASE WHEN u.showawards IS TRUE THEN (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'title', a.title,
                        'issuer', a.issuer,
                        'description', ${SQL_CLEAN("a.description")},
                        'date', a.date
                    )
                ), '[]'::json)
                FROM award a
                WHERE a.user_id = u.id
            ) ELSE NULL END
        `);
    }

    if (requestedFields.has("certificates")) {
        jsonParts.push(`
            'certificates', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'title', c.title,
                        'platform', c.platform,
                        'description', ${SQL_CLEAN("c.description")},
                        'url', c.url,
                        'completedOn', c.completed_on,
                        'role', c.role
                    )
                ), '[]'::json)
                FROM certification c
                WHERE c.user_id = u.id
            )
        `);
    }

    if (requestedFields.has("education")) {
        jsonParts.push(`
            'education', CASE WHEN u.showeducation IS TRUE THEN (
                SELECT row_to_json(ed)
                FROM (
                    SELECT
                        e.school,
                        e.degree,
                        e.field,
                        e.start_date AS "startDate",
                        e.end_date AS "endDate",
                        e.grade,
                        ${SQL_CLEAN("e.description")} AS description
                    FROM education e
                    WHERE e.user_id = u.id
                    LIMIT 1
                ) ed
            ) ELSE NULL END
        `);
    }

    if (requestedFields.has("profile")) {
        jsonParts.push(`
        'profile', json_build_object(
            'firstName', u.firstname,
            'lastName', u.lastname,
            'linkedin', u.linkedin,
            'portfolio', u.portfolio,
            'leetcode', u.leetcode,
            'phoneNumber', u.phonenumber,
            'education', CASE WHEN u.showeducation IS TRUE THEN (
                SELECT row_to_json(ed)
                FROM (
                    SELECT
                        e.school,
                        e.degree,
                        e.field,
                        e.start_date AS "startDate",
                        e.end_date AS "endDate",
                        e.grade,
                        ${SQL_CLEAN("e.description")} AS description
                    FROM education e
                    WHERE e.user_id = u.id
                    LIMIT 1
                ) ed
            ) ELSE NULL END
        )
    `);
    }

    if (requestedFields.has("skills")) {
        jsonParts.push("'skills', u.skills");
    }

    const sql = `
        SELECT json_build_object(${jsonParts.join(",")}) AS data
        FROM users u
        WHERE u.username = $1
        LIMIT 1
    `;

    try {
        const result = await query<UserData>(sql, [username]);
        const responseData = result[0]?.data;

        if (!responseData) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404, headers: CORS_HEADERS }
            );
        }

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                ...CORS_HEADERS,
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
                "Content-Type": "application/json",
            },
        });
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
