'use client';

import { useState, useEffect } from 'react';
import { RiCloseLine, RiDownloadLine, RiSendPlaneLine } from '@remixicon/react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/Dialog';
import { Divider } from '@/components/Divider';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { Textarea } from '@/components/Textarea';
import { downloadWithTokenNextEndpoint, getWithToken, postWithToken, postWithTokenNextEndpoint } from '@/lib/utils';
import { usePresetDialog } from '@/lib/dialogs';
import { isAxiosError } from 'axios';
import { useAwardStore } from '@/store/awardStore';
import { useCertificateStore } from '@/store/certificateStore';
import { useProjectStore } from '@/store/projectStore';
import { useExperienceStore } from '@/store/experienceStore';
import { Award, Certification, Project, Experience, Cusres } from '@/lib/types';
import { toast } from '@/lib/useToast';
import { useCusresStore } from '@/store/cusresStore';

// Define types
type ProjectItem = {
    id: number;
    name: string;
    role: string;
};

type CertificationItem = {
    id: number;
    name: string;
    role: string;
};

type AwardItem = {
    id: number;
    name: string;
    role: string;
};

type ExperienceItem = {
    id: number;
    name: string;
    role: string;
};

type ItemType = 'projects' | 'certifications' | 'awards' | 'experiences';

type SelectedItem = {
    id: number;
    name: string;
    type: ItemType;
    role?: string;
};

type SelectionSectionProps = {
    title: string;
    data: (ProjectItem | CertificationItem | AwardItem | ExperienceItem)[];
    selectedItems: SelectedItem[];
    onSelect: (item: ProjectItem | CertificationItem | AwardItem | ExperienceItem, type: ItemType) => void;
    type: ItemType;
    isLoading: boolean;
    isJDLoading: boolean;
};

// Loading Skeleton Component
function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2, 3, 4].map((sectionIndex) => (
                <div key={sectionIndex} className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <Divider className="my-2!" />
                    <div className="flex space-x-3 overflow-x-auto pb-3">
                        {[1, 2, 3, 4].map((itemIndex) => (
                            <div
                                key={itemIndex}
                                className="min-w-[180px] max-w-[180px] bg-white dark:bg-gray-925 border border-gray-200 dark:border-gray-800 rounded-lg p-3 animate-pulse"
                            >
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                    <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Selection Component
function SelectionSection({ title, data, selectedItems, onSelect, type, isLoading, isJDLoading }: SelectionSectionProps) {
    const selectedCount = selectedItems.filter(item => item.type === type).length;

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <Divider className="my-2!" />
                <div className="flex space-x-3 overflow-x-auto pb-3">
                    {[1, 2, 3, 4].map((itemIndex) => (
                        <div
                            key={itemIndex}
                            className="min-w-[180px] max-w-[180px] bg-white dark:bg-gray-925 border border-gray-200 dark:border-gray-800 rounded-lg p-3 animate-pulse"
                        >
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Text className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {title}
                    </Text>
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-50">
                        {data.length}
                    </span>
                </div>
                {selectedCount > 0 && (
                    <Text className="text-sm text-blue-600 dark:text-blue-400">
                        {selectedCount} selected
                    </Text>
                )}
            </div>
            <Divider className="my-2!" />
            <div className="relative">
                <div className="flex space-x-3 overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-track]:bg-gray-800 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                    {data.map((item) => {
                        const isSelected = selectedItems.some((selected: SelectedItem) => selected.id === item.id && selected.type === type);
                        return (
                            <Card
                                key={item.id}
                                asChild
                                className={`group min-w-[180px] max-w-[180px] cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                onClick={() => !isJDLoading && onSelect(item, type)}
                            >
                                <div className="relative p-3">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-1 min-w-0">
                                            <Text className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                                                {item.name}
                                            </Text>
                                            <Text className="truncate text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                                {item.role}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Main Dialog Component
export default function CustomResumeDialog() {
    const [slug, setSlug] = useState('');
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [jdOpen, setJdOpen] = useState(false);
    const [jdText, setJdText] = useState('');
    const [isJDLoading, setIsJDLoading] = useState(false);

    const PresetDialog = usePresetDialog();
    const { addCusres } = useCusresStore();

    // Get stores
    const awardStore = useAwardStore();
    const certificateStore = useCertificateStore();
    const projectStore = useProjectStore();
    const experienceStore = useExperienceStore();

    // Convert store data to dialog format
    const projectsData: ProjectItem[] = projectStore.projects.map((project: Project) => ({
        id: parseInt(project.id),
        name: project.name,
        role: project.role || 'Role'
    }));

    const certificationsData: CertificationItem[] = certificateStore.certificates.map((cert: Certification) => ({
        id: parseInt(cert.id),
        name: cert.title,
        role: cert.role || 'Role'
    }));

    const awardsData: AwardItem[] = awardStore.awards.map((award: Award) => ({
        id: parseInt(award.id),
        name: award.title,
        role: award.role || 'Role'
    }));

    const experiencesData: ExperienceItem[] = experienceStore.experiences.map((exp: Experience) => ({
        id: parseInt(exp.id),
        name: exp.title,
        role: exp.role || 'Role'
    }));

    // Check if all data is loaded
    const allLoaded = projectStore.hasLoaded &&
        certificateStore.hasLoaded &&
        awardStore.hasLoaded &&
        experienceStore.hasLoaded;

    const handleSelect = (item: ProjectItem | CertificationItem | AwardItem | ExperienceItem, type: ItemType) => {
        setSelectedItems(prev => {
            const exists = prev.some((selected: SelectedItem) => selected.id === item.id && selected.type === type);
            if (exists) {
                return prev.filter((selected: SelectedItem) => !(selected.id === item.id && selected.type === type));
            } else {
                const newItem: SelectedItem = {
                    ...item,
                    type
                };
                return [...prev, newItem];
            }
        });
    };

    const handleDeploy = async () => {
        if (isDeploying || isDownloading) return;

        setIsDeploying(true);

        if (!slug.trim()) {
            toast({ variant: 'error', title: 'Error', description: 'Please enter a valid name for the resume.' });
            setIsDeploying(false);
            return;
        }

        if (!/^[a-zA-Z0-9]+$/.test(slug.trim())) {
            toast({ variant: 'error', title: 'Error', description: 'Name can only contain alphanumeric characters.' });
            setIsDeploying(false);
            return;
        }

        if (slug.length > 30) {
            toast({ variant: 'error', title: 'Error', description: 'Name cannot be more than 30 characters long.' });
            setIsDeploying(false);
            return;
        }

        if (selectedItems.length === 0) {
            toast({ variant: 'error', title: 'Error', description: 'Please select at least one item to include in the resume.' });
            setIsDeploying(false);
            return;
        }

        // Group selected items by type
        const projects = selectedItems.filter(item => item.type === 'projects').map(item => item.id);
        const certifications = selectedItems.filter(item => item.type === 'certifications').map(item => item.id);
        const awards = selectedItems.filter(item => item.type === 'awards').map(item => item.id);
        const experiences = selectedItems.filter(item => item.type === 'experiences').map(item => item.id);

        try {
            const response = await postWithToken('/cusres', {
                slug: slug.trim(),
                projects,
                certifications,
                awards,
                experiences
            });

            if (response.status === 201) {
                const newCusres: Cusres = {
                    id: response.data.id.toString(),
                    slug: response.data.slug,
                    dataUpdatedAt: new Date().toISOString(),
                    compiledAt: null,
                    projects: projects,
                    certifications: certifications,
                    awards: awards,
                    experiences: experiences,

                    stats: {
                        projects: projects.length,
                        certificates: certifications.length,
                        awards: awards.length,
                        experience: experiences.length,
                    },
                    template: response.data.template
                };

                addCusres(newCusres);
                toast({ variant: 'success', title: 'Success', description: 'Custom resume created successfully!' });
                setIsDialogOpen(false);
                setSelectedItems([]);
                setSlug('');
            }
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response?.status === 401) {
                    PresetDialog("sessionExpired");
                } else if (error.response?.status === 409) {
                    toast({ variant: 'error', title: 'Error', description: 'A resume with this name already exists. Please choose a different name.' });
                } else if (error.response?.status === 429) {
                    toast({ variant: 'error', title: 'Error', description: 'You have reached the maximum limit of custom resumes (3). Please delete an existing resume before creating a new one.' });
                } else if (error.response?.status === 400) {
                    toast({ variant: 'error', title: 'Error', description: error.response.data.error || 'Invalid request. Please check your input.' });
                } else {
                    toast({ variant: 'error', title: 'Error', description: 'Failed to create custom resume. Please try again later.' });
                }
            } else {
                console.log("error");
                toast({ variant: 'error', title: 'Error', description: 'An unexpected error occurred. Please try again later.' });
            }
        } finally {
            setIsDeploying(false);
        }
    };

    const handleJDSubmit = async () => {
        if (!jdText.trim()) {
            toast({ variant: 'error', title: 'Error', description: 'Please enter a job description.' });
            return;
        }

        setIsJDLoading(true);

        try {
            const response = await postWithTokenNextEndpoint('/select', {
                jobDescription: jdText,
                projects: projectStore.projects,
                certifications: certificateStore.certificates,
                awards: awardStore.awards,
                experiences: experienceStore.experiences
            });

            if (!response || response.status !== 200) {
                throw new Error('Failed request');
            }

            const data = response.data.data;

            const newSelected: SelectedItem[] = [];

            data.projects?.forEach((id: number) => {
                const item = projectsData.find(p => p.id === id);
                if (item) newSelected.push({ ...item, type: 'projects' });
            });

            data.certifications?.forEach((id: number) => {
                const item = certificationsData.find(c => c.id === id);
                if (item) newSelected.push({ ...item, type: 'certifications' });
            });

            data.awards?.forEach((id: number) => {
                const item = awardsData.find(a => a.id === id);
                if (item) newSelected.push({ ...item, type: 'awards' });
            });

            data.experiences?.forEach((id: number) => {
                const item = experiencesData.find(e => e.id === id);
                if (item) newSelected.push({ ...item, type: 'experiences' });
            });

            setSelectedItems(newSelected);

            setJdText('');
            setJdOpen(false);

            toast({
                variant: 'success',
                title: 'Done',
                description: 'JD processed, selected ' + newSelected.length + ' items.',
            });

        } catch (err) {
            if (isAxiosError(err)) {
                if (err.response?.status === 401) {
                    PresetDialog("sessionExpired");
                } else {
                    toast({
                        variant: 'error',
                        title: 'Error',
                        description: 'Failed to process JD.'
                    });
                }
            } else {
                toast({
                    variant: 'error',
                    title: 'Error',
                    description: 'Unexpected error.'
                });
            }
        } finally {
            setIsJDLoading(false);
        }
    };

    const handleDownload = async () => {
        if (isDownloading || isDeploying) return;

        setIsDownloading(true);

        if (selectedItems.length === 0) {
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Please select at least one item to include in the resume.',
            });
            setIsDownloading(false);
            return;
        }

        const projects = selectedItems
            .filter(item => item.type === 'projects')
            .map(item => item.id);

        const certifications = selectedItems
            .filter(item => item.type === 'certifications')
            .map(item => item.id);

        const awards = selectedItems
            .filter(item => item.type === 'awards')
            .map(item => item.id);

        const experiences = selectedItems
            .filter(item => item.type === 'experiences')
            .map(item => item.id);

        try {
            const res = await downloadWithTokenNextEndpoint('/resume-direct', {
                role: slug || 'custom',
                projects,
                certifications,
                awards,
                experiences,
            });

            if (!res) return;

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'resume.pdf';
            document.body.appendChild(a);
            a.click();

            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast({
                variant: 'error',
                title: 'Error',
                description: 'Failed to download resume. Please try again.',
            });
        } finally {
            setIsDownloading(false);
        }
    };


    // Load data in parallel when dialog opens
    useEffect(() => {
        if (!isDialogOpen) return;

        interface NeedsToLoadItem {
            endpoint: string;
            type: ItemType;
        }

        const loadData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                PresetDialog("sessionExpired");
                return;
            }

            // Only load if not already loaded - using correct endpoints from ENTITY_CONFIGS
            const needsToLoad: NeedsToLoadItem[] = [];

            if (!projectStore.hasLoaded) {
                needsToLoad.push({ endpoint: '/projects', type: 'projects' });
            }
            if (!certificateStore.hasLoaded) {
                needsToLoad.push({ endpoint: '/certifications', type: 'certifications' });
            }
            if (!awardStore.hasLoaded) {
                needsToLoad.push({ endpoint: '/awards', type: 'awards' });
            }
            if (!experienceStore.hasLoaded) {
                needsToLoad.push({ endpoint: '/experiences', type: 'experiences' });
            }

            if (needsToLoad.length === 0) return;

            setIsLoading(true);

            try {
                // Execute all API calls in parallel
                const requests = needsToLoad.map(({ endpoint }) => getWithToken(endpoint));
                const responses = await Promise.allSettled(requests);

                responses.forEach((result, index) => {
                    const { type } = needsToLoad[index];

                    if (result.status === 'fulfilled' && result.value?.status === 200) {
                        // Update appropriate store based on type
                        if (type === 'projects') {
                            projectStore.setProjects(result.value.data);
                            projectStore.setHasLoaded(true);
                        } else if (type === 'certifications') {
                            certificateStore.setCertificates(result.value.data);
                            certificateStore.setHasLoaded(true);
                        } else if (type === 'awards') {
                            awardStore.setAwards(result.value.data);
                            awardStore.setHasLoaded(true);
                        } else if (type === 'experiences') {
                            experienceStore.setExperiences(result.value.data);
                            experienceStore.setHasLoaded(true);
                        }
                    } else if (result.status === 'rejected') {
                        const error = result.reason;
                        if (isAxiosError(error)) {
                            if (error.response?.status === 401) {
                                localStorage.clear();
                                PresetDialog("sessionExpired");
                            } else if (error.code === "ERR_NETWORK") {
                                PresetDialog("networkError");
                            }
                        } else {
                            PresetDialog("unexpectedError");
                        }
                        // Set hasLoaded to true to prevent infinite retry
                        if (type === 'projects') {
                            projectStore.setHasLoaded(true);
                        } else if (type === 'certifications') {
                            certificateStore.setHasLoaded(true);
                        } else if (type === 'awards') {
                            awardStore.setHasLoaded(true);
                        } else if (type === 'experiences') {
                            experienceStore.setHasLoaded(true);
                        }
                    }
                });
            } catch (error) {
                console.error('Error loading data:', error);
                PresetDialog("unexpectedError");
                // Set all to loaded to prevent infinite retry
                projectStore.setHasLoaded(true);
                certificateStore.setHasLoaded(true);
                awardStore.setHasLoaded(true);
                experienceStore.setHasLoaded(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [isDialogOpen, PresetDialog, projectStore, certificateStore, awardStore, experienceStore]);

    return (
        <div className="obfuscate">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button>Build Custom Resume</Button>
                </DialogTrigger>
                <DialogContent className="p-0! sm:max-w-7xl">
                    <DialogClose asChild>
                        <Button
                            className="absolute! right-3! top-3! z-50! p-2! text-gray-400! hover:text-gray-500! dark:text-gray-600! hover:dark:text-gray-500!"
                            variant="ghost"
                        >
                            <RiCloseLine className="size-5 shrink-0" />
                        </Button>
                    </DialogClose>

                    <DialogHeader className="border-b border-gray-200 px-6 py-4 dark:border-gray-900">
                        <div className="flex items-center justify-between w-full">
                            <DialogTitle className="text-base font-medium text-gray-900 dark:text-gray-50">
                                Create Custom Resume
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="flex h-[calc(100vh-150px)] flex-col">
                        {/* Slug and Actions */}
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-900">
                            <div className="flex flex-1 items-center space-x-4">
                                <Text className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                    Name:
                                </Text>
                                <div className="w-full max-w-md">
                                    <Input
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="resumeName"
                                        className="w-full max-w-md"
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => setJdOpen(true)}
                                    disabled={isDeploying || isDownloading || isJDLoading}
                                >
                                    Select with JD
                                </Button>
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="secondary"
                                    onClick={handleDeploy}
                                    className="flex items-center space-x-2"
                                    disabled={isDeploying || isDownloading}
                                    isLoading={isDeploying}
                                >
                                    {!isDeploying && (<RiSendPlaneLine className="size-4" />)}
                                    <span>Deploy</span>
                                </Button>
                                <Button
                                    onClick={handleDownload}
                                    className="flex items-center space-x-2"
                                    disabled={isDownloading || isDeploying}
                                    isLoading={isDownloading}
                                >
                                    {!isDownloading && (<RiDownloadLine className="size-4" />)}
                                    <span>Download</span>
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-gray-800 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                            {isLoading ? (
                                <LoadingSkeleton />
                            ) : !allLoaded ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                            Loading your data...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <SelectionSection
                                        title="Projects"
                                        data={projectsData}
                                        selectedItems={selectedItems}
                                        onSelect={handleSelect}
                                        type="projects"
                                        isLoading={false}
                                        isJDLoading={isJDLoading}
                                    />

                                    <SelectionSection
                                        title="Certifications"
                                        data={certificationsData}
                                        selectedItems={selectedItems}
                                        onSelect={handleSelect}
                                        type="certifications"
                                        isLoading={false}
                                        isJDLoading={isJDLoading}
                                    />

                                    <SelectionSection
                                        title="Awards"
                                        data={awardsData}
                                        selectedItems={selectedItems}
                                        onSelect={handleSelect}
                                        type="awards"
                                        isLoading={false}
                                        isJDLoading={isJDLoading}
                                    />

                                    <SelectionSection
                                        title="Experiences"
                                        data={experiencesData}
                                        selectedItems={selectedItems}
                                        onSelect={handleSelect}
                                        type="experiences"
                                        isLoading={false}
                                        isJDLoading={isJDLoading}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={jdOpen} onOpenChange={setJdOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Job Description</DialogTitle>
                    </DialogHeader>

                    <Textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste job description here..."
                        rows={8}
                        disabled={isJDLoading}
                    />

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="secondary"
                            onClick={() => { setJdText(''); setJdOpen(false); }}
                            disabled={isJDLoading}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleJDSubmit}
                            isLoading={isJDLoading}
                            disabled={isJDLoading}
                        >
                            OK
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}