// lib/github/repository.ts
import { GithubAPI } from './api';
import type { GithubRepo } from '@/lib/types';

export class RepositoryManager {
    private api: GithubAPI;

    constructor(token: string) {
        this.api = new GithubAPI(token);
    }

    async checkUserSiteRepo(username: string, repoName: string): Promise<GithubRepo | null> {
        return this.api.getUserRepo(username, repoName);
    }

    async createUserRepo(repoName: string): Promise<void> {
        await this.api.createRepo(repoName);
    }

    async checkGhPagesBranch(username: string, repoName: string): Promise<boolean> {
        return this.api.checkBranch(username, repoName, "gh-pages");
    }

    async getDefaultBranchSha(username: string, repoName: string): Promise<string> {
        return this.api.getDefaultBranchSha(username, repoName);
    }

    async createGhPagesBranch(username: string, repoName: string, sha: string): Promise<void> {
        await this.api.createBranch(username, repoName, "gh-pages", sha);
    }
}