'use client';

import { useState, useEffect } from 'react';
import { RiGitRepositoryFill, RiLinksLine } from '@remixicon/react';
import { WandSparkles } from 'lucide-react';
import { isAxiosError } from 'axios';

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
import { EntityConfig, Entity } from '@/lib/entityConfig';
import { useUserStore } from '@/store/userStore';
import { postWithTokenNextEndpoint, putWithToken, roles } from '@/lib/utils';
import { toast } from '@/lib/useToast';
import { usePresetDialog } from '@/lib/dialogs';

interface EditEntityDialogProps {
    config: EntityConfig;
    entity: Entity | null;
    onClose: () => void;
    onSave: (entity: Entity) => void;
}

export default function EditEntityDialog({ config, entity, onClose, onSave }: EditEntityDialogProps) {
    const initialState = config.formFields.reduce((acc, field) => {
        if (field.type !== 'file') {
            acc[field.name] = '';
        }
        return acc;
    }, {} as Record<string, string>);

    initialState.role = '';

    const [formData, setFormData] = useState<Record<string, string>>(initialState);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [animatedText, setAnimatedText] = useState('');
    const [displayText, setDisplayText] = useState('');
    
    const { user } = useUserStore();
    const PresetDialog = usePresetDialog();

    let badgeText: string = '';
    let badgeType: "error" | "default" | "success" | "warning" | "neutral" | undefined = "default";

    if (formData.description && formData.description.startsWith('##') && formData.description.indexOf('##', 2) > 2) {
        const endIndex = formData.description.indexOf('##', 2);
        badgeText = formData.description.substring(2, endIndex).trim();
    }

    switch (badgeText) {
        case 'STAR':
            badgeType = 'default';
            break;
        case 'CAR':
            badgeType = 'warning';
            break;
        case 'XYZ':
            badgeType = 'success';
            break;
    }

    useEffect(() => {
        if (entity) {
            const newFormData: Record<string, string> = {};
            config.formFields.forEach(field => {
                if (field.type !== 'file') {
                    let value = (entity as Record<string, unknown>)[field.name];
                    
                    if (field.name === 'tech' && Array.isArray(value)) {
                        value = value.join(', ');
                    }
                    
                    newFormData[field.name] = (value as string) || '';
                }
            });
            
            if ('role' in entity) {
                newFormData.role = (entity as { role?: string }).role || '';
            }
            
            setFormData(newFormData);
        }
    }, [entity, config.formFields]);

    useEffect(() => {
        if (!isGenerating && formData.description) {
            if (badgeText && formData.description.startsWith("##")) {
                const endIndex = formData.description.indexOf("##", 2);
                if (endIndex > 2) {
                    setDisplayText(formData.description.substring(endIndex + 2).trim());
                } else {
                    setDisplayText(formData.description);
                }
            } else {
                setDisplayText(formData.description);
            }
        }
    }, [formData.description, badgeText, isGenerating]);

    useEffect(() => {
        if (isGenerating) {
            const text = "Generating magic…";
            let i = 0;
            const interval = setInterval(() => {
                setAnimatedText(text.substring(0, i + 1));
                i++;
                if (i === text.length) clearInterval(interval);
            }, 80);
            return () => clearInterval(interval);
        }
    }, [isGenerating]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDisplayText(e.target.value);
        handleChange(e);
    };

    const handleAIRephrase = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        const startTime = Date.now();

        let newDescription: string = formData.description;
        let shouldUpdate = false;

        try {
            const requestData: Record<string, unknown> = { ...formData, type: config.type };
            const response = await postWithTokenNextEndpoint("/create", requestData);

            if (formData.description.startsWith("##") && formData.description.indexOf("##", 2) > 2) {
                const endIndex = formData.description.indexOf("##", 2);
                formData.description = formData.description.substring(endIndex + 2).trim();
            }

            if (response && response.status === 200) {
                const format = response.data.format;
                const desc = response.data.description;
                const role = response.data.role;

                if (desc && desc !== formData.description) {
                    if (format && format !== "None") {
                        newDescription = `##${format}##${desc}`;
                    } else {
                        newDescription = desc;
                    }
                    shouldUpdate = true;
                }

                if (role && formData.role !== role) {
                    setFormData(prev => ({ ...prev, role }));
                }

                setDisplayText(
                    newDescription.startsWith("##") && format && format !== "None"
                        ? newDescription.substring(newDescription.indexOf("##", 2) + 2).trim()
                        : newDescription
                );
            }
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response?.status === 401) {
                    PresetDialog("sessionExpired");
                    return;
                } else {
                    toast({
                        title: "Error",
                        description: "An error occurred during AI generation.",
                        variant: "error",
                        duration: 4000,
                    });
                }
            } else {
                PresetDialog("unexpectedError");
            }
        } finally {
            const elapsed = Date.now() - startTime;
            const minDuration = 4000;

            const finish = () => {
                setIsGenerating(false);
                if (shouldUpdate) {
                    handleChange({
                        target: { name: "description", value: newDescription },
                    } as React.ChangeEvent<HTMLTextAreaElement>);

                    setDisplayText(
                        newDescription.startsWith("##") && badgeText
                            ? newDescription.substring(newDescription.indexOf("##", 2) + 2).trim()
                            : newDescription
                    );
                }
            };

            if (elapsed < minDuration) {
                setTimeout(finish, minDuration - elapsed);
            } else {
                finish();
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting || !entity) return;
        setSubmitting(true);

        try {
            const submitData: Record<string, unknown> = { ...formData };
            
            if (config.type === 'project' && submitData.tech) {
                submitData.tech = (submitData.tech as string).split(',').map(t => t.trim()).filter(t => t);
            }
            
            if (submitData.endDate === '') {
                submitData.endDate = null;
            }

            const response = await putWithToken(`${config.endpoint}/${(entity as { id: string }).id}`, submitData);
            
            if (response && response.status === 200) {
                toast({
                    title: `${config.singular} Updated`,
                    description: `Your ${config.singular.toLowerCase()} has been updated successfully.`,
                    variant: 'success',
                });
                // Use the submitted data since API returns 200 but doesn't return the updated entity
                const updatedEntity = { ...entity, ...submitData };
                onSave(updatedEntity as Entity);
                onClose();
            }
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response?.status === 401) {
                    PresetDialog('sessionExpired');
                    return;
                } else if (error.response?.status === 400) {
                    toast({
                        title: "Error",
                        description: error.response?.data?.errors
                            ? String(Object.values(error.response.data.errors)[0])
                            : "An error occurred.",
                        variant: "error",
                        duration: 4000,
                    });
                    if (error.response.data.errors) {
                        setError(Object.keys(error.response.data.errors)[0]);
                    }
                } else {
                    toast({
                        title: "Error",
                        description: "An unexpected error occurred.",
                        variant: "error",
                        duration: 4000,
                    });
                }
            } else {
                PresetDialog('unexpectedError');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field: typeof config.formFields[0]) => {
        const isRequired = field.required;
        const label = user?.plan === 'pro' && field.proLabel ? field.proLabel : field.label;

        if (field.type === 'file') {
            return null;
        }

        if (field.type === 'textarea') {
            return (
                <div key={field.name} className="relative">
                    <Label htmlFor={field.name} className="font-medium">
                        {label} {isRequired && <span className="text-red-500">*</span>}
                    </Label>

                    <div className="relative mt-2">
                        <Textarea
                            id={field.name}
                            name={field.name}
                            value={isGenerating ? animatedText : displayText}
                            onChange={handleTextareaChange}
                            placeholder={field.placeholder}
                            className={`resize-vertical min-h-[100px] pr-10 text-gray-800 ${
                                badgeText ? "pt-3" : ""
                            } ${
                                isGenerating
                                    ? "opacity-70 blur-[1px] transition-all duration-500"
                                    : ""
                            }`}
                            rows={field.rows || 3}
                            required={isRequired}
                            disabled={isGenerating}
                            hasError={error === field.name}
                        />

                        {badgeText && (
                            <div className="absolute -top-3 right-4 bg-white px-2 dark:bg-gray-925">
                                <Badge variant={badgeType}>{badgeText}</Badge>
                            </div>
                        )}

                        {user?.plan === 'pro' && (
                            <span
                                onClick={handleAIRephrase}
                                className={`absolute bottom-2 right-3 text-gray-400 cursor-pointer transition-transform ${
                                    isGenerating
                                        ? "opacity-50 pointer-events-none"
                                        : "hover:text-indigo-500"
                                }`}
                            >
                                <WandSparkles size={16} />
                            </span>
                        )}

                        {isGenerating && (
                            <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
                                <div className="absolute inset-0 animate-energy-sweep" />
                                <div className="absolute inset-0 animate-glow-border rounded-md" />
                            </div>
                        )}
                    </div>

                    <style jsx>
                        {`
                            @keyframes energySweep {
                                0% {
                                    transform: translateX(-120%) skewX(-8deg) scaleX(1.2);
                                    opacity: 0.2;
                                    filter: blur(14px);
                                }
                                20% {
                                    opacity: 0.8;
                                }
                                50% {
                                    transform: translateX(0%) skewX(0deg) scaleX(1);
                                    opacity: 1;
                                    filter: blur(6px);
                                }
                                80% {
                                    opacity: 0.7;
                                }
                                100% {
                                    transform: translateX(120%) skewX(8deg) scaleX(1.2);
                                    opacity: 0;
                                    filter: blur(14px);
                                }
                            }
                            .animate-energy-sweep {
                                position: absolute;
                                inset: 0;
                                background: conic-gradient(
                                    from 120deg at 30% 50%,
                                    rgba(0, 122, 255, 0.25),
                                    rgba(147, 51, 234, 0.25),
                                    rgba(236, 72, 153, 0.25),
                                    rgba(0, 122, 255, 0.25)
                                );
                                background-size: 200% 200%;
                                animation: energySweep 3.2s cubic-bezier(0.45, 0.1, 0.15, 1) infinite;
                            }

                            @keyframes glowBorder {
                                0%, 100% {
                                    box-shadow: 0 0 8px rgba(99, 102, 241, 0.4),
                                                0 0 16px rgba(139, 92, 246, 0.25);
                                }
                                50% {
                                    box-shadow: 0 0 16px rgba(99, 102, 241, 0.7),
                                                0 0 28px rgba(139, 92, 246, 0.4),
                                                0 0 40px rgba(236, 72, 153, 0.25);
                                }
                            }
                            .animate-glow-border {
                                animation: glowBorder 2.4s ease-in-out infinite;
                            }
                        `}
                    </style>
                </div>
            );
        }

        const showIcon = field.name === 'repo' || field.name === 'url';
        const Icon = field.name === 'repo' ? RiGitRepositoryFill : RiLinksLine;

        return (
            <div key={field.name}>
                <Label htmlFor={field.name} className="font-medium">
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

    const hasDateRange = config.formFields.some(f => f.name === 'startDate') && 
                         config.formFields.some(f => f.name === 'endDate');

    return (
        <Drawer open={!!entity} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="overflow-hidden sm:max-w-lg dark:bg-gray-925">
                <DrawerHeader>
                    <DrawerTitle>{config.editDialogTitle}</DrawerTitle>
                </DrawerHeader>

                <DrawerBody className="overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {config.formFields.map((field) => {
                            if (hasDateRange && (field.name === 'startDate' || field.name === 'endDate')) {
                                return null;
                            }
                            return renderField(field);
                        })}

                        {hasDateRange && (
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                                {config.formFields.filter(f => f.name === 'startDate' || f.name === 'endDate').map(field => {
                                    const label = user?.plan === 'pro' && field.proLabel ? field.proLabel : field.label;
                                    return (
                                        <div key={field.name}>
                                            <Label htmlFor={field.name} className="font-medium">
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

                        {'role' in (entity || {}) && (
                            <div>
                                <Label htmlFor="role" className="font-medium">
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
