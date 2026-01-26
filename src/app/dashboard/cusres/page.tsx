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
    RiDeleteBinLine,
} from '@remixicon/react';

import { Card } from '@/components/Card';
import { Divider } from '@/components/Divider';
import { Button } from '@/components/Button';
import { toast } from '@/lib/useToast';
import { getWithToken, nextBase, deleteWithToken } from '@/lib/utils';
import { usePresetDialog } from '@/lib/dialogs';
import { isAxiosError } from 'axios';
import CustomResumeDialog from '@/components/ui/dashboard/CustomResumeDialog';
import { useCusresStore } from '@/store/cusresStore';

interface CusresApiResponse {
  slug: string;
  compiledAt: string | null;
  dataUpdatedAt: string | null;
  stats: {
    projects: number;
    certificates: number;
    awards: number;
    experience: number;
  };
}

interface CusresWithStats {
  id: string;
  slug: string;
  dataUpdatedAt: string;
  compiledAt: string | null;
  projects: number[];
  certifications: number[];
  awards: number[];
  experiences: number[];
  stats: {
    projects: number;
    certificates: number;
    awards: number;
    experience: number;
  };
}

export default function CusresDashboard() {
    const { cusres, hasLoaded, setCusres, deleteCusres, setHasLoaded } = useCusresStore();
    const [isClient, setIsClient] = useState(false);
    const presetDialog = usePresetDialog();

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        async function fetchCusres() {
            if (!isClient || hasLoaded) return;

            try {
                const response = await getWithToken('/cusres');
                
                if (response?.status === 200 && Array.isArray(response.data)) {
                    const apiData = response.data as CusresApiResponse[];
                    
                    // Transform API data to match store format with stats
                    const transformedData: CusresWithStats[] = apiData.map(item => ({
                        id: item.slug, // Use slug as ID for frontend
                        slug: item.slug,
                        compiledAt: item.compiledAt,
                        dataUpdatedAt: item.dataUpdatedAt || new Date().toISOString(),
                        certifications: [],
                        awards: [],
                        experiences: [],
                        projects: [],
                        stats: item.stats
                    }));
                    
                    // Sort by slug
                    transformedData.sort((a, b) => a.slug.localeCompare(b.slug));
                    
                    setCusres(transformedData);
                    setHasLoaded(true);
                } else {
                    setCusres([]);
                    setHasLoaded(true);
                }
            } catch (error) {
                console.error('Error fetching cusres:', error);
                if (isAxiosError(error) && error.response?.status === 401) {
                    presetDialog('unauthorized');
                    return;
                }
                presetDialog('unexpectedError');
                setHasLoaded(true);
                setCusres([]);
            }
        }

        fetchCusres();
    }, [isClient, hasLoaded, setCusres, setHasLoaded, presetDialog]);

    const copyLink = (slug: string) => {
        const url = `${nextBase}/c/${slug}`;
        navigator.clipboard.writeText(`${url}`);
        toast({
            title: 'Copied',
            description: 'Link copied to clipboard',
            variant: 'success',
        });
    };

    const handleDelete = async (slug: string) => {
        const confirmToast = toast({
            title: "Confirm Deletion",
            description: `Are you sure you want to delete "${slug}"?`,
            variant: "error",
            action: {
                altText: "Confirm Delete",
                label: "Delete",
                onClick: async () => {
                    confirmToast.dismiss();

                    try {
                        const response = await deleteWithToken(`/cusres/${slug}`);
                        if (response && response.status === 204) {
                            deleteCusres(slug); // Delete from store using slug as ID
                            toast({
                                title: "Resume Deleted",
                                description: `The custom resume "${slug}" has been deleted.`,
                                variant: "success",
                                duration: 4000,
                            });
                        }
                    } catch (error) {
                        if (isAxiosError(error)) {
                            if (error.response?.status === 401) {
                                presetDialog("sessionExpired");
                            } else if (error.response?.status === 404) {
                                toast({
                                    title: "Not Found",
                                    description: `The resume "${slug}" was not found or has already been deleted.`,
                                    variant: "error",
                                    duration: 4000,
                                });
                            } else {
                                toast({
                                    title: "Deletion Failed",
                                    description: `An error occurred while deleting the resume "${slug}". Please try again.`,
                                    variant: "error",
                                    duration: 4000,
                                });
                            }
                        } else {
                            presetDialog("unexpectedError");
                        }
                    }
                },
            },
        });
    };

    const handleDownload = async (slug: string, type: 'pdf' | 'tex') => {
        toast({
            title: 'Downloading',
            description: `Fetching ${slug} resume...`,
            variant: 'info',
            duration: 2000,
        });

        try {
            const url = `${nextBase}/c/${slug}`;

            let response;

            if (type === 'pdf') {
                response = await fetch(url, { method: 'GET' });
            } else {
                const token = localStorage.getItem('token');

                response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({ slug }),
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });

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
            link.download = `${slug}.${type}`;
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
            <div className="shrink-0 pb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                        Custom Resumes
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        View your custom built resumes ({cusres.length} total)
                    </p>
                </div>
                <CustomResumeDialog />
            </div>

            <Divider className="my-0!" />

            {/* Scrollable Container */}
            <div className="overflow-y-auto pr-2 mt-6 pb-10 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {!hasLoaded ? (
                    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="flex flex-col justify-between p-6! animate-pulse">
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                            <div className="mt-2 h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        </div>
                                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                    </div>

                                    <div className="mt-5 h-9 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>

                                    <div className="mt-5 grid grid-cols-4 gap-2">
                                        {[1, 2, 3, 4].map((j) => (
                                            <div key={j} className="h-14 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        ))}
                                    </div>
                                </div>

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
                        {(cusres as CusresWithStats[]).map((item) => {
                            const displayName = `${item.slug.charAt(0).toUpperCase() + item.slug.slice(1)}`;
                            const displayUrl = `${nextBase}/c/${item.slug}`;

                            const uiStats = [
                                { label: 'Projects', value: item.stats.projects || 0, icon: RiStackLine },
                                { label: 'Certs', value: item.stats.certificates || 0, icon: RiAwardLine },
                                { label: 'Awards', value: item.stats.awards || 0, icon: RiTrophyLine },
                                { label: 'Exp.', value: item.stats.experience || 0, icon: RiBriefcaseLine },
                            ];

                            return (
                                <Card
                                    key={item.slug}
                                    className="group flex flex-col justify-between p-6! hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                                >
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                                                    {displayName}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <RiEyeLine className="size-3.5" />
                                                    Compiled: {formatDate(item.compiledAt)}
                                                </p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDelete(item.slug)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Delete resume"
                                                >
                                                    <RiDeleteBinLine className="size-5" />
                                                </button>
                                                <a
                                                    href={displayUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <RiArrowRightUpLine className="size-5" />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                                            <code className="truncate text-xs text-gray-500 font-mono">
                                                {displayUrl}
                                            </code>
                                            <button
                                                onClick={() => copyLink(item.slug)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors ml-2"
                                                title="Copy URL"
                                            >
                                                <RiFileCopyLine className="size-4" />
                                            </button>
                                        </div>

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

                                    <div className="mt-6 flex gap-3">
                                        <Button
                                            variant="secondary"
                                            className="w-full justify-center"
                                            onClick={() => handleDownload(item.slug, 'tex')}
                                        >
                                            <RiFileCodeLine className="size-4 mr-2 text-gray-500" />
                                            Source
                                        </Button>

                                        <Button
                                            variant="primary"
                                            className="w-full justify-center"
                                            onClick={() => handleDownload(item.slug, 'pdf')}
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