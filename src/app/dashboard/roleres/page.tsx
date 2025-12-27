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
import { getWithToken } from '@/lib/utils';

export default function ResumeDashboard() {
    const { resumes, hasLoaded, setResumes, setHasLoaded } = useResumeStore();
    const { user } = useUserStore(); // Get current user
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        async function fetchResumes() {
            if (!isClient || hasLoaded) return;

            try {
                const response = await getWithToken('/user/roleres');
                if (response && response.status === 200) {
                    setResumes(response.data);
                    setHasLoaded(true);
                }
            } catch (error) {
                console.error("Failed to fetch resumes", error);
                setHasLoaded(true);
            }
        }

        fetchResumes();
    }, [isClient, hasLoaded, setResumes, setHasLoaded]);

    // Get domain from env var
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    let domain = '';
    try {
        const urlObj = new URL(apiBaseUrl);
        domain = urlObj.hostname;
    } catch {
        domain = 'aures.vishok.me'; // fallback
    }

    const copyLink = (role: string) => {
        const url = `${domain}/resume/${user?.username}/${role}`;
        navigator.clipboard.writeText(`https://${url}`);
        toast({
            title: 'Copied',
            description: 'Link copied to clipboard',
            variant: 'success',
        });
    };

    const handleDownload = (role: string, type: 'pdf' | 'tex') => {
        console.log(`Downloading ${role}.${type}`);
        toast({
            title: 'Downloading',
            description: `Fetching ${role} resume...`,
            variant: 'success',
        });
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
                    Manage your role-specific resumes ({resumes.length} active)
                </p>
            </div>

            <Divider className="my-0!" />

            {/* Scrollable Container */}
            <div className="overflow-y-auto pr-2 mt-6 pb-10 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {!hasLoaded ? (
                    <div className="text-center py-10 text-gray-500">Loading resumes...</div>
                ) : (
                    <ul
                        role="list"
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {resumes.map((item) => {
                            const displayName = `${item.role.charAt(0).toUpperCase() + item.role.slice(1)} Developer`;
                            // Dynamic username in display URL
                            const displayUrl = `${domain}/resume/${user?.username}/${item.role}`;

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
                                                href={`https://${displayUrl}`}
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