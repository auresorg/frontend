// components/templates/TemplateCard.tsx
/* eslint-disable @next/next/no-img-element */
'use client';

import { RiRocketLine, RiLoader2Fill } from '@remixicon/react';
import { Button } from '@/components/Button';
import type { Template } from '@/lib/types';

interface TemplateCardProps {
    template: Template;
    isLoading: boolean;
    isDeployed?: boolean;
    deployedUrl?: string | null;
    onDeploy: (templateId: string) => void;
}

export function TemplateCard({ template, isLoading, isDeployed, deployedUrl, onDeploy }: TemplateCardProps) {
    return (
        <li>
            <article className={`group relative aspect-video overflow-hidden rounded-2xl bg-gray-900/5 dark:bg-gray-900/30 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDeployed ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-950' : ''}`}>
                <img
                    src={template.image}
                    alt={template.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />

                {isDeployed && (
                    <div className="absolute top-3 right-3 z-30">
                        <span className="inline-flex items-center rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
                            Deployed
                        </span>
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4 pr-40 sm:pr-44">
                    <h4 className="text-sm sm:text-base font-semibold text-white">
                        {template.name}
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-white/80 line-clamp-2">
                        {template.description}
                    </p>
                </div>

                <div className="absolute right-3 bottom-3 z-20 flex gap-2 opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-200 ease-out">
                    {isDeployed && deployedUrl && (
                        <Button
                            variant="primary"
                            className="h-9 px-3 bg-blue-500 hover:bg-blue-600 text-white backdrop-blur-md border-0 shadow"
                            onClick={() => window.open(deployedUrl, '_blank')}
                        >
                            View
                        </Button>
                    )}
                    
                    <Button
                        variant="secondary"
                        className="h-9 px-3 bg-white/90 hover:bg-white text-gray-900 backdrop-blur-md border-0 shadow"
                        onClick={() => onDeploy(template.id)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <RiLoader2Fill className="size-4 mr-1.5 animate-spin" />
                                Deploying
                            </>
                        ) : (
                            <>
                                <RiRocketLine className="size-4 mr-1.5" />
                                {isDeployed ? 'Redeploy' : 'Deploy'}
                            </>
                        )}
                    </Button>
                </div>
            </article>
        </li>
    );
}