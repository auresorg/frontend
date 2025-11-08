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
import { useAwardStore } from '@/store/awardStore';

// import Tesseract
import Tesseract from 'tesseract.js';

export default function AddAwardDialog() {
    const [formData, setFormData] = useState({
        title: '',
        issuer: '',
        type: '',
        description: '',
        date: '',
    });
    const [error, setError] = useState<string | null>(null);

    const { user, editAwardCount } = useUserStore();
    const { addAward } = useAwardStore();
    const PresetDialog = usePresetDialog();
    const [submitting, setSubmitting] = useState(false);

    const [open, setOpen] = useState(false);

    const [ocrLoading, setOcrLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const awardData = {
            ...formData,
            id: "",
            role: ""
        };

        try {
            const precreate = await postWithTokenNextEndpoint("/create", { ...awardData, type: "award" });
            if (!precreate || precreate.status !== 200) {
                PresetDialog("unexpectedError");
                return;
            }

            if (user?.plan == 'pro') {
                awardData.description = (precreate.data.format && precreate.data.format != "None") ? `##${precreate.data.format}##${precreate.data.description}` : precreate.data.description;
            }
            awardData.role = precreate.data.role ?? 'fullstack';

            const response = await postWithToken("/awards", awardData);

            if (response && response.status === 201) {
                setFormData({
                    title: '',
                    issuer: '',
                    type: '',
                    description: '',
                    date: '',
                });
                setOpen(false);

                addAward(response.data);
                editAwardCount(1, 'increment');

                toast({
                    title: "Award Added",
                    description: "Your award has been successfully added to the system.",
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
            issuer: '',
            type: '',
            description: '',
            date: '',
        });
        setError(null);
    };

    // Handle OCR upload
    const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setOcrLoading(true);

        try {
            setLoadingMsg("Extracting text...");
            const imageUrl = URL.createObjectURL(file);
            const { data } = await Tesseract.recognize(imageUrl, 'eng', {
                // logger: (m: unknown) => console.log(m),
            });
            setLoadingMsg("Analyzing extracted text...");
            const response = await postWithTokenNextEndpoint("/scan", { certificate: data.text, type: "award" });
            if (response && response.status === 200) {
                const awardInfo = response.data;
                setFormData({
                    title: awardInfo.title || '',
                    issuer: awardInfo.issuer || '',
                    type: awardInfo.type || '',
                    description: awardInfo.description || '',
                    date: awardInfo.date || '',
                });
            }
            URL.revokeObjectURL(imageUrl);
            setOcrLoading(false);
        } catch (err) {
            console.error('OCR failed:', err);
            setOcrLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Award</Button>
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
                    <DialogTitle className="text-base">Add New Award</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col max-h-[80vh] overflow-y-auto">
                        <div className="flex-1 space-y-4 p-4 sm:p-6 sm:space-y-6">
                            {/* OCR Upload */}
                            <div>
                                <Label htmlFor="certificate" className="font-medium text-sm">
                                    Upload Certificate for Automatic Text Extraction (Optional)
                                </Label>
                                <Input
                                    type="file"
                                    id="certificate"
                                    name="certificate"
                                    accept="image/*,.pdf"
                                    onChange={handleOCRUpload}
                                    className="mt-2"
                                    disabled={ocrLoading}
                                />
                                {ocrLoading && (
                                    <div className="mt-3 flex justify-center items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{loadingMsg}</span>
                                    </div>
                                )}
                            </div>

                            {/* Award Title */}
                            <div>
                                <Label htmlFor="title" className="font-medium text-sm">
                                    Award Title <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter award title"
                                    className="mt-2"
                                    required
                                    hasError={error === 'title'}
                                    disabled={ocrLoading}
                                />
                            </div>

                            {/* Issuer */}
                            <div>
                                <Label htmlFor="issuer" className="font-medium text-sm">
                                    Issuer <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Input
                                    type="text"
                                    id="issuer"
                                    name="issuer"
                                    value={formData.issuer}
                                    onChange={handleChange}
                                    placeholder="e.g., Tech Innovation Summit, University Name"
                                    className="mt-2"
                                    required
                                    hasError={error === 'issuer'}
                                    disabled={ocrLoading}
                                />
                            </div>

                            {/* Award Type */}
                            <div>
                                <Label htmlFor="type" className="font-medium text-sm">
                                    Award Type <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Input
                                    type="text"
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    placeholder="e.g., first, second, third"
                                    className="mt-2"
                                    required
                                    hasError={error === 'type'}
                                    disabled={ocrLoading}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description" className="font-medium text-sm">
                                    {user?.plan === 'pro' ? "Yap about your award!" : "Description"} <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe your achievement, the competition, or what you accomplished..."
                                    className="mt-2 resize-vertical min-h-20"
                                    rows={3}
                                    required
                                    hasError={error === 'description'}
                                    disabled={ocrLoading}
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <Label htmlFor="date" className="font-medium text-sm">
                                    Date <span style={{ color: "red" }}>*</span>
                                </Label>
                                <Input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="mt-2"
                                    required
                                    hasError={error === 'date'}
                                    disabled={ocrLoading}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between border-t border-gray-200 p-4 sm:p-6 dark:border-gray-900">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" className="text-sm" onClick={clearForm} disabled={ocrLoading}>
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" className="text-sm" isLoading={submitting || ocrLoading} disabled={ocrLoading}>
                                Add Award
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
