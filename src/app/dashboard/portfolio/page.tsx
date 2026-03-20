'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Divider } from '@/components/Divider';
import { TemplateCard } from '@/components/TemplateCard';
import { DeployDialog } from '@/components/DeployDialog';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { Template } from '@/lib/types';

const TEMPLATES: Template[] = [
    {
        id: 'default-resume',
        name: 'Modern Resume',
        description: 'Clean developer resume template built with Next',
        image: 'https://raw.githubusercontent.com/auresorg/defaultresume/refs/heads/original/public/preview.png',
        repo: 'https://github.com/auresorg/defaultresume',
    },
    {
        id: 'default-modern',
        name: 'Default Modern',
        description: 'Modern developer portfolio template built with Next',
        image: 'https://raw.githubusercontent.com/auresorg/defaultmodern/refs/heads/original/public/preview.png',
        repo: 'https://github.com/auresorg/defaultmodern',
    }
];

export default function TemplateMarketplace() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isClient, setIsClient] = useState(false);
    const [showDeployDialog, setShowDeployDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [deployError, setDeployError] = useState<string | null>(null);
    const [deploying, setDeploying] = useState(false);
    const [deploySuccessUrl, setDeploySuccessUrl] = useState<string | null>(null);

    const oauthCode = searchParams.get('code');
    const oauthState = searchParams.get('state');
    const oauthError = searchParams.get('error');
    const oauthErrorDescription = searchParams.get('error_description');

    const pendingDeployKey = 'portfolioDeployPending';

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        if (!oauthCode && !oauthError) return;

        if (oauthError) {
            const message = oauthErrorDescription
                ? decodeURIComponent(oauthErrorDescription)
                : 'GitHub authorization was denied.';
            setDeployError(message);
            router.replace('/dashboard/portfolio');
            return;
        }

        if (!oauthCode || !oauthState) {
            setDeployError('Missing OAuth callback parameters from GitHub.');
            router.replace('/dashboard/portfolio');
            return;
        }

        const pendingRaw = localStorage.getItem(pendingDeployKey);
        if (!pendingRaw) {
            setDeployError('Missing pending deployment details. Start deployment again.');
            router.replace('/dashboard/portfolio');
            return;
        }

        let pending: {
            state: string;
            templateRepo: string;
            config: Record<string, string | string[]>;
        };

        try {
            pending = JSON.parse(pendingRaw);
        } catch {
            localStorage.removeItem(pendingDeployKey);
            setDeployError('Invalid deployment session data. Start deployment again.');
            router.replace('/dashboard/portfolio');
            return;
        }

        if (pending.state !== oauthState) {
            localStorage.removeItem(pendingDeployKey);
            setDeployError('OAuth state mismatch. Start deployment again.');
            router.replace('/dashboard/portfolio');
            return;
        }

        const runDeploy = async () => {
            setDeploying(true);
            setDeployError(null);

            try {
                const response = await fetch('/api/github/deploy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: oauthCode,
                        templateRepo: pending.templateRepo,
                        config: pending.config,
                    }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Deployment failed');
                }

                setDeploySuccessUrl(data.deployedUrl || data.pagesUrl || null);
                localStorage.removeItem(pendingDeployKey);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Deployment failed unexpectedly';
                setDeployError(message);
            } finally {
                setDeploying(false);
                router.replace('/dashboard/portfolio');
            }
        };

        runDeploy();
    }, [
        isClient,
        oauthCode,
        oauthState,
        oauthError,
        oauthErrorDescription,
        pendingDeployKey,
        router,
    ]);

    const createNonce = () => {
        const values = new Uint32Array(4);
        window.crypto.getRandomValues(values);
        return Array.from(values)
            .map((value) => value.toString(16).padStart(8, '0'))
            .join('');
    };

    const handleDeployClick = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        setSelectedTemplate(template);
        setDeployError(null);
        setDeploySuccessUrl(null);
        setShowDeployDialog(true);
    };

    const handleDialogDeploy = (data: Record<string, string | string[]>) => {
        if (!selectedTemplate) return;

        const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
        if (!githubClientId) {
            setDeployError('Missing NEXT_PUBLIC_GITHUB_CLIENT_ID in frontend environment.');
            return;
        }

        const state = createNonce();
        localStorage.setItem(
            pendingDeployKey,
            JSON.stringify({
                state,
                templateRepo: selectedTemplate.repo,
                config: data,
            })
        );

        const redirectUri = `${window.location.origin}/dashboard/portfolio`;
        const authUrl = new URL('https://github.com/login/oauth/authorize');
        authUrl.searchParams.set('client_id', githubClientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', 'repo');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('allow_signup', 'true');

        setShowDeployDialog(false);
        window.location.href = authUrl.toString();
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
                    {deploying && (
                        <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            Deploying portfolio to GitHub Pages. This can take a minute.
                        </p>
                    )}

                    {deployError && (
                        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                            {deployError}
                        </p>
                    )}

                    {deploySuccessUrl && (
                        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                            Deployment completed. Your site URL: {deploySuccessUrl}
                        </p>
                    )}

                    {!isClient ? (
                        <LoadingSkeleton />
                    ) : (
                        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                            {TEMPLATES.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    isLoading={false}
                                    onDeploy={handleDeployClick}
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
        </>
    );
}