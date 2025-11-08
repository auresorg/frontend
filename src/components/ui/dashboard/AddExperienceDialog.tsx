'use client';

import { useState } from 'react';
import { RiCloseLine } from '@remixicon/react';
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
import { useExperienceStore } from '@/store/experienceStore';

export default function AddExperienceDialog() {
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: '',
        role: '',
    });
    const [error, setError] = useState<string | null>(null);

    const { user, editExperienceCount } = useUserStore();
    const { addExperience } = useExperienceStore();
    const PresetDialog = usePresetDialog();
    const [submitting, setSubmitting] = useState(false);

    const [open, setOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const expData = {
            ...formData,
            id: "",
        };

        try {
            const precreate = await postWithTokenNextEndpoint("/create", { ...expData, type: "experience" });
            if (!precreate || precreate.status !== 200) {
                PresetDialog("unexpectedError");
                return;
            }

            if (user?.plan == 'pro') {
                expData.description = (precreate.data.format && precreate.data.format != "None") ? `##${precreate.data.format}##${precreate.data.description}` : precreate.data.description;
            }
            expData.role = precreate.data.role ?? 'fullstack';

            const response = await postWithToken("/experiences", expData);

            if (response && response.status === 201) {
                setFormData({
                    title: '',
                    company: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                    role: '',
                });
                setOpen(false);

                addExperience(response.data);
                editExperienceCount(1, 'increment');

                toast({
                    title: "Experience Added",
                    description: "Your experience has been successfully added to the system.",
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
            title: '',
            company: '',
            startDate: '',
            endDate: '',
            description: '',
            role: '',
        });
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Experience</Button>
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
                    <DialogTitle className="text-base">Add New Experience</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col max-h-[80vh] overflow-y-auto">
                        <div className="flex-1 space-y-4 p-4 sm:p-6 sm:space-y-6">
                            {/* Title */}
                            <div>
                                <Label htmlFor="title" className="font-medium text-sm">
                                    Title <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Software Engineer"
                                    className="mt-2"
                                    required
                                    hasError={error === 'title'}
                                />
                            </div>

                            {/* Company */}
                            <div>
                                <Label htmlFor="company" className="font-medium text-sm">
                                    Company <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Input
                                    type="text"
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="e.g., SRM Labs"
                                    className="mt-2"
                                    required
                                    hasError={error === 'company'}
                                />
                            </div>

                            {/* Start Date */}
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

                            {/* End Date */}
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
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description" className="font-medium text-sm">
                                    {user?.plan === 'pro' ? "Yap about your experience!" : "Description"} <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe your responsibilities, impact, and outcomes…"
                                    className="mt-2 resize-vertical min-h-20"
                                    rows={3}
                                    required
                                    hasError={error === 'description'}
                                />
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
                                Add Experience
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
