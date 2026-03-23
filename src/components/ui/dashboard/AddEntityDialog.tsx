'use client';

import { useState } from 'react';
import { RiCloseLine, RiGitRepositoryFill, RiLinksLine } from '@remixicon/react';
import Tesseract from 'tesseract.js';

import { Button } from '@/components/Button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/Dialog';
import { Label } from '@/components/Label';
import { Input } from '@/components/Input';
import { Autocomplete } from '@/components/Autocomplete';
import { Textarea } from '@/components/Textarea';
import { useFormState } from '@/lib/hooks/useFormState';
import { useEntitySubmit } from '@/lib/hooks/useEntitySubmit';
import { EntityConfig } from '@/lib/entityConfig';
import { useUserStore } from '@/store/userStore';
import { useAwardStore } from '@/store/awardStore';
import { useCertificateStore } from '@/store/certificateStore';
import { useProjectStore } from '@/store/projectStore';
import { useExperienceStore } from '@/store/experienceStore';
import { Award, Certification, Project, Experience } from '@/lib/types';
import { Import } from 'lucide-react';
import { toast } from '@/lib/useToast';
import { postWithTokenNextEndpoint, roles } from '@/lib/utils';
import { MultiSelect, MultiSelectItem } from '@/components/MultiSelect';

interface AddEntityDialogProps {
    config: EntityConfig;
}

export default function AddEntityDialog({ config }: AddEntityDialogProps) {
    const [open, setOpen] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [githubLoading, setGithubLoading] = useState(false);

    const { user, editAwardCount, editCertCount, setUser, editSkills } = useUserStore();
    const { addAward, awards } = useAwardStore();
    const { addCertificate, certificates } = useCertificateStore();
    const { addProject, projects } = useProjectStore();
    const { addExperience, experiences } = useExperienceStore();

    const initialState: Record<string, unknown> = config.formFields.reduce((acc: Record<string, unknown>, field) => {
        if (field.type !== 'file') {
            acc[field.name] = '';
        }
        return acc;
    }, {} as Record<string, unknown>);

    initialState.role = [];
    const { formData, setFormState, error, setError, handleChange, resetForm } = useFormState(initialState);

    const handleSuccess = (data: unknown) => {
        // Update appropriate store based on entity type
        if (config.type === 'award') {
            addAward(data as Award);
            editAwardCount(1, 'increment');
        } else if (config.type === 'certification') {
            addCertificate(data as Certification);
            editCertCount(1, 'increment');
        } else if (config.type === 'project') {
            addProject(data as Project);
            if (formData.tech) {
                const techArray = (formData.tech as string).split(',').map(t => t.trim()).filter(t => t);
                editSkills(techArray, "add");
            }
            setUser({ ...user!, projectsCount: (user?.projectsCount ?? 0) + 1 });
        } else if (config.type === 'experience') {
            addExperience(data as Experience);
            setUser({ ...user!, experienceCount: (user?.experienceCount ?? 0) + 1 });
        }

        resetForm();
        setOpen(false);
    };

    const { submitting, submitCreate } = useEntitySubmit({
        entityType: config.type,
        endpoint: config.endpoint,
        onSuccess: handleSuccess,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (user?.plan !== 'pro' && (!formData.role || (formData.role as string[]).length === 0)) {
            toast({
                title: "Validation Error",
                description: "At least one role must be selected.",
                variant: "error",
                duration: 4000,
            });
            return;
        }

        // Transform tech field for projects
        const submitData: Record<string, unknown> = { ...formData };

        let descriptions: string[] = [];

        if (config.type === "project") {
            descriptions = projects
                .map(p => p.description)
                .filter(Boolean);
        }

        if (config.type === "award") {
            descriptions = awards
                .map(a => a.description)
                .filter(Boolean);
        }

        if (config.type === "certification") {
            descriptions = certificates
                .map(c => c.description)
                .filter(Boolean);
        }

        if (config.type === "experience") {
            descriptions = experiences
                .map(e => e.description)
                .filter(Boolean);
        }

        submitData.descriptions = descriptions;

        if (config.type === 'project' && submitData.tech) {
            submitData.tech = (submitData.tech as string).split(',').map(t => t.trim()).filter(t => t);
        }

        // Handle optional endDate
        if (submitData.endDate === '') {
            delete submitData.endDate;
        }

        await submitCreate(submitData, setError);
    };

    // Handle OCR upload (only for awards)
    const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setOcrLoading(true);

        try {
            setLoadingMsg("Extracting text...");
            const imageUrl = URL.createObjectURL(file);
            const { data } = await Tesseract.recognize(imageUrl, 'eng');
            setLoadingMsg("Analyzing extracted text...");

            const response = await postWithTokenNextEndpoint("/scan", {
                certificate: data.text,
                type: config.type
            });

            if (response && response.status === 200) {
                setFormState(response.data);
            }
            URL.revokeObjectURL(imageUrl);
        } catch (err) {
            console.error('OCR failed:', err);
        } finally {
            setOcrLoading(false);
        }
    };

    const renderField = (field: typeof config.formFields[0]) => {
        const isRequired = field.required;
        const label = user?.plan === 'pro' && field.proLabel ? field.proLabel : field.label;
        const disabled = ocrLoading;

        // Skip file upload for non-award types
        if (field.type === 'file' && config.type !== 'award') {
            return null;
        }

        // File upload (OCR for awards)
        if (field.type === 'file') {
            return (
                <div key={field.name}>
                    <Label htmlFor={field.name} className="font-medium text-sm">
                        {label}
                    </Label>
                    <Input
                        type="file"
                        id={field.name}
                        name={field.name}
                        accept={field.accept}
                        onChange={handleOCRUpload}
                        className="mt-2"
                        disabled={disabled}
                    />
                    {ocrLoading && (
                        <div className="mt-3 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{loadingMsg}</span>
                        </div>
                    )}
                </div>
            );
        }

        // Textarea
        if (field.type === 'textarea') {
            return (
                <div key={field.name}>
                    <Label htmlFor={field.name} className="font-medium text-sm">
                        {label} {isRequired && <span style={{ color: "red" }}>*</span>}
                    </Label>
                    <Textarea
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] as string}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className="mt-2 resize-vertical min-h-20"
                        rows={field.rows || 3}
                        required={isRequired}
                        hasError={error === field.name}
                        disabled={disabled}
                    />
                </div>
            );
        }

        // Autocomplete
        if (field.type === 'autocomplete') {
            return (
                <div key={field.name}>
                    <Label htmlFor={field.name} className="font-medium text-sm">
                        {label} {isRequired && <span style={{ color: "red" }}>*</span>}
                    </Label>
                    <Autocomplete
                        typeQuery={field.autocompleteType!}
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] as string}
                        onValueChange={(val, payload) => {
                            setFormState({ ...formData, [field.name]: val, ...(payload || {}) })
                        }}
                        placeholder={field.placeholder}
                        className="mt-2"
                        required={isRequired}
                        hasError={error === field.name}
                        disabled={disabled}
                    />
                </div>
            );
        }

        // Input with icon (repo, url)
        const showIcon = field.name === 'repo' || field.name === 'url';
        const Icon = field.name === 'repo' ? RiGitRepositoryFill : RiLinksLine;
        const showGithubFetch = config.type === 'project' && field.name === 'repo' && Boolean(formData.repo);

        return (
            <div key={field.name}>
                <Label htmlFor={field.name} className="font-medium text-sm">
                    {label} {isRequired && <span style={{ color: "red" }}>*</span>}
                </Label>
                {showIcon ? (
                    <div className="mt-2 flex items-center gap-2">
                        <Icon className="size-4 text-gray-400 shrink-0" />

                        <Input
                            type={field.type}
                            id={field.name}
                            name={field.name}
                            value={formData[field.name] as string}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            className="flex-1 min-w-0"
                            required={isRequired}
                            hasError={error === field.name}
                            disabled={disabled || githubLoading}
                        />

                        {showGithubFetch && (
                            <button
                                type="button"
                                onClick={handleGithubPrefill}
                                disabled={githubLoading}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            >
                                {githubLoading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                ) : (
                                    <Import className="size-5" />
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <Input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] as string}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className="mt-2"
                        required={isRequired}
                        hasError={error === field.name}
                        disabled={disabled}
                    />
                )}
                {field.helperText && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {field.helperText}
                    </p>
                )}
            </div>
        );
    };

    const handleGithubPrefill = async () => {
        try {
            setGithubLoading(true);
            setOcrLoading(true);

            const repoInput = String(formData.repo).trim();

            let owner = '';
            let repo = '';

            if (repoInput.includes('github.com')) {
                const parts = repoInput.replace('https://github.com/', '').split('/');
                owner = parts[0];
                repo = parts[1];
            } else {
                const parts = repoInput.split('/');
                owner = parts[0];
                repo = parts[1];
            }

            if (!owner || !repo) {
                toast({
                    title: 'Invalid GitHub repository',
                    description: 'Please enter a valid public GitHub repo URL or owner/repo.',
                    variant: 'error',
                    duration: 5000,
                });
                return;
            }

            const stripToPlainText = (text: string) => {
                return text
                    // remove HTML tags
                    .replace(/<[^>]*>/g, ' ')
                    // remove markdown images
                    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
                    // remove markdown links but keep text
                    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
                    // remove markdown symbols
                    .replace(/[#>*_`~\-]+/g, ' ')
                    // remove extra punctuation blocks
                    .replace(/\|+/g, ' ')
                    // normalize whitespace
                    .replace(/\s+/g, ' ')
                    .trim();
            };

            // Repo metadata
            const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            const repoData = await repoRes.json();

            //if repo failed
            if (!repoRes.ok) {
                toast({
                    title: 'Repository not found or inaccessible',
                    description: 'Please check the repo URL and ensure it is public.',
                    variant: 'error',
                    duration: 5000,
                });
                return;
            }

            // Languages
            const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
            const langData = await langRes.json();
            const tech = Object.keys(langData).join(', ');

            let description = stripToPlainText(repoData.description || '');

            if (user?.plan === 'pro') {
                const readmeRes = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/readme`,
                    {
                        headers: { Accept: 'application/vnd.github.raw' },
                    }
                );

                if (readmeRes.ok) {
                    const readmeText = await readmeRes.text();
                    const cleanReadme = stripToPlainText(readmeText);
                    description = [description, cleanReadme].filter(Boolean).join(' \n');
                }
            }

            setFormState({
                ...formData,
                name: repoData.name,
                description,
                tech,
                url: repoData.html_url,
                startDate: repoData.created_at?.slice(0, 10),
            });
        } catch (err) {
            console.error('GitHub prefill failed:', err);
            toast({
                title: 'GitHub fetch failed',
                description: 'Could not fetch repository data. Please check the repo URL and try again.',
                variant: 'error',
                duration: 5000,
            });
        } finally {
            setGithubLoading(false);
            setOcrLoading(false);
        }
    };

    // Group date fields for side-by-side layout
    const hasDateRange = config.formFields.some(f => f.name === 'startDate') &&
        config.formFields.some(f => f.name === 'endDate');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>{config.addButtonText}</Button>
            </DialogTrigger>
            <DialogContent className="p-0! max-w-[95vw] sm:max-w-md md:max-w-lg">
                <DialogClose asChild>
                    <Button
                        className="absolute! right-3! top-3! p-2! text-gray-400! hover:text-gray-500! dark:text-gray-600! hover:dark:text-gray-500!"
                        variant="ghost"
                    >
                        <RiCloseLine className="size-5 shrink-0" />
                    </Button>
                </DialogClose>

                <DialogHeader className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-900">
                    <DialogTitle className="text-base">{config.dialogTitle}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col max-h-[80vh] overflow-y-auto">
                        <div className="flex-1 space-y-4 p-4 sm:p-6 sm:space-y-6">
                            {/* Repo first */}
                            {config.formFields
                                .filter(f => f.name === 'repo')
                                .map(renderField)}
                            {config.formFields
                                .filter(f => f.name !== 'repo')
                                .map((field) => {
                                    // Skip date fields if rendering as range
                                    if (hasDateRange && (field.name === 'startDate' || field.name === 'endDate')) {
                                        return null;
                                    }
                                    return renderField(field);
                                })}

                            {/* Date Range */}
                            {hasDateRange && (
                                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                                    {config.formFields.filter(f => f.name === 'startDate' || f.name === 'endDate').map(field => {
                                        const label = user?.plan === 'pro' && field.proLabel ? field.proLabel : field.label;
                                        return (
                                            <div key={field.name}>
                                                <Label htmlFor={field.name} className="font-medium text-sm">
                                                    {label} {field.required && <span style={{ color: "red" }}>*</span>}
                                                </Label>
                                                <Input
                                                    type="date"
                                                    id={field.name}
                                                    name={field.name}
                                                    value={formData[field.name] as string}
                                                    onChange={handleChange}
                                                    className="mt-2"
                                                    required={field.required}
                                                    hasError={error === field.name}
                                                    disabled={ocrLoading}
                                                />
                                                {field.helperText && (
                                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                        {field.helperText}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {user?.plan !== 'pro' && (
                                <div>
                                    <Label htmlFor="role" className="font-medium text-sm">
                                        Role <span className="text-red-500">*</span>
                                    </Label>
                                    <MultiSelect
                                        value={formData.role as string[] || []}
                                        onValueChange={(value: string[]) => setFormState({ ...formData, role: value })}
                                        placeholder="Select roles"
                                        className="mt-2 text-sm"
                                    >
                                        {roles.map((role: { value: string, label: string }) => (
                                            <MultiSelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </MultiSelectItem>
                                        ))}
                                    </MultiSelect>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between border-t border-gray-200 p-4 sm:p-6 dark:border-gray-900">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="text-sm"
                                    onClick={resetForm}
                                    disabled={ocrLoading || githubLoading}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                className="text-sm"
                                isLoading={submitting || ocrLoading || githubLoading}
                                disabled={ocrLoading || githubLoading}
                            >
                                {config.addButtonText}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
