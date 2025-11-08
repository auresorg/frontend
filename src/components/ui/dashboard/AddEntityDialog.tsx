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
import { Textarea } from '@/components/Textarea';
import { useFormState } from '@/lib/hooks/useFormState';
import { useEntitySubmit } from '@/lib/hooks/useEntitySubmit';
import { EntityConfig } from '@/lib/entityConfig';
import { useUserStore } from '@/store/userStore';
import { useAwardStore } from '@/store/awardStore';
import { useCertificateStore } from '@/store/certificateStore';
import { useProjectStore } from '@/store/projectStore';
import { postWithTokenNextEndpoint } from '@/lib/utils';
import { Award, Certification, Project } from '@/lib/types';

interface AddEntityDialogProps {
    config: EntityConfig;
}

export default function AddEntityDialog({ config }: AddEntityDialogProps) {
    const [open, setOpen] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    
    const { user, editAwardCount, editCertCount, setUser, editSkills } = useUserStore();
    const { addAward } = useAwardStore();
    const { addCertificate } = useCertificateStore();
    const { addProject } = useProjectStore();

    // Build initial form state from config
    const initialState = config.formFields.reduce((acc, field) => {
        if (field.type !== 'file') {
            acc[field.name] = '';
        }
        return acc;
    }, {} as Record<string, string>);

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
        
        // Transform tech field for projects
        const submitData: Record<string, unknown> = { ...formData };
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

        // Input with icon (repo, url)
        const showIcon = field.name === 'repo' || field.name === 'url';
        const Icon = field.name === 'repo' ? RiGitRepositoryFill : RiLinksLine;

        return (
            <div key={field.name}>
                <Label htmlFor={field.name} className="font-medium text-sm">
                    {label} {isRequired && <span style={{ color: "red" }}>*</span>}
                </Label>
                {showIcon ? (
                    <div className="mt-2 flex items-center">
                        <Icon className="mr-2 size-4 text-gray-400 shrink-0" />
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
                            disabled={disabled}
                        />
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
                            {config.formFields.map((field) => {
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
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between border-t border-gray-200 p-4 sm:p-6 dark:border-gray-900">
                            <DialogClose asChild>
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    className="text-sm" 
                                    onClick={resetForm}
                                    disabled={ocrLoading}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button 
                                type="submit" 
                                className="text-sm" 
                                isLoading={submitting || ocrLoading}
                                disabled={ocrLoading}
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
