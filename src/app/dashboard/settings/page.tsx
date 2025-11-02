'use client';

import { Button } from '@/components/Button';
import { Divider } from '@/components/Divider';
import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs';
import { Textarea } from '@/components/Textarea';
import { useEffect, useState } from 'react';
import type { Education } from '@/lib/types';
import { useEducationStore } from '@/store/educationStore';
import { getWithToken, putWithToken } from '@/lib/utils';
import { isAxiosError } from 'axios';
import { usePresetDialog } from '@/lib/dialogs';
import { toast } from '@/lib/useToast';

export default function Settings() {
    const { education, setEducation, updateEducation, hasLoaded, setHasLoaded } = useEducationStore();

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [educationData, setEducationData] = useState<Education>({
        id: '',
        school: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        grade: '',
        description: ''
    });

    const presetDialog = usePresetDialog();

    useEffect(() => {
        const fetchEducation = async () => {
            if (!hasLoaded) {
                try {
                    const response = await getWithToken('/education');
                    if (response && response.status === 200) {
                        const data: Education = await response.data;
                        setEducation(data);
                        setEducationData(data);
                    }
                } catch (error) {
                    if (isAxiosError(error)) {
                        if (error.response && error.response.status === 403) {
                            presetDialog('sessionExpired');
                        }
                    } else {
                        presetDialog('unexpectedError');
                    }
                } finally {
                    setHasLoaded(true);
                }
            }
        };
        fetchEducation();
    }, [setEducation, setHasLoaded, hasLoaded, presetDialog]);

    useEffect(() => {
        if (education) {
            setEducationData(education);
        }
    }, [education]);

    const handleEducationChange = (field: string, value: string) => {
        setEducationData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const response = await putWithToken('/education', educationData);
            if (response && response.status === 200) {
                updateEducation(educationData);
                toast({
                    title: 'Success',
                    description: 'Education information updated successfully.',
                    variant: 'success',
                    duration: 4000,
                }); 
            }
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response && error.response.status === 403) {
                    presetDialog('sessionExpired');
                } else if (error.response && error.response.status === 400) {
                    const e = error.response.data.errros[0];
                    const field = Object.keys(e)[0];
                    setError(field);
                    toast({
                        title: 'Error',
                        description: e[field],
                        variant: 'error',
                        duration: 5000,
                    });
                }
            } else {
                presetDialog('unexpectedError');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="obfuscate flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                General
            </h1>
            <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-500">
                Manage your personal details, education information and billing.
            </p>

            <Tabs defaultValue="account" className="mt-6">
                <TabsList variant="line" className="w-full">
                    <TabsTrigger value="account" className="flex-1">Account details</TabsTrigger>
                    <TabsTrigger value="education" className="flex-1">Education</TabsTrigger>
                    <TabsTrigger value="billing" className="flex-1">Billing</TabsTrigger>
                </TabsList>

                {/* Account Tab */}
                <TabsContent value="account" className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                        Account Information
                    </h2>
                    <p className="text-gray-500 dark:text-gray-500">
                        Hello World - Account settings will be implemented here.
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="account-name">Full Name</Label>
                            <Input id="account-name" placeholder="John Doe" className="mt-2" />
                        </div>
                        <div>
                            <Label htmlFor="account-email">Email</Label>
                            <Input id="account-email" type="email" placeholder="john@example.com" className="mt-2" />
                        </div>
                    </div>
                </TabsContent>

                {/* Education Tab - Only this content scrolls */}
                <TabsContent value="education" className="mt-6">
                    <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>

                        <div className="space-y-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="school" className="font-semibold">
                                        School/University
                                    </Label>
                                    <Input
                                        id="school"
                                        name="school"
                                        value={educationData.school}
                                        onChange={(e) => handleEducationChange('school', e.target.value)}
                                        placeholder="Enter your school or university name"
                                        className="mt-2"
                                        hasError={error === 'school'}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="degree" className="font-semibold">
                                        Degree
                                    </Label>
                                    <Input
                                        id="degree"
                                        name="degree"
                                        value={educationData.degree}
                                        onChange={(e) => handleEducationChange('degree', e.target.value)}
                                        className="mt-2"
                                        hasError={error === 'degree'}
                                        placeholder='e.g., B Tech'
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="field" className="font-semibold">
                                    Field of Study
                                </Label>
                                <Input
                                    id="field"
                                    name="field"
                                    value={educationData.field}
                                    onChange={(e) => handleEducationChange('field', e.target.value)}
                                    className="mt-2"
                                    hasError={error === 'field'}
                                    placeholder="e.g., Computer Science"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="startDate" className="font-semibold">
                                        Start Date
                                    </Label>
                                    <Input
                                        id="startDate"
                                        name="startDate"
                                        type="date"
                                        value={educationData.startDate}
                                        onChange={(e) => handleEducationChange('startDate', e.target.value)}
                                        className="mt-2"
                                        hasError={error === 'startDate'}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="endDate" className="font-semibold">
                                        End Date
                                    </Label>
                                    <Input
                                        id="endDate"
                                        name="endDate"
                                        type="date"
                                        value={educationData.endDate}
                                        onChange={(e) => handleEducationChange('endDate', e.target.value)}
                                        className="mt-2"
                                        hasError={error === 'endDate'}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="grade" className="font-semibold">
                                    Grade/GPA
                                </Label>
                                <Input
                                    id="grade"
                                    name="grade"
                                    value={educationData.grade}
                                    onChange={(e) => handleEducationChange('grade', e.target.value)}
                                    className="mt-2"
                                    placeholder="e.g., 3.8 GPA, First Class Honours"
                                    hasError={error === 'grade'}
                                />
                            </div>

                            <div>
                                <Label htmlFor="description" className="font-semibold">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={educationData.description}
                                    onChange={(e) => handleEducationChange('description', e.target.value)}
                                    className="mt-2 min-h-[100px]"
                                    placeholder="Describe your educational experience, projects, achievements..."
                                    hasError={error === 'description'}
                                />
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <Divider className="!my-6" />
                            <div className="flex items-center justify-end space-x-4">
                                <Button type="submit" onClick={handleSubmit} isLoading={submitting} disabled={JSON.stringify(education) === JSON.stringify(educationData)}>
                                    Update
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                        Billing Information
                    </h2>
                    <p className="text-gray-500 dark:text-gray-500">
                        Hello World - Billing settings will be implemented here.
                    </p>
                    <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                    Current Plan: Free
                                </p>
                                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                                    Upgrade to access premium features and enhanced capabilities.
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}