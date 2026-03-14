// lib/github/auth.ts
export const GITHUB_CLIENT_ID = 'Ov23liPBB7YWMGaHMOlJ';

export interface OAuthState {
    templateId: string;
    repo: string;
}

export function createOAuthUrl(state: OAuthState): string {
    const encodedState = btoa(JSON.stringify(state));

    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        scope: "repo",
        state: encodedState,
        redirect_uri: window.location.href.split('?')[0], // Remove any existing query params
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
    console.log("Exchanging code for token...");

    const response = await fetch("/api/github/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Token exchange failed: ${response.status}`);
    }

    if (!data.access_token) {
        throw new Error("No access token in response");
    }

    console.log("Token exchange successful");
    return data.access_token;
}

export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem("gh_token");
}

export function storeToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem("gh_token", token);
}

export function clearStoredToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem("gh_token");
}