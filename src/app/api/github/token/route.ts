import { NextResponse } from "next/server"

export async function POST(req: Request) {

    const { code } = await req.json()

    const CLIENT_ID = process.env.GITHUB_CLIENT_ID
    const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

    if (!code) {
        return NextResponse.json({ error: "Missing code" }, { status: 400 })
    }

    const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code
            })
        }
    )

    const data = await response.json()

    if (!response.ok || data.error) {
        return NextResponse.json(
            { error: data.error || "OAuth exchange failed" },
            { status: 500 }
        )
    }

    return NextResponse.json({
        access_token: data.access_token
    })
}