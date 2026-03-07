'use client';

import { useEffect, useState } from 'react';
import {
    RiFileCodeLine,
    RiDownloadLine,
    RiFileCopyLine,
    RiEyeLine,
    RiStackLine,
    RiTrophyLine,
    RiAwardLine,
    RiArrowRightUpLine,
    RiBriefcaseLine,
} from '@remixicon/react';

import { Card } from '@/components/Card';
import { Divider } from '@/components/Divider';
import { Button } from '@/components/Button';
import { toast } from '@/lib/useToast';
import { useResumeStore } from '@/store/resumeStore';
import { useUserStore } from '@/store/userStore'; // Import UserStore
import { getWithToken, nextBase } from '@/lib/utils';
import { usePresetDialog } from '@/lib/dialogs';
import { ResumeItem } from '@/lib/types';
import { isAxiosError } from 'axios';

export default function ResumeDashboard() {
    const { resumes, hasLoaded, setResumes, setHasLoaded } = useResumeStore();
    const { user } = useUserStore(); // Get current user
    const [isClient, setIsClient] = useState(false);
    const presetDialog = usePresetDialog();

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        async function fetchResumes() {
            if (!isClient || hasLoaded) return;

            try {
                const response = await getWithToken('/user/roleres');
                if (response && response.status === 200) {
                    const sorted = response.data;
                    sorted.sort((a: ResumeItem, b: ResumeItem) => a.role.localeCompare(b.role));
                    setResumes(sorted);
                    setHasLoaded(true);
                }
            } catch (error) {
                if (isAxiosError(error) && error.response?.status === 401) {
                    presetDialog('unauthorized');
                    return;
                }
                presetDialog('unexpectedError');
                setHasLoaded(true);
            }
        }

        fetchResumes();
    }, [isClient, hasLoaded, setResumes, setHasLoaded, presetDialog]);

    const copyLink = (role: string) => {
        const url = `${nextBase}/r/${user?.username}/${role}`;
        navigator.clipboard.writeText(`${url}`);
        toast({
            title: 'Copied',
            description: 'Link copied to clipboard',
            variant: 'success',
        });
    };

    const handleDownload = async (role: string, type: 'pdf' | 'tex') => {
        toast({
            title: 'Downloading',
            description: `Fetching ${role} resume...`,
            variant: 'info',
            duration: 2000,
        });

        try {
            const username = user?.username;
            if (!username) {
                throw new Error("User not identified");
            }

            const url = `${nextBase}/r/${username}/${role}`;

            let response;

            if (type === 'pdf') {
                response = await fetch(url, { method: 'GET' });
            } else {
                const token = localStorage.getItem('token');
                
                response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({ username: username, role: role }),
                    headers: {
                        'Authorization': `Bearer ${token}`, // Pass the JWT
                        'Content-Type': 'application/json'
                    },
                });

                //if rate limited
                if (response.status === 429) {
                    toast({
                        title: 'Rate Limited',
                        description: 'Please wait before requesting the source again.',
                        variant: 'warning',
                    });
                    return;
                }
            }

            if (!response.ok) {
                presetDialog('unexpectedError');
                return;
            }

            const blob = await response.blob();
            
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${username}-${role}.${type}`;
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast({
                title: 'Success',
                description: `${type.toUpperCase()} downloaded successfully`,
                variant: 'success',
            });

        } catch {
            toast({
                title: 'Error',
                description: 'Failed to download file. Please try again.',
                variant: 'error',
            });
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div
            className="obfuscate flex flex-col"
            style={{ height: 'calc(100vh - 2rem)' }}
        >
            {/* Header */}
            <div className="shrink-0 pb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                    Role Based Resumes
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                    View your role-specific resumes ({resumes.length} roles out of 10 available roles).
                </p>
            </div>

            <Divider className="my-0!" />

            {/* Scrollable Container */}
            <div className="overflow-y-auto pr-2 mt-6 pb-10 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {!hasLoaded ? (
                    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="flex flex-col justify-between p-6! animate-pulse">
                                <div>
                                    {/* Header Skeleton */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                            <div className="mt-2 h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        </div>
                                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                    </div>

                                    {/* URL Bar Skeleton */}
                                    <div className="mt-5 h-9 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>

                                    {/* Stats Grid Skeleton */}
                                    <div className="mt-5 grid grid-cols-4 gap-2">
                                        {[1, 2, 3, 4].map((j) => (
                                            <div key={j} className="h-14 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bottom Actions Skeleton */}
                                <div className="mt-6 flex gap-3">
                                    <div className="h-9 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                    <div className="h-9 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                </div>
                            </Card>
                        ))}
                    </ul>
                ) : (
                    <ul
                        role="list"
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {resumes.map((item) => {
                            const displayName = `${item.role.charAt(0).toUpperCase() + item.role.slice(1)} Resume`;
                            // Dynamic username in display URL
                            const displayUrl = `${nextBase}/r/${user?.username}/${item.role}`;

                            const uiStats = [
                                { label: 'Projects', value: item.stats.projects, icon: RiStackLine },
                                { label: 'Certs', value: item.stats.certificates, icon: RiAwardLine },
                                { label: 'Awards', value: item.stats.awards, icon: RiTrophyLine },
                                { label: 'Exp.', value: item.stats.experience, icon: RiBriefcaseLine },
                            ];

                            return (
                                <Card
                                    key={item.role}
                                    className="group flex flex-col justify-between p-6! hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                                >
                                    {/* Top Section */}
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                                                    {displayName}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <RiEyeLine className="size-3.5" />
                                                    Compiled: {formatDate(item.last_compiled)}
                                                </p>
                                            </div>

                                            <a
                                                href={displayUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                <RiArrowRightUpLine className="size-5" />
                                            </a>
                                        </div>

                                        {/* URL Bar */}
                                        <div className="mt-5 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                                            <code className="truncate text-xs text-gray-500 font-mono">
                                                {displayUrl}
                                            </code>
                                            <button
                                                onClick={() => copyLink(item.role)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors ml-2"
                                                title="Copy URL"
                                            >
                                                <RiFileCopyLine className="size-4" />
                                            </button>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                                            {uiStats.map((stat) => (
                                                <div
                                                    key={stat.label}
                                                    className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50"
                                                >
                                                    <stat.icon className="size-4 text-gray-400 mb-1" />
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                                                        {stat.value}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                                        {stat.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bottom Actions */}
                                    <div className="mt-6 flex gap-3">
                                        <Button
                                            variant="secondary"
                                            className="w-full justify-center"
                                            onClick={() => handleDownload(item.role, 'tex')}
                                        >
                                            <RiFileCodeLine className="size-4 mr-2 text-gray-500" />
                                            Source
                                        </Button>

                                        <Button
                                            variant="primary"
                                            className="w-full justify-center"
                                            onClick={() => handleDownload(item.role, 'pdf')}
                                        >
                                            <RiDownloadLine className="size-4 mr-2" />
                                            PDF
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}