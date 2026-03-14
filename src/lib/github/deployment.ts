// lib/github/deployment.ts
import JSZip from "jszip";
import { GithubAPI } from './api';
import type { DeploymentConfig, GithubTreeItem } from '@/lib/types';

export class DeploymentManager {
    private api: GithubAPI;
    private username: string;
    private repoName: string;

    constructor(token: string, username: string, repoName: string) {
        this.api = new GithubAPI(token);
        this.username = username;
        this.repoName = repoName;
    }

    async downloadTemplate(repoUrl: string): Promise<Blob> {
        const response = await fetch("/api/github/template", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo: repoUrl }),
        });

        if (!response.ok) {
            throw new Error("Template download failed");
        }

        return response.blob();
    }

    private async extractZip(buffer: ArrayBuffer, hasCustomDomain: boolean): Promise<GithubTreeItem[]> {
        const zip = await JSZip.loadAsync(buffer);
        const files: GithubTreeItem[] = [];

        for (const [path, file] of Object.entries(zip.files)) {
            if (file.dir) continue;

            const content = await file.async("base64");
            const cleanPath = path.split("/").slice(1).join("/");

            if (!cleanPath) continue;

            let fileContent = atob(content);

            // Replace this entire section in extractZip
            if (!hasCustomDomain) {
                const basePath = `/${this.repoName}`;

                // Replace EVERYTHING - no file type filtering
                fileContent = fileContent
                    // HTML attributes
                    .replace(/(href|src|action|content)=["']\/(_next|images|fonts|icons|static)\//g, `$1="${basePath}/$2/`)
                    // CSS urls
                    .replace(/url\(['"]?\/(_next|images|fonts|icons|static)\//g, `url('${basePath}/$1/`)
                    // JSON strings
                    .replace(/"\\?\/(_next|images|fonts|icons|static)\\/g, `"${basePath}\\/$1\\/`)
                    // JavaScript strings (single quotes)
                    .replace(/'\\?\/(_next|images|fonts|icons|static)\\/g, `'${basePath}\\/$1\\/`)
                    // JavaScript template literals
                    .replace(/`\\?\/(_next|images|fonts|icons|static)\\/g, `\`${basePath}\\/$1\\/`)
                    // Raw paths in script content
                    .replace(/([^a-zA-Z0-9])\/(_next|images|fonts|icons|static)\//g, `$1${basePath}/$2/`)
                    // Special handling for config files (e.g. next.config.js)
                    .replace(/fetch\(["']\/(config\.json|api\/)/g, `fetch("${basePath}/$1`)
                    // Also handle dynamic imports in JavaScript files
                    .replace(/["']\/(config\.json|api\/)/g, `"${basePath}/$1`)
                    .replace(/fetch\(["']\/(skills\.json)/g, `fetch("${basePath}/$1`);
            }

            files.push({
                path: cleanPath,
                mode: "100644",
                type: "blob",
                content: fileContent,
            });
        }

        return files;
    }

    private createConfigFile(config: Record<string, unknown>, hasCustomDomain: boolean): GithubTreeItem {
        // Add username and path info to the config
        const fullConfig = {
            ...config,  // All dynamic fields from dialog
            username: this.username,
            basePath: hasCustomDomain ? '' : `/${this.repoName}`,
            assetPrefix: hasCustomDomain ? '' : `/${this.repoName}`,
        };

        return {
            path: "config.json",
            mode: "100644",
            type: "blob",
            content: JSON.stringify(fullConfig, null, 2),
        };
    }

    // REMOVED: createCNAMEFile method - we no longer create CNAME files
    // We only read them from the existing repo

    async deploy(config: DeploymentConfig, templateRepo: string): Promise<void> {
        // Check if repository already has a custom domain (CNAME file)
        // First check in gh-pages branch, then in main branch
        let customDomain = await this.api.getCNAMEFromBranch(this.username, this.repoName, "gh-pages");

        if (!customDomain) {
            // If not in gh-pages, check in main branch
            customDomain = await this.api.getCNAMEFromBranch(this.username, this.repoName, "main");
        }

        if (!customDomain) {
            // Check in master branch (older repos)
            customDomain = await this.api.getCNAMEFromBranch(this.username, this.repoName, "master");
        }

        const hasCustomDomain = !!customDomain;

        console.log(`Custom domain detected: ${customDomain || 'none'}`);
        console.log(`Using basePath: ${hasCustomDomain ? '' : `/${this.repoName}`}`);

        // Download and extract template with basePath injection
        const zipBlob = await this.downloadTemplate(templateRepo);
        const zipBuffer = await zipBlob.arrayBuffer();
        const files = await this.extractZip(zipBuffer, hasCustomDomain);

        // Add config file with basePath info
        // Add config file with basePath info
        files.push(this.createConfigFile(config, hasCustomDomain));

        // CRITICAL: Preserve existing CNAME file if it exists
        if (customDomain) {
            console.log(`Preserving custom domain: ${customDomain}`);
            files.push({
                path: "CNAME",
                mode: "100644",
                type: "blob",
                content: customDomain, // Use the detected domain, don't re-encode
            });
        }

        // Add .nojekyll file
        files.push({
            path: ".nojekyll",
            mode: "100644",
            type: "blob",
            content: "",
        });

        // Create tree
        const tree = await this.api.createTree(this.username, this.repoName, files);

        // Get parent commit SHA
        const parentSha = await this.api.getDefaultBranchSha(this.username, this.repoName);

        // Create commit
        const commit = await this.api.createCommit(
            this.username,
            this.repoName,
            hasCustomDomain
                ? `deploy: update site (custom domain: ${customDomain})`
                : "deploy: update site",
            tree.sha,
            parentSha
        );

        // Update branch
        await this.api.updateBranch(this.username, this.repoName, "gh-pages", commit.sha);

        console.log(`Deployment complete. Site will be available at: ${hasCustomDomain ? customDomain : `https://${this.username}.github.io/${this.repoName}`}`);
    }
}