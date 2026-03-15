import { NextResponse } from "next/server"

export async function POST(req: Request) {

    const { repo } = await req.json()

    const match = repo.match(/github\.com\/([^/]+)\/([^/]+)/)

    if (!match) {
        return NextResponse.json({ error: "Invalid repo url" }, { status: 400 })
    }

    const owner = match[1]
    const name = match[2]

    const zipUrl = `https://codeload.github.com/${owner}/${name}/zip/refs/heads/main`

    const res = await fetch(zipUrl)

    if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 })
    }

    const buffer = await res.arrayBuffer()

    return new Response(buffer, {
        headers: {
            "Content-Type": "application/zip"
        }
    })
}