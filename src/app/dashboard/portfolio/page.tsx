// app/page.tsx (only showing the relevant changes)
'use client';

import { useEffect, useState, useRef } from 'react';
import { Divider } from '@/components/Divider';
import { toast } from '@/lib/useToast';

import { TemplateCard } from '@/components/TemplateCard';
import { DeployDialog } from '@/components/DeployDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useGithubAuth } from '@/lib/hooks/useGithubAuth';
import { useTemplateDeployment } from '@/lib/hooks/useTemplateDeployment';
import { createOAuthUrl, getStoredToken } from '@/lib/github/auth';
import { GithubAPI } from '@/lib/github/api';
import type { Template, DeploymentConfig } from '@/lib/types';

const TEMPLATES: Template[] = [
    {
        id: 'default-resume',
        name: 'Modern Resume',
        description: 'Clean developer resume template built with React',
        image: 'https://picsum.photos/1280/720',
        repo: 'https://github.com/auresorg/defaultresume',
    },
];

export default function TemplateMarketplace() {
    const [isClient, setIsClient] = useState(false);
    const [loadingDeploy, setLoadingDeploy] = useState<string | null>(null);
    const [showDeployDialog, setShowDeployDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingDeployment, setPendingDeployment] = useState<{
        accessToken: string;
        username: string;
        repoName: string;
        templateRepo: string;
        config: DeploymentConfig;
    } | null>(null);

    const oauthProcessed = useRef(false);

    const { handleOAuthCallback } = useGithubAuth();
    const { isLoading: isDeploying, deployTemplate, prepareDeployment } = useTemplateDeployment();

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Handle OAuth callback
    useEffect(() => {
        if (oauthProcessed.current) return;
        
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");

        if (!code || !state) return;

        oauthProcessed.current = true;

        const processOAuth = async () => {
            const decoded = JSON.parse(atob(state));
            const templateId = decoded.templateId;
            const repo = decoded.repo;
            
            setLoadingDeploy(templateId);
            
            try {
                const success = await handleOAuthCallback(code);
                
                if (success) {
                    const token = getStoredToken();
                    
                    if (!token) {
                        throw new Error("Failed to retrieve access token");
                    }
                    
                    console.log("Token obtained, proceeding with deployment");
                    await handleDeployment(templateId, repo, token);
                } else {
                    throw new Error("Failed to authenticate with GitHub");
                }
            } catch (error) {
                console.error("OAuth flow failed:", error);
                toast({
                    title: "Deployment failed",
                    description: error instanceof Error ? error.message : "Could not complete GitHub authentication",
                    variant: "error"
                });
            } finally {
                setLoadingDeploy(null);
                window.history.replaceState({}, document.title, window.location.pathname);
                setTimeout(() => {
                    oauthProcessed.current = false;
                }, 100);
            }
        };

        processOAuth();
    }, []);

    const handleDeployment = async (templateId: string, repo: string, accessToken: string) => {
        try {
            const api = new GithubAPI(accessToken);
            const user = await api.getUser();
            const repoName = user.login;

            const config: DeploymentConfig = {
                username: user.login,
                heroTitle: localStorage.getItem("heroTitle") || "",
                bio: localStorage.getItem("bio") || "",
                aboutTitle: localStorage.getItem("aboutTitle") || "",
                aboutText: localStorage.getItem("aboutText") 
                    ? JSON.parse(localStorage.getItem("aboutText") || "[]") 
                    : [],
                contactTitle: localStorage.getItem("contactTitle") || "",
                contactBio: localStorage.getItem("contactBio") || "",
                // REMOVED: cname field
            };

            const plan = await prepareDeployment(accessToken, user.login, repoName);
            
            if (plan.action === "overwrite_branch") {
                setPendingDeployment({
                    accessToken,
                    username: user.login,
                    repoName,
                    templateRepo: repo,
                    config
                });
                setShowConfirmation(true);
            } else {
                await executeDeployment(accessToken, user.login, repoName, repo, config);
            }
        } catch (error) {
            console.error("Deployment failed:", error);
            toast({
                title: "Deployment failed",
                description: error instanceof Error ? error.message : "Could not deploy template",
                variant: "error"
            });
        }
    };

    const executeDeployment = async (
        accessToken: string,
        username: string,
        repoName: string,
        templateRepo: string,
        config: DeploymentConfig
    ) => {
        try {
            await deployTemplate(accessToken, username, repoName, templateRepo, config);

            // Get the final status to show correct URL
            const api = new GithubAPI(accessToken);
            const customDomain = await api.getCNAMEFromBranch(username, repoName, "gh-pages");
            
            const siteUrl = customDomain 
                ? `https://${customDomain}` 
                : `https://${username}.github.io/${repoName}`;

            toast({
                title: "Deployment successful!",
                description: `Your site is live at: ${siteUrl}`,
                variant: "success"
            });
        } catch (error) {
            throw error;
        }
    };

    const handleConfirmOverwrite = async () => {
        if (!pendingDeployment) return;
        
        setShowConfirmation(false);
        
        const { accessToken, username, repoName, templateRepo, config } = pendingDeployment;
        
        try {
            await deployTemplate(accessToken, username, repoName, templateRepo, config);
            
            const api = new GithubAPI(accessToken);
            const customDomain = await api.getCNAMEFromBranch(username, repoName, "gh-pages");
            
            const siteUrl = customDomain 
                ? `https://${customDomain}` 
                : `https://${username}.github.io/${repoName}`;

            toast({
                title: "Deployment successful!",
                description: `Your site has been updated at: ${siteUrl}`,
                variant: "success"
            });
        } catch (error) {
            console.error("Overwrite failed:", error);
            toast({
                title: "Deployment failed",
                description: error instanceof Error ? error.message : "Could not overwrite deployment",
                variant: "error"
            });
        } finally {
            setPendingDeployment(null);
        }
    };

    const handleCancelOverwrite = () => {
        setShowConfirmation(false);
        setPendingDeployment(null);
        toast({
            title: "Deployment cancelled",
            description: "No changes were made to your repository",
            variant: "info"
        });
    };

    const handleDeployClick = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        setSelectedTemplate(template);
        setShowDeployDialog(true);
    };

    const handlePreview = (url: string) => {
        window.open(url, '_blank');
    };

    const handleDialogDeploy = () => {
        if (!selectedTemplate) return;

        const state = {
            templateId: selectedTemplate.id,
            repo: selectedTemplate.repo,
        };

        window.location.href = createOAuthUrl(state);
    };

    return (
        <>
            <div className="obfuscate flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
                {/* Header */}
                <div className="shrink-0 pb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">Templates</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Deploy a portfolio or resume template instantly
                        </p>
                    </div>
                </div>

                <Divider className="my-0!" />

                {/* Scrollable container */}
                <div className="overflow-y-auto pr-2 mt-6 pb-10 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {!isClient ? (
                        <LoadingSkeleton />
                    ) : (
                        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {TEMPLATES.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    isLoading={loadingDeploy === template.id || isDeploying}
                                    onDeploy={handleDeployClick}
                                    onPreview={handlePreview}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <DeployDialog
                open={showDeployDialog}
                onOpenChange={setShowDeployDialog}
                template={selectedTemplate}
                onDeploy={handleDialogDeploy}
            />

            <ConfirmationDialog
                open={showConfirmation}
                onOpenChange={setShowConfirmation}
                title="Overwrite existing deployment?"
                description="A gh-pages branch already exists in your repository. Overwriting will replace your current site. This action cannot be undone."
                confirmLabel="Overwrite"
                cancelLabel="Cancel"
                onConfirm={handleConfirmOverwrite}
                onCancel={handleCancelOverwrite}
            />
        </>
    );
}