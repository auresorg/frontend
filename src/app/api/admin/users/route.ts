import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verify } from "jsonwebtoken"

type User = {
  username: string
  plan: 'free' | 'pro'
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

    if (!decoded || typeof decoded !== "object" || decoded["id"] !== 1) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const users = await query<User>(
      `SELECT username, plan FROM users ORDER BY username ASC`
    )

    return NextResponse.json({ users })
  } catch (err) {
    console.error("Admin users error:", err)
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

    if (!decoded || typeof decoded !== "object" || decoded["id"] !== 1) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const { username, plan } = await request.json()

    if (!username || !['free', 'pro'].includes(plan)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const result = await query<User>(
      `UPDATE users
       SET plan = $2
       WHERE username = $1
       RETURNING username, plan`,
      [username, plan]
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: result[0] })
  } catch (err) {
    console.error("Admin users error:", err)
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401 }
    )
  }
}
