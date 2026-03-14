// lib/hooks/useTemplateDeployment.ts
import { useState, useCallback } from 'react';
import { RepositoryManager } from '@/lib/github/repository';
import { DeploymentManager } from '@/lib/github/deployment';
import type { DeploymentPlan, DeploymentConfig } from '@/lib/types';

interface UseTemplateDeploymentReturn {
    isLoading: boolean;
    deployTemplate: (
        token: string,
        username: string,
        repoName: string,
        templateRepo: string,
        config: DeploymentConfig
    ) => Promise<void>;
    prepareDeployment: (
        token: string,
        username: string,
        repoName: string
    ) => Promise<DeploymentPlan>;
}

export function useTemplateDeployment(): UseTemplateDeploymentReturn {
    const [isLoading, setIsLoading] = useState(false);

    const prepareDeployment = useCallback(async (
        token: string,
        username: string,
        repoName: string
    ): Promise<DeploymentPlan> => {
        const manager = new RepositoryManager(token);
        
        // Check if repo exists
        const repo = await manager.checkUserSiteRepo(username, repoName);
        
        if (!repo) {
            return { action: "create_repo", username };
        }
        
        // Check if gh-pages branch exists
        const hasGhPages = await manager.checkGhPagesBranch(username, repoName);
        
        if (!hasGhPages) {
            return { action: "create_branch", username };
        }
        
        // Both repo and gh-pages exist - require confirmation
        return { action: "overwrite_branch", username };
    }, []);

    const deployTemplate = useCallback(async (
        token: string,
        username: string,
        repoName: string,
        templateRepo: string,
        config: DeploymentConfig
    ): Promise<void> => {
        setIsLoading(true);
        
        try {
            const repoManager = new RepositoryManager(token);
            
            // Check if repo exists, create if needed
            const repo = await repoManager.checkUserSiteRepo(username, repoName);
            if (!repo) {
                await repoManager.createUserRepo(repoName);
            }
            
            // Check if gh-pages branch exists, create if needed
            const hasGhPages = await repoManager.checkGhPagesBranch(username, repoName);
            if (!hasGhPages) {
                const sha = await repoManager.getDefaultBranchSha(username, repoName);
                await repoManager.createGhPagesBranch(username, repoName, sha);
            }
            
            // Deploy template
            const deployment = new DeploymentManager(token, username, repoName);
            await deployment.deploy(config, templateRepo);

        } catch (error) {
            console.error("Deployment error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        deployTemplate,
        prepareDeployment,
    };
}