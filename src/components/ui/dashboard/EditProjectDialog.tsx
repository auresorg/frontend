'use client';

import { useState, useEffect } from 'react';
import { RiGitRepositoryFill } from '@remixicon/react';

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
import { Project } from '@/lib/types';
import { Select, SelectContent, SelectItem } from '@/components/Select';
import { SelectTrigger, SelectValue } from '@/components/Select';
import { postWithTokenNextEndpoint, putWithToken, roles } from '@/lib/utils';
import { toast } from '@/lib/useToast';
import { isAxiosError } from 'axios';
import { usePresetDialog } from '@/lib/dialogs';
import { Badge } from '@/components/Badge';
import { WandSparkles } from 'lucide-react';

interface EditProjectDialogProps {
    project: Project | null;
    onClose: () => void;
    onSave: (project: Project) => void;
}

export default function EditProjectDialog({ project, onClose, onSave }: EditProjectDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        repo: '',
        tech: '',
        description: '',
        startDate: '',
        endDate: '',
        role: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const PresetDialog = usePresetDialog();

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                repo: project.repo || '',
                tech: project.tech?.join(', ') || '',
                description: project.description || '',
                startDate: project.startDate || '',
                endDate: project.endDate || '',
                role: project.role || '',
            });
        }
    }, [project]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        if (!project) return;

        const updatedProject = {
            ...project,
            ...formData,
            tech: formData.tech.split(',').map(tech => tech.trim()).filter(tech => tech),
            to: formData.endDate || undefined,
            role: formData.role as Project['role'],
        };

        try {
            const response = await putWithToken(`/projects/${project.id}`, updatedProject);
            if (response && response.status === 200) {
                toast({
                    title: 'Project updated',
                    description: `"${updatedProject.name}" has been updated successfully.`,
                    variant: 'success',
                });
                onSave(updatedProject);
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
                    setError(Object.keys(error.response.data.errors)[0]);
                }
            } else {
                PresetDialog('unexpectedError');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    let badgeText: string = '';
    let badgeType: "error" | "default" | "success" | "warning" | "neutral" | undefined = "default";

    if (formData.description.startsWith('##') && formData.description.indexOf('##', 2) > 2) {
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

    const [isGenerating, setIsGenerating] = useState(false);
    const [animatedText, setAnimatedText] = useState('');

    const [displayText, setDisplayText] = useState(formData.description);

    useEffect(() => {
        if (!isGenerating) {
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

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDisplayText(e.target.value);
        handleChange(e); // keep formData updated
    };

    const handleAIRephrase = async () => {
        setIsGenerating(true);
        const startTime = Date.now();

        let newDescription: string = formData.description;
        let newRole = formData.role;
        let shouldUpdate = false;

        try {
            const response = await postWithTokenNextEndpoint("/project/create", formData);

            // clear previous badges
            if (formData.description.startsWith("##") && formData.description.indexOf("##", 2) > 2) {
                const endIndex = formData.description.indexOf("##", 2);
                formData.description = formData.description.substring(endIndex + 2).trim();
            }

            if (response && response.status === 200) {
                const format = response.data.format;
                const role = response.data.role;

                if (format && format !== "None") {
                    newDescription = `##${format}##${formData.description}`;
                    shouldUpdate = true;
                }

                if (role && role !== "None") {
                    newRole = role;
                    shouldUpdate = true;
                }

                // **Immediately show API response in textarea**
                if (format && format !== "None") {
                    setDisplayText(formData.description); // strip badge for typing
                } else {
                    setDisplayText(newDescription);
                }
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

                    // **Update displayText to reflect API badge content**
                    setDisplayText(
                        newDescription.startsWith("##") && badgeText
                            ? newDescription.substring(newDescription.indexOf("##", 2) + 2).trim()
                            : newDescription
                    );

                    if (newRole !== formData.role) {
                        handleChange({
                            target: { name: "role", value: newRole },
                        } as React.ChangeEvent<HTMLTextAreaElement>);
                    }
                }
            };

            if (elapsed < minDuration) {
                setTimeout(finish, minDuration - elapsed);
            } else {
                finish();
            }
        }
    };

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

    return (
        <Drawer open={!!project} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="overflow-hidden sm:max-w-lg dark:bg-gray-925">
                <DrawerHeader>
                    <DrawerTitle>Edit Project</DrawerTitle>
                </DrawerHeader>

                <DrawerBody className="overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Project Name */}
                        <div>
                            <Label htmlFor="edit-name" className="font-medium">
                                Project Name <span style={{ color: "red" }}>*</span>
                            </Label>
                            <Input
                                type="text"
                                id="edit-name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter project name"
                                className="mt-2"
                                required
                                hasError={error === 'name'}
                            />
                        </div>

                        {/* Repository */}
                        <div>
                            <Label htmlFor="edit-repo" className="font-medium">
                                Repository <span style={{ color: "red" }}>*</span>
                            </Label>
                            <div className="mt-2 flex items-center">
                                <RiGitRepositoryFill className="mr-2 size-4 text-gray-400 shrink-0" />
                                <Input
                                    type="text"
                                    id="edit-repo"
                                    name="repo"
                                    value={formData.repo}
                                    onChange={handleChange}
                                    placeholder="username/repository"
                                    className="flex-1 min-w-0"
                                    required
                                    hasError={error === 'repo'}
                                />
                            </div>
                        </div>

                        {/* Technologies */}
                        <div>
                            <Label htmlFor="edit-tech" className="font-medium">
                                Technologies <span style={{ color: "red" }}>*</span>
                            </Label>
                            <Input
                                type="text"
                                id="edit-tech"
                                name="tech"
                                value={formData.tech}
                                onChange={handleChange}
                                placeholder="React, Node.js, MongoDB"
                                className="mt-2"
                                required
                                hasError={error === 'tech'}
                            />
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Separate technologies with commas
                            </p>
                        </div>

                        {/* Description */}
                        <div className="relative">
                            <Label htmlFor="edit-description" className="font-medium">
                                Description <span className="text-red-500">*</span>
                            </Label>

                            <div className="relative mt-2">
                                <Textarea
                                    id="edit-description"
                                    name="description"
                                    value={isGenerating ? animatedText : displayText}
                                    onChange={handleTextareaChange}
                                    placeholder="Describe your project..."
                                    className={`resize-vertical min-h-[100px] pr-10 text-gray-800 ${badgeText ? "pt-3" : ""
                                        } ${isGenerating
                                            ? "opacity-70 blur-[1px] transition-all duration-500"
                                            : ""
                                        }`}
                                    rows={3}
                                    required
                                    disabled={isGenerating}
                                    hasError={false}
                                />

                                {/* Badge */}
                                {badgeText && (
                                    <div className="absolute -top-3 right-4 bg-white px-2">
                                        <Badge variant={badgeType}>{badgeText}</Badge>
                                    </div>
                                )}

                                {/* Magic Wand Icon */}
                                <span
                                    onClick={handleAIRephrase}
                                    className={`absolute bottom-2 right-3 text-gray-400 cursor-pointer transition-transform ${isGenerating
                                        ? "opacity-50 pointer-events-none"
                                        : "hover:text-indigo-500"
                                        }`}
                                >
                                    <WandSparkles size={16} />
                                </span>

                                {/* AI animation overlay */}
                                {isGenerating && (
                                    <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
                                        <div className="absolute inset-0 animate-energy-sweep" />
                                        <div className="absolute inset-0 animate-glow-border rounded-md" />
                                    </div>
                                )}
                            </div>

                            <style jsx>
                                {`
                                    /* === ENERGY SWEEP (enters left → exits right) === */
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
                                        animation: energySweep 3.2s cubic-bezier(0.45, 0.1, 0.15, 1) forwards;
                                        filter: saturate(160%) brightness(1.15);
                                        mix-blend-mode: screen;
                                        border-radius: 6px;
                                        mask-image: radial-gradient(circle at 50% 50%, black 60%, transparent 100%);
                                    }

                                    /* === BORDER GLOW (breathing pulse) === */
                                    @keyframes glowBorder {
                                        0% {
                                        box-shadow: 0 0 8px rgba(0, 122, 255, 0.25),
                                            0 0 16px rgba(147, 51, 234, 0.1),
                                            inset 0 0 8px rgba(236, 72, 153, 0.08);
                                        }
                                        50% {
                                        box-shadow: 0 0 24px rgba(0, 122, 255, 0.7),
                                            0 0 36px rgba(147, 51, 234, 0.4),
                                            inset 0 0 14px rgba(236, 72, 153, 0.2);
                                        }
                                        100% {
                                        box-shadow: 0 0 8px rgba(0, 122, 255, 0.25),
                                            0 0 16px rgba(147, 51, 234, 0.1),
                                            inset 0 0 8px rgba(236, 72, 153, 0.08);
                                        }
                                    }
                                    .animate-glow-border {
                                        animation: glowBorder 2.8s ease-in-out infinite;
                                    }

                                    /* === TEXT REVEAL (after generation ends) === */
                                    @keyframes unravelReveal {
                                        0% {
                                        -webkit-mask-position: 100% 0%;
                                        mask-position: 100% 0%;
                                        }
                                        100% {
                                        -webkit-mask-position: 0% 0%;
                                        mask-position: 0% 0%;
                                        }
                                    }
                                    .animate-text-reveal {
                                        -webkit-mask-image: repeating-linear-gradient(
                                        90deg,
                                        rgba(0, 0, 0, 1) 0px,
                                        rgba(0, 0, 0, 1) 10px,
                                        rgba(0, 0, 0, 0) 14px,
                                        rgba(0, 0, 0, 0) 24px
                                        );
                                        mask-image: repeating-linear-gradient(
                                        90deg,
                                        rgba(0, 0, 0, 1) 0px,
                                        rgba(0, 0, 0, 1) 10px,
                                        rgba(0, 0, 0, 0) 14px,
                                        rgba(0, 0, 0, 0) 24px
                                        );
                                        -webkit-mask-size: 200% 100%;
                                        mask-size: 200% 100%;
                                        animation: unravelReveal 1.6s ease-out forwards;
                                    }

                                    /* === DISABLED STATE === */
                                    textarea[disabled] {
                                        cursor: progress;
                                        color: transparent !important;
                                        text-shadow: none;
                                    }
                                `}
                            </style>
                        </div>



                        {/* Date Range */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="edit-start" className="font-medium">
                                    Start Date <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Input
                                    type="date"
                                    id="edit-start"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="mt-2"
                                    required
                                    hasError={error === 'startDate'}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-end" className="font-medium">
                                    End Date
                                </Label>
                                <Input
                                    type="date"
                                    id="edit-end"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="mt-2"
                                    hasError={error === 'endDate'}
                                />
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    Leave empty if ongoing
                                </p>
                            </div>
                        </div>

                        {/* Role */}
                        <div>
                            <Label htmlFor="edit-role" className="font-medium">
                                Role <span style={{ color: "red" }}>*</span>
                            </Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, role: value }))
                                }
                            >
                                <SelectTrigger
                                    hasError={error === 'role'}
                                    id="edit-role"
                                    className="mt-2 w-full rounded-md border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-gray-900 dark:text-gray-50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700/30 focus:border-blue-500 dark:focus:border-blue-700 sm:text-sm flex items-center justify-between"
                                >
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>


                    </form>
                </DrawerBody>

                <DrawerFooter className="gap-2 bg-white dark:bg-gray-925">
                    <DrawerClose asChild>
                        <Button type="button" variant="secondary" className="w-full">
                            Cancel
                        </Button>
                    </DrawerClose>
                    <Button
                        type="submit"
                        className="w-full"
                        onClick={handleSubmit}
                        isLoading={submitting}
                    >
                        Save Changes
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}