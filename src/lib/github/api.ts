import { GithubUser, GithubRepo, GithubBranch, GithubTreeItem, GithubTree, GithubCommit } from "../types";

// lib/github/api.ts
const GITHUB_API_BASE = "https://api.github.com";

export class GithubAPI {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = endpoint.startsWith("http")
            ? endpoint
            : `${GITHUB_API_BASE}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.token}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `GitHub API error: ${response.status}`);
        }

        return data as T;
    }

    async getUser(): Promise<GithubUser> {
        return this.request<GithubUser>("/user");
    }

    async getUserRepo(username: string, repoName: string): Promise<GithubRepo | null> {
        try {
            return await this.request<GithubRepo>(`/repos/${username}/${repoName}`);
        } catch (error) {
            if (error instanceof Error && error.message.includes("404")) {
                return null;
            }
            throw error;
        }
    }

    async createRepo(repoName: string): Promise<GithubRepo> {
        return this.request<GithubRepo>("/user/repos", {
            method: "POST",
            body: JSON.stringify({
                name: repoName,
                private: false,
                auto_init: false,
            }),
        });
    }

    async checkBranch(username: string, repoName: string, branch: string): Promise<boolean> {
        try {
            await this.request<GithubBranch>(
                `/repos/${username}/${repoName}/branches/${branch}`
            );
            return true;
        } catch (error) {
            if (error instanceof Error && error.message.includes("404")) {
                return false;
            }
            throw error;
        }
    }

    async getDefaultBranchSha(username: string, repoName: string): Promise<string> {
        const repo = await this.request<GithubRepo>(`/repos/${username}/${repoName}`);

        const branch = await this.request<{ object: { sha: string } }>(
            `/repos/${username}/${repoName}/git/ref/heads/${repo.default_branch}`
        );

        return branch.object.sha;
    }

    async createBranch(username: string, repoName: string, branch: string, sha: string): Promise<void> {
        await this.request(`/repos/${username}/${repoName}/git/refs`, {
            method: "POST",
            body: JSON.stringify({
                ref: `refs/heads/${branch}`,
                sha,
            }),
        });
    }

    async createTree(username: string, repoName: string, tree: GithubTreeItem[]): Promise<GithubTree> {
        return this.request<GithubTree>(`/repos/${username}/${repoName}/git/trees`, {
            method: "POST",
            body: JSON.stringify({ tree }),
        });
    }

    async createCommit(
        username: string,
        repoName: string,
        message: string,
        treeSha: string,
        parentSha: string
    ): Promise<GithubCommit> {
        return this.request<GithubCommit>(`/repos/${username}/${repoName}/git/commits`, {
            method: "POST",
            body: JSON.stringify({
                message,
                tree: treeSha,
                parents: [parentSha],
            }),
        });
    }

    async updateBranch(
        username: string,
        repoName: string,
        branch: string,
        commitSha: string
    ): Promise<void> {
        await this.request(`/repos/${username}/${repoName}/git/refs/heads/${branch}`, {
            method: "PATCH",
            body: JSON.stringify({
                sha: commitSha,
                force: true,
            }),
        });
    }

    // NEW: Check if repository has a CNAME file (custom domain)
    async getCNAMEContent(username: string, repoName: string): Promise<string | null> {
        try {
            // Try to get the CNAME file from the repository
            const response = await this.request<{ content: string } | string>(
                `/repos/${username}/${repoName}/contents/CNAME`,
                {
                    headers: {
                        Accept: "application/vnd.github.raw",
                    },
                }
            );

            // The content might be base64 encoded if we don't use the raw accept header
            if (typeof response === 'string') {
                return response.trim();
            } else if (response && typeof response === 'object' && 'content' in response) {
                // If it's base64 encoded
                return atob(response.content).trim();
            }

            return null;
        } catch (error) {
            // If file doesn't exist (404), return null
            if (error instanceof Error && error.message.includes("404")) {
                return null;
            }
            // Log other errors but don't fail deployment
            console.warn("Error checking CNAME:", error);
            return null;
        }
    }

    // NEW: Check if gh-pages branch has a CNAME file
    async getCNAMEFromBranch(username: string, repoName: string, branch: string = "gh-pages"): Promise<string | null> {
        try {
            const response = await fetch(
                `https://raw.githubusercontent.com/${username}/${repoName}/${branch}/CNAME`,
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    },
                }
            );

            if (response.ok) {
                const content = await response.text();
                return content.trim();
            }

            return null;
        } catch (error) {
            console.warn(`Error checking CNAME in ${branch} branch:`, error);
            return null;
        }
    }
}