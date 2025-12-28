import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

type Mode = "ip" | "user" | "global";

interface Opts {
    mode?: Mode;
    identifier?: string;
    route?: string;
    limit?: number;
    windowSec?: number;
    html?: boolean;
}

export async function rateLimit(
    req: Request,
    {
        mode = "ip",
        identifier,
        route,
        limit = 10,
        windowSec = 60,
        html = false,
    }: Opts = {}
) {
    let key = "rl";

    switch (mode) {
        case "user":
            if (!identifier) throw new Error("identifier required for user mode");
            key += `:user:${identifier}`;
            break;
        case "global":
            key += `:global`;
            break;
        default:
            const ip = req.headers.get("x-forwarded-for") ?? "unknown";
            key += `:ip:${ip}`;
    }

    if (route) key += `:${route}`;

    const count = await kv.incr(key);

    if (count === 1) {
        await kv.expire(key, windowSec);
    }

    if (count > limit) {
        const ttl = await kv.ttl(key); // Returns seconds
        const retryAfter = ttl > 0 ? ttl : windowSec;

        if (html) {
            const htmlPage = `
            <html>
            <head>
            <title>Rate Limited</title>
            <style>
            body {
                margin: 0;
                padding: 0;
                background: #f8fbff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
            }
            .card {
                background: white;
                padding: 32px;
                border-radius: 16px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.08);
                text-align: center;
                max-width: 340px;
            }
            h1 {
                margin: 0 0 12px 0;
                color: #2563eb; /* Tremor primary blue */
                font-size: 24px;
                font-weight: 600;
            }
            p {
                margin: 0;
                color: #4b5563;
                font-size: 16px;
            }
            </style>
            </head>
            <body>
            <div class="card">
                <h1>Take a chill pill, buddy!</h1>
                <p>Try again in <strong id="retry">${retryAfter}</strong> seconds.</p>
            </div>
            <script>
                let seconds = ${retryAfter};
                const el = document.getElementById('retry');
                const interval = setInterval(() => {
                seconds--;
                if (seconds <= 0) {
                    el.textContent = '0';
                    clearInterval(interval);
                    window.location.reload();
                } else {
                    el.textContent = seconds;
                }
                }, 1000);
            </script>
            </body>
            </html>
            `;

            return new NextResponse(htmlPage, {
                status: 429,
                headers: { "Content-Type": "text/html", "Retry-After": String(retryAfter) }
            });
        }

        return NextResponse.json(
            {
                error: "Too many requests",
                retry_after: retryAfter
            },
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(retryAfter)
                }
            }
        );
    }

    return null;
}