import JSZip from 'jszip';
import { NextResponse } from 'next/server';

type DeployRequestBody = {
    code?: string;
    templateRepo?: string;
    config?: Record<string, string | string[]>;
};

type GitHubRepo = {
    owner: { login: string };
    name: string;
    full_name: string;
    default_branch: string;
    html_url: string;
};

type GitHubUser = {
    login: string;
};

type GitHubRef = {
    object: {
        sha: string;
    };
};

type GitHubCommit = {
    sha: string;
    tree: {
        sha: string;
    };
};

type GitTreeItem = {
    path: string;
    mode: '100644' | '040000';
    type: 'blob' | 'tree';
    sha: string;
};

type GitTreeResponse = {
    tree: GitTreeItem[];
    truncated: boolean;
};

type GitHubPagesResponse = {
    html_url?: string;
    cname?: string | null;
    source?: {
        branch: string;
        path: string;
    };
};

type TemplateFile = {
    path: string;
    contentBase64: string;
    textContent?: string;
};

const TEXT_EXTENSIONS = new Set([
    '.txt',
    '.md',
    '.html',
    '.css',
    '.js',
    '.mjs',
    '.cjs',
    '.ts',
    '.tsx',
    '.json',
    '.yml',
    '.yaml',
    '.xml',
    '.svg',
    '.gitignore',
    '.env',
]);

const ROOT_ASSET_DIRS = ['_next', 'images', 'fonts', 'icons', 'static'] as const;
const ROOT_SINGLE_OR_PREFIX = ['config.json', 'skills.json', 'api/'] as const;

function parseRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    if (!match) return null;

    const owner = match[1];
    const repo = match[2].replace(/\.git$/i, '');
    return { owner, repo };
}

function getExtension(path: string): string {
    const lastSlash = path.lastIndexOf('/');
    const name = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex === -1) return '';
    return name.slice(dotIndex).toLowerCase();
}

function isTextFile(path: string): boolean {
    const lower = path.toLowerCase();
    if (lower.endsWith('.gitignore')) return true;
    return TEXT_EXTENSIONS.has(getExtension(lower));
}

function looksLikeTextBuffer(content: Uint8Array): boolean {
    const sampleSize = Math.min(content.length, 4096);
    if (sampleSize === 0) return true;

    let controlChars = 0;
    for (let i = 0; i < sampleSize; i += 1) {
        const byte = content[i];
        const allowedControl = byte === 9 || byte === 10 || byte === 13;
        if (byte < 32 && !allowedControl) {
            controlChars += 1;
        }
    }

    return controlChars / sampleSize < 0.02;
}

function normalizeCustomDomain(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return null;

    const noProto = trimmed.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const valid = /^[a-z0-9.-]+$/.test(noProto) && noProto.includes('.') && !noProto.includes('..');
    if (!valid) return null;

    return noProto;
}

function base64Encode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64');
}

async function githubRequest<T>(
    token: string,
    path: string,
    init?: RequestInit,
    extraHeaders?: Record<string, string>
): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
        ...init,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            ...(init?.headers ?? {}),
            ...(extraHeaders ?? {}),
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API ${path} failed (${response.status}): ${text}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return (await response.json()) as T;
}

async function githubRequestMaybe<T>(
    token: string,
    path: string,
    init?: RequestInit,
    extraHeaders?: Record<string, string>
): Promise<{ status: number; data: T | null }> {
    const response = await fetch(`https://api.github.com${path}`, {
        ...init,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            ...(init?.headers ?? {}),
            ...(extraHeaders ?? {}),
        },
        cache: 'no-store',
    });

    if (response.status === 404) {
        return { status: 404, data: null };
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API ${path} failed (${response.status}): ${text}`);
    }

    if (response.status === 204) {
        return { status: 204, data: {} as T };
    }

    return { status: response.status, data: (await response.json()) as T };
}

async function exchangeCodeForToken(code: string): Promise<string> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
        }),
        cache: 'no-store',
    });

    const data = (await response.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
    };

    if (!response.ok || data.error || !data.access_token) {
        throw new Error(data.error_description || data.error || 'OAuth token exchange failed');
    }

    return data.access_token;
}

async function ensureUserRepo(token: string, username: string): Promise<GitHubRepo> {
    const existing = await githubRequestMaybe<GitHubRepo>(token, `/repos/${username}/${username}`);
    if (existing.status === 200 && existing.data) {
        return existing.data;
    }

    return await githubRequest<GitHubRepo>(token, '/user/repos', {
        method: 'POST',
        body: JSON.stringify({
            name: username,
            description: 'Portfolio deployed via Aures',
            private: false,
            auto_init: true,
        }),
    });
}

async function ensureGhPagesBranch(token: string, owner: string, repo: string): Promise<void> {
    const existing = await githubRequestMaybe<GitHubRef>(token, `/repos/${owner}/${repo}/git/ref/heads/gh-pages`);
    if (existing.status === 200) {
        return;
    }

    const repository = await githubRequest<GitHubRepo>(token, `/repos/${owner}/${repo}`);
    const defaultRef = await githubRequest<GitHubRef>(
        token,
        `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(repository.default_branch)}`
    );

    await githubRequest<GitHubRef>(token, `/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({
            ref: 'refs/heads/gh-pages',
            sha: defaultRef.object.sha,
        }),
    });
}

async function fetchTemplateFiles(templateRepoUrl: string): Promise<TemplateFile[]> {
    const parsed = parseRepoUrl(templateRepoUrl);
    if (!parsed) {
        throw new Error('Template repository URL is invalid');
    }

    const zipUrl = `https://codeload.github.com/${parsed.owner}/${parsed.repo}/zip/refs/heads/main`;
    const response = await fetch(zipUrl, { cache: 'no-store' });

    if (!response.ok) {
        throw new Error('Unable to download template repository');
    }

    const zipBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(zipBuffer);

    const files: TemplateFile[] = [];
    const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir);

    for (const absolutePath of names) {
        const firstSlash = absolutePath.indexOf('/');
        const path = firstSlash >= 0 ? absolutePath.slice(firstSlash + 1) : absolutePath;
        if (!path) continue;

        const file = zip.files[absolutePath];
        const contentBinary = await file.async('uint8array');
        const contentBase64 = Buffer.from(contentBinary).toString('base64');

        if (isTextFile(path) || looksLikeTextBuffer(contentBinary)) {
            files.push({
                path,
                contentBase64,
                textContent: Buffer.from(contentBinary).toString('utf8'),
            });
        } else {
            files.push({ path, contentBase64 });
        }
    }

    return files;
}

function upsertTextFile(files: TemplateFile[], path: string, content: string): void {
    const idx = files.findIndex((f) => f.path === path);
    const contentBase64 = base64Encode(content);
    const file: TemplateFile = { path, contentBase64, textContent: content };

    if (idx === -1) {
        files.push(file);
    } else {
        files[idx] = file;
    }
}

function removeFile(files: TemplateFile[], path: string): void {
    const idx = files.findIndex((f) => f.path === path);
    if (idx !== -1) {
        files.splice(idx, 1);
    }
}

function injectBasePathToNextConfig(input: string, repoName: string): string {
    let output = input;
    const escapedRepo = `/${repoName}`;

    if (!/\bbasePath\s*:/.test(output)) {
        output = output.replace(/export\s+default\s*\{/, `export default {\n  basePath: '${escapedRepo}',`);
    }

    if (!/\bassetPrefix\s*:/.test(output)) {
        output = output.replace(/export\s+default\s*\{/, `export default {\n  assetPrefix: '${escapedRepo}',`);
    }

    return output;
}

function rewriteAbsoluteRootUrls(input: string, repoName: string): string {
    const basePath = `/${repoName}`;
    const assetGroup = ROOT_ASSET_DIRS.join('|');
    const rootGroup = ROOT_SINGLE_OR_PREFIX
        .map((part) => part.replace('.', '\\.'))
        .join('|');
    const delimiterClass = "(^|[\\s\"'`=(:>,])";

    let output = input;

    const rootAssetRegex = new RegExp(`${delimiterClass}/(${assetGroup})/`, 'g');
    output = output.replace(rootAssetRegex, `$1${basePath}/$2/`);

    const rootSingleRegex = new RegExp(`${delimiterClass}/(${rootGroup})`, 'g');
    output = output.replace(rootSingleRegex, `$1${basePath}/$2`);

    const escapedAssetRegex = new RegExp(`\\\\/(${assetGroup})/`, 'g');
    output = output.replace(escapedAssetRegex, `\\/${repoName}/$1/`);

    const escapedSingleRegex = new RegExp(`\\\\/(${rootGroup})`, 'g');
    output = output.replace(escapedSingleRegex, `\\/${repoName}/$1`);

    return output;
}

function applyTemplateTransforms(
    files: TemplateFile[],
    repoName: string,
    username: string,
    configInput: Record<string, string | string[]>
): { siteDomain: string; customDomain: string | null; deployedUrl: string } {
    const customDomain = normalizeCustomDomain(configInput.customDomain);
    const siteDomain = customDomain ?? `${username}.github.io/${repoName}`;
    const deployedUrl = customDomain ? `https://${customDomain}` : `https://${username}.github.io/${repoName}`;

    const configPayload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(configInput)) {
        if (key === 'customDomain') continue;
        configPayload[key] = value;
    }

    configPayload.username = username;
    configPayload.domain = siteDomain;
    configPayload.url = deployedUrl;

    const configFile = files.find((f) => f.path === 'config.json');
    if (configFile?.textContent) {
        try {
            const currentConfig = JSON.parse(configFile.textContent) as Record<string, unknown>;
            const merged = {
                ...currentConfig,
                ...configPayload,
            };
            upsertTextFile(files, 'config.json', `${JSON.stringify(merged, null, 2)}\n`);
        } catch {
            upsertTextFile(files, 'config.json', `${JSON.stringify(configPayload, null, 2)}\n`);
        }
    } else {
        upsertTextFile(files, 'config.json', `${JSON.stringify(configPayload, null, 2)}\n`);
    }

    if (customDomain) {
        upsertTextFile(files, 'CNAME', `${customDomain}\n`);
    } else {
        removeFile(files, 'CNAME');

        files.forEach((file, index) => {
            if (!file.textContent) return;

            let updated = rewriteAbsoluteRootUrls(file.textContent, repoName);

            if (/^next\.config\.(js|mjs|cjs|ts)$/i.test(file.path)) {
                updated = injectBasePathToNextConfig(updated, repoName);
            }

            if (updated !== file.textContent) {
                files[index] = {
                    path: file.path,
                    textContent: updated,
                    contentBase64: base64Encode(updated),
                };
            }
        });
    }

    return { siteDomain, customDomain, deployedUrl };
}

async function commitTreeToBranch(
    token: string,
    owner: string,
    repo: string,
    files: TemplateFile[]
): Promise<string> {
    type TreeEntry = {
        path: string;
        mode: '100644';
        type: 'blob';
        sha: string | null;
    };

    const branchRef = await githubRequest<GitHubRef>(token, `/repos/${owner}/${repo}/git/ref/heads/gh-pages`);
    const headCommit = await githubRequest<GitHubCommit>(token, `/repos/${owner}/${repo}/git/commits/${branchRef.object.sha}`);
    const existingTree = await githubRequest<GitTreeResponse>(
        token,
        `/repos/${owner}/${repo}/git/trees/${headCommit.tree.sha}?recursive=1`
    );

    if (existingTree.truncated) {
        throw new Error('Existing gh-pages tree is too large to safely update automatically');
    }

    const desiredPaths = new Set(files.map((f) => f.path));

    const treeEntries: TreeEntry[] = [];

    for (const file of files) {
        const blob = await githubRequest<{ sha: string }>(token, `/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            body: JSON.stringify({
                content: file.contentBase64,
                encoding: 'base64',
            }),
        });

        treeEntries.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
        });
    }

    for (const existing of existingTree.tree) {
        if (existing.type !== 'blob') continue;
        if (!desiredPaths.has(existing.path)) {
            treeEntries.push({
                path: existing.path,
                mode: '100644',
                type: 'blob',
                sha: null,
            });
        }
    }

    const newTree = await githubRequest<{ sha: string }>(token, `/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({
            base_tree: headCommit.tree.sha,
            tree: treeEntries,
        }),
    });

    const commit = await githubRequest<{ sha: string }>(token, `/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        body: JSON.stringify({
            message: 'Update portfolio files',
            tree: newTree.sha,
            parents: [branchRef.object.sha],
        }),
    });

    await githubRequest(token, `/repos/${owner}/${repo}/git/refs/heads/gh-pages`, {
        method: 'PATCH',
        body: JSON.stringify({
            sha: commit.sha,
            force: false,
        }),
    });

    return commit.sha;
}

async function ensurePagesEnabled(
    token: string,
    owner: string,
    repo: string,
    customDomain: string | null
): Promise<string> {
    const existing = await githubRequestMaybe<GitHubPagesResponse>(token, `/repos/${owner}/${repo}/pages`);

    if (existing.status === 404) {
        const created = await githubRequest<GitHubPagesResponse>(token, `/repos/${owner}/${repo}/pages`, {
            method: 'POST',
            body: JSON.stringify({
                source: {
                    branch: 'gh-pages',
                    path: '/',
                },
            }),
        });

        if (customDomain) {
            await githubRequest<GitHubPagesResponse>(token, `/repos/${owner}/${repo}/pages`, {
                method: 'PUT',
                body: JSON.stringify({
                    source: {
                        branch: 'gh-pages',
                        path: '/',
                    },
                    cname: customDomain,
                }),
            });
        }

        return created.html_url ?? `https://${owner}.github.io/${repo}`;
    }

    const pages = existing.data;
    const sourceBranch = pages?.source?.branch;

    if (sourceBranch !== 'gh-pages' || (customDomain && pages?.cname !== customDomain)) {
        const updated = await githubRequest<GitHubPagesResponse>(token, `/repos/${owner}/${repo}/pages`, {
            method: 'PUT',
            body: JSON.stringify({
                source: {
                    branch: 'gh-pages',
                    path: '/',
                },
                ...(customDomain ? { cname: customDomain } : {}),
            }),
        });

        return updated.html_url ?? `https://${owner}.github.io/${repo}`;
    }

    return pages?.html_url ?? `https://${owner}.github.io/${repo}`;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as DeployRequestBody;
        const { code, templateRepo, config } = body;

        if (!code) {
            return NextResponse.json({ error: 'Missing GitHub code' }, { status: 400 });
        }

        if (!templateRepo) {
            return NextResponse.json({ error: 'Missing template repository' }, { status: 400 });
        }

        if (!config || typeof config !== 'object') {
            return NextResponse.json({ error: 'Missing deploy config' }, { status: 400 });
        }

        const accessToken = await exchangeCodeForToken(code);
        const githubUser = await githubRequest<GitHubUser>(accessToken, '/user');

        const targetRepo = await ensureUserRepo(accessToken, githubUser.login);
        await ensureGhPagesBranch(accessToken, targetRepo.owner.login, targetRepo.name);

        const templateFiles = await fetchTemplateFiles(templateRepo);
        const transformResult = applyTemplateTransforms(
            templateFiles,
            targetRepo.name,
            githubUser.login,
            config
        );

        const commitSha = await commitTreeToBranch(
            accessToken,
            targetRepo.owner.login,
            targetRepo.name,
            templateFiles
        );

        const pagesUrl = await ensurePagesEnabled(
            accessToken,
            targetRepo.owner.login,
            targetRepo.name,
            transformResult.customDomain
        );

        return NextResponse.json({
            repo: targetRepo.full_name,
            repoUrl: targetRepo.html_url,
            branch: 'gh-pages',
            commitSha,
            pagesUrl,
            deployedUrl: transformResult.deployedUrl,
            domain: transformResult.siteDomain,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to deploy template';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
