'use client';

import { useState } from 'react';
import { RiGitRepositoryFill, RiCloseLine } from '@remixicon/react';
import { usePresetDialog } from "@/lib/dialogs";

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
import { postWithToken, postWithTokenNextEndpoint } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import { toast } from "@/lib/useToast";
import { isAxiosError } from 'axios';
import { useProjectStore } from '@/store/projectStore';

export default function AddProjectDialog() {
    const [formData, setFormData] = useState({
        name: '',
        repo: '',
        tech: '',
        description: '',
        startDate: '',
        endDate: '',
        role: '',
    });
    const [error, setError] = useState<string | null>(null);

    const { user, setUser, editSkills } = useUserStore();
    const { addProject } = useProjectStore();
    const PresetDialog = usePresetDialog();
    const [submitting, setSubmitting] = useState(false);

    const [open, setOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const projectData = {
            ...formData,
            tech: formData.tech.split(',').map(tech => tech.trim()).filter(tech => tech),
            endDate: formData.endDate || undefined,
            id: "",
        };

        try {
            const precreate = await postWithTokenNextEndpoint("/create/project", projectData);
            if (!precreate || precreate.status !== 200) {
                PresetDialog("unexpectedError");
                return;
            }

            if (user?.plan == 'pro') {
                projectData.description = (precreate.data.format && precreate.data.format != "None") ? `##${precreate.data.format}##${precreate.data.description}` : precreate.data.description;
                projectData.role = precreate.data.role ?? 'fullstack';
            } else {
                projectData.role = precreate.data.role ?? 'fullstack';
            }

            const response = await postWithToken("/projects", projectData);

            if (response && response.status === 201) {
                setFormData({
                    name: '',
                    repo: '',
                    tech: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    role: '',
                });
                setOpen(false);

                addProject(response.data);
                editSkills(projectData.tech, "add");
                setUser({ ...user!, projectsCount: (user?.projectsCount ?? 0) + 1 });

                toast({
                    title: "Project Added",
                    description: "Your project has been successfully added to the system.",
                    variant: "success",
                    duration: 4500,
                });
            }

        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response?.status === 400) {
                    toast({
                        title: "Error",
                        description: error.response?.data?.errors
                            ? String(Object.values(error.response.data.errors)[0])
                            : "An error occurred.",
                        variant: "error",
                        duration: 6000,
                    });
                    setError(Object.keys(error.response.data.errors)[0]);
                    return;
                } else if (error.response?.status === 401 || error.response?.status === 403) {
                    PresetDialog("unauthorized");
                }
            } else {
                PresetDialog("unexpectedError");
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

    const clearForm = () => {
        setFormData({
            name: '',
            repo: '',
            tech: '',
            description: '',
            startDate: '',
            endDate: '',
            role: '',
        });
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Project</Button>
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
                    <DialogTitle className="text-base">Add New Project</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col max-h-[80vh] overflow-y-auto">
                        <div className="flex-1 space-y-4 p-4 sm:p-6 sm:space-y-6">
                            {/* Project Name */}
                            <div>
                                <Label htmlFor="name" className="font-medium text-sm">
                                    Project Name <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Input
                                    type="text"
                                    id="name"
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
                                <Label htmlFor="repo" className="font-medium text-sm">
                                    Repository <span style={{ color: "red" }}>*</span>
                                </Label>
                                <div className="mt-2 flex items-center">
                                    <RiGitRepositoryFill className="mr-2 size-4 text-gray-400 shrink-0" />
                                    <Input
                                        type="text"
                                        id="repo"
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
                                <Label htmlFor="tech" className="font-medium text-sm">
                                    Technologies <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Input
                                    type="text"
                                    id="tech"
                                    name="tech"
                                    value={formData.tech}
                                    onChange={handleChange}
                                    placeholder="React, Node.js, MongoDB"
                                    className="mt-2"
                                    required
                                    hasError={error === 'tech'}
                                />
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    Separate with commas
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description" className="font-medium text-sm">
                                    {user?.plan === 'pro' ? "Yap about your project!" : "Description"} <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe your project..."
                                    className="mt-2 resize-vertical min-h-20"
                                    rows={3}
                                    required
                                    hasError={error === 'description'}
                                />
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="startDate" className="font-medium text-sm">
                                        Start Date <span style={{ color: "red" }}>*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="mt-2"
                                        required
                                        hasError={error === 'startDate'}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endDate" className="font-medium text-sm">
                                        End Date
                                    </Label>
                                    <Input
                                        type="date"
                                        id="endDate"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="mt-2"
                                        hasError={error === 'endDate'}
                                    />
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        Ongoing if empty
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between border-t border-gray-200 p-4 sm:p-6 dark:border-gray-900">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" className="text-sm" onClick={clearForm}>
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" className="text-sm" isLoading={submitting}>
                                Add Project
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}