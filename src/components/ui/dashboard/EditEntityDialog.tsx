'use client';

import { useState, useEffect } from 'react';
import { RiGitRepositoryFill, RiLinksLine } from '@remixicon/react';
import { WandSparkles } from 'lucide-react';

import { Button } from '@/components/Button';
import {
    Drawer,
    DrawerBody,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/Drawer';
import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { Textarea } from '@/components/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { Badge } from '@/components/Badge';
import { useFormState } from '@/lib/hooks/useFormState';
import { useEntitySubmit } from '@/lib/hooks/useEntitySubmit';
import { EntityConfig, Entity } from '@/lib/entityConfig';
import { useUserStore } from '@/store/userStore';
import { postWithTokenNextEndpoint, roles } from '@/lib/utils';

interface EditEntityDialogProps {
    config: EntityConfig;
    entity: Entity | null;
    onClose: () => void;
    onSave: (entity: Entity) => void;
}

export default function EditEntityDialog({ config, entity, onClose, onSave }: EditEntityDialogProps) {
    // Build initial form state from config
    const initialState = config.formFields.reduce((acc, field) => {
        if (field.type !== 'file') {
            acc[field.name] = '';
        }
        return acc;
    }, {} as Record<string, string>);

    const { formData, setFormData, error, setError, handleChange } = useFormState(initialState);
    const { user } = useUserStore();
    const [aiGenerating, setAiGenerating] = useState(false);
    const [badgeFormat, setBadgeFormat] = useState<string | null>(null);

    useEffect(() => {
        if (entity) {
            const newFormData: Record<string, string> = {};
            config.formFields.forEach(field => {
                if (field.type !== 'file') {
                    let value = (entity as Record<string, unknown>)[field.name];
                    
                    // Handle tech array for projects
                    if (field.name === 'tech' && Array.isArray(value)) {
                        value = value.join(', ');
                    }
                    
                    // Extract description and badge format
                    if (field.name === 'description' && typeof value === 'string') {
                        if (value.startsWith('##') && value.indexOf('##', 2) > 2) {
                            const endIndex = value.indexOf('##', 2);
                            setBadgeFormat(value.substring(2, endIndex));
                            newFormData[field.name] = value.substring(endIndex + 2).trim();
                        } else {
                            newFormData[field.name] = value;
                        }
                    } else {
                        newFormData[field.name] = (value as string) || '';
                    }
                }
            });
            
            // Add role if it exists
            if ('role' in entity) {
                newFormData.role = (entity as { role?: string }).role || '';
            }
            
            setFormData(newFormData);
        }
    }, [entity, config.formFields, setFormData]);

    const handleSuccess = (data: unknown) => {
        onSave(data as Entity);
        onClose();
    };

    const { submitting, submitUpdate } = useEntitySubmit({
        entityType: config.type,
        endpoint: config.endpoint,
        onSuccess: handleSuccess,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!entity) return;

        // Transform data
        const submitData: Record<string, unknown> = { ...formData };
        
        // Transform tech field for projects
        if (config.type === 'project' && submitData.tech) {
            submitData.tech = (submitData.tech as string).split(',').map(t => t.trim()).filter(t => t);
        }
        
        // Handle optional endDate
        if (submitData.endDate === '') {
            submitData.endDate = null;
        }

        await submitUpdate((entity as { id: string }).id, submitData, setError);
    };

    const handleAIRegenerate = async () => {
        if (aiGenerating) return;
        setAiGenerating(true);

        let newDescription = formData.description;
        let shouldUpdate = false;

        try {
            const requestData: Record<string, unknown> = { ...formData, type: config.type };
            const response = await postWithTokenNextEndpoint("/create", requestData);

            // Clear previous badges
            if (formData.description.startsWith("##") && formData.description.indexOf("##", 2) > 2) {
                const endIndex = formData.description.indexOf("##", 2);
                setFormData({ ...formData, description: formData.description.substring(endIndex + 2).trim() });
            }

            if (response && response.status === 200) {
                const data = response.data;

                if (data.description && data.description !== formData.description) {
                    newDescription = data.description;
                    shouldUpdate = true;
                }

                if (data.role && formData.role !== data.role) {
                    setFormData({ ...formData, role: data.role });
                    shouldUpdate = true;
                }

                if (data.format && data.format !== "None") {
                    setBadgeFormat(data.format);
                    shouldUpdate = true;
                }

                if (shouldUpdate) {
                    setFormData({ ...formData, description: newDescription });
                }
            }
        } catch (error) {
            console.error("AI regeneration failed:", error);
        } finally {
            setAiGenerating(false);
        }
    };

    const renderField = (field: typeof config.formFields[0]) => {
        const isRequired = field.required;
        const label = user?.plan === 'pro' && field.proLabel ? field.proLabel : field.label;

        // Skip file upload in edit mode
        if (field.type === 'file') {
            return null;
        }

        // Textarea
        if (field.type === 'textarea') {
            return (
                <div key={field.name}>
                    <div className="flex items-center justify-between mb-2">
                        <Label htmlFor={field.name} className="font-medium text-sm">
                            {label} {isRequired && <span style={{ color: "red" }}>*</span>}
                        </Label>
                        {user?.plan === 'pro' && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleAIRegenerate}
                                disabled={aiGenerating}
                                className="h-7 text-xs"
                            >
                                <WandSparkles className="h-3 w-3 mr-1" />
                                {aiGenerating ? 'Generating...' : 'Regenerate'}
                            </Button>
                        )}
                    </div>
                    {badgeFormat && (
                        <Badge className="mb-2 text-xs">{badgeFormat}</Badge>
                    )}
                    <Textarea
                        id={field.name}
                        name={field.name}
                        value={formData[field.name] as string}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className="resize-vertical min-h-20"
                        rows={field.rows || 3}
                        required={isRequired}
                        hasError={error === field.name}
                    />
                </div>
            );
        }

        // Role select (if entity has role field)
        if (field.name === 'role' && 'role' in (entity || {})) {
            return (
                <div key={field.name}>
                    <Label htmlFor={field.name} className="font-medium text-sm">
                        Role {isRequired && <span style={{ color: "red" }}>*</span>}
                    </Label>
                    <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                        <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
        <Drawer open={!!entity} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>{config.editDialogTitle}</DrawerTitle>
                </DrawerHeader>
                <DrawerBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        {/* Role field (if exists) */}
                        {'role' in (entity || {}) && (
                            <div>
                                <Label htmlFor="role" className="font-medium text-sm">
                                    Role <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </form>
                </DrawerBody>
                <DrawerFooter className="flex gap-2">
                    <DrawerClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DrawerClose>
                    <Button onClick={handleSubmit} isLoading={submitting}>
                        Save changes
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
