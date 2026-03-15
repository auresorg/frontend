'use client';

import { useEffect, useState } from 'react';
import { Divider } from '@/components/Divider';
import { TemplateCard } from '@/components/TemplateCard';
import { DeployDialog } from '@/components/DeployDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { Template } from '@/lib/types';

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
    const [showDeployDialog, setShowDeployDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        setIsClient(true);
        console.log("UI Mounted: Client-side ready");
    }, []);

    const handleDeployClick = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        console.log(`Action: Clicked deploy for template: ${templateId}`);
        setSelectedTemplate(template);
        setShowDeployDialog(true);
    };

    const handlePreview = (url: string) => {
        console.log(`Action: Opening preview for: ${url}`);
        window.open(url, '_blank');
    };

    const handleDialogDeploy = () => {
        if (!selectedTemplate) return;

        console.log("Action: Confirmed deployment from Dialog", {
            templateId: selectedTemplate.id,
            repo: selectedTemplate.repo,
        });

        setShowDeployDialog(false);
        // Simulate checking for existing deployment to show confirmation UI
        setShowConfirmation(true);
    };

    const handleConfirmOverwrite = () => {
        console.log("Action: User confirmed overwrite of existing repository");
        setShowConfirmation(false);
        alert("Mock: Deployment process started (check console)");
    };

    const handleCancelOverwrite = () => {
        console.log("Action: User cancelled the overwrite process");
        setShowConfirmation(false);
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
                                    isLoading={false}
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