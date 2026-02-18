import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verify } from "jsonwebtoken"

type Invite = {
  username: string
  accept: boolean
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(null, { status: 400 })
    }

    const token = authHeader.split(" ")[1]
    const publicKey = process.env.PUBLIC_KEY?.replace(/\\n/g, '\n')

    if (!publicKey) {
      console.error("PUBLIC_KEY not set")
      return new Response(null, { status: 500 })
    }

    const decoded = verify(token, publicKey, { algorithms: ["RS256"] })

    if (!decoded || typeof decoded !== "object" || decoded["id"] !== 1 || decoded["id"] !== 1) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const invites = await query<Invite>(
      `SELECT username, accept FROM invites ORDER BY username ASC`
    )

    return NextResponse.json({ invites })
  } catch (err) {
    console.error("Admin invites error:", err)
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(null, { status: 400 })
    }

    const token = authHeader.split(" ")[1]
    const publicKey = process.env.PUBLIC_KEY?.replace(/\\n/g, '\n')

    if (!publicKey) {
      console.error("PUBLIC_KEY not set")
      return new Response(null, { status: 500 })
    }

    const decoded = verify(token, publicKey, { algorithms: ["RS256"] })

    if (!decoded || typeof decoded !== "object" || decoded["id"] !== 1 || decoded["id"] !== 1) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 })
    }

    const result = await query<Invite>(
      `UPDATE invites
       SET accept = true
       WHERE username = $1
       RETURNING username, accept`,
      [username]
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    return NextResponse.json({ invite: result[0] })
  } catch (err) {
    console.error("Admin invites error:", err)
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401 }
    )
  }
}
