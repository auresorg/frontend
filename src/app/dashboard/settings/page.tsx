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
import { useUserStore } from '@/store/userStore'; // Import the store
import { getWithToken, putWithToken } from '@/lib/utils';
import { isAxiosError } from 'axios';
import { usePresetDialog } from '@/lib/dialogs';
import { toast } from '@/lib/useToast';

export default function Settings() {
    const { education, setEducation, updateEducation, hasLoaded, setHasLoaded } = useEducationStore();

    const { user, setUser, updateUser } = useUserStore();
    const [accountLoading, setAccountLoading] = useState(false);

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

    const [accountData, setAccountData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        linkedin: '',
        portfolio: '',
        leetcode: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (!user) {
                try {
                    const response = await getWithToken('/user');
                    if (response && response.status === 200) {
                        setUser(response.data);
                    }
                } catch (error) {
                    // reuse your existing error handling logic here
                    console.error(error);
                }
            }
        };
        fetchUser();
    }, [user, setUser]);

    useEffect(() => {
        if (user) {
            setAccountData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || '',
                email: user.email || '',
                linkedin: user.linkedin || '',
                portfolio: user.portfolio || '',
                leetcode: user.leetcode || ''
            });
        }
    }, [user]);

    const handleAccountChange = (field: string, value: string) => {
        setAccountData(prev => ({ ...prev, [field]: value }));
    };

    const handleAccountSubmit = async () => {
        if (accountLoading) return;
        setAccountLoading(true);
        try {
            // Only send editable fields
            const payload = {
                firstName: accountData.firstName,
                lastName: accountData.lastName,
                linkedin: accountData.linkedin,
                portfolio: accountData.portfolio,
                leetcode: accountData.leetcode
            };

            const response = await putWithToken('/user', payload);
            if (response && response.status === 200) {
                updateUser(payload);
                toast({
                    title: 'Success',
                    description: 'Account details updated successfully.',
                    variant: 'success',
                    duration: 4000,
                });
            }
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response?.status === 403) {
                    presetDialog('sessionExpired');
                } else {
                    toast({ title: 'Error', description: 'Failed to update account.', variant: 'error' });
                }
            }
        } finally {
            setAccountLoading(false);
        }
    };

    return (
        <div className="obfuscate flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                Settings
            </h1>
            <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-500">
                Manage your personal details, education information and billing.
            </p>

            <Tabs defaultValue="account" className="mt-6">
                <TabsList variant="line" className="w-full">
                    <TabsTrigger value="account" className="flex-1">Account</TabsTrigger>
                    <TabsTrigger value="education" className="flex-1">Education</TabsTrigger>
                    <TabsTrigger value="billing" className="flex-1">Billing</TabsTrigger>
                </TabsList>

                {/* Account Tab */}
                <TabsContent value="account" className="mt-6">
                    {/* Fixed Header Section: Title Left, Button Right */}
                    <div className="flex items-center justify-between pb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                                Account Information
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                Update your account details
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <Button
                                onClick={handleAccountSubmit}
                                isLoading={accountLoading}
                                // Disable if no changes (Basic check)
                                disabled={user ? (
                                    user.firstName === accountData.firstName &&
                                    user.lastName === accountData.lastName &&
                                    (user.linkedin || '') === accountData.linkedin &&
                                    (user.portfolio || '') === accountData.portfolio &&
                                    (user.leetcode || '') === accountData.leetcode
                                ) : true}
                            >
                                Update
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Form Section */}
                    <div
                        id="account-form-scroll-container"
                        className="overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full"
                        style={{ maxHeight: 'calc(100vh - 260px)' }}
                    >
                        <div className="space-y-6">
                            {/* Identity Section - 2 Columns */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="account-firstname">First Name</Label>
                                    <Input
                                        id="account-firstname"
                                        value={accountData.firstName}
                                        onChange={(e) => handleAccountChange('firstName', e.target.value)}
                                        placeholder="John"
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="account-lastname">Last Name</Label>
                                    <Input
                                        id="account-lastname"
                                        value={accountData.lastName}
                                        onChange={(e) => handleAccountChange('lastName', e.target.value)}
                                        placeholder="Doe"
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="account-username">Username</Label>
                                    <Input
                                        id="account-username"
                                        value={accountData.username}
                                        disabled
                                        className="mt-2 bg-gray-50 dark:bg-gray-800 text-gray-500"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="account-email">Email</Label>
                                    <Input
                                        id="account-email"
                                        type="email"
                                        value={accountData.email}
                                        disabled
                                        className="mt-2 bg-gray-50 dark:bg-gray-800 text-gray-500"
                                    />
                                </div>
                            </div>

                            <Divider />

                            {/* Links Section */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="account-portfolio">Portfolio URL</Label>
                                    <Input
                                        id="account-portfolio"
                                        type="url"
                                        value={accountData.portfolio}
                                        onChange={(e) => handleAccountChange('portfolio', e.target.value)}
                                        placeholder="https://yourportfolio.com"
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="account-linkedin">LinkedIn URL</Label>
                                    <Input
                                        id="account-linkedin"
                                        type="url"
                                        value={accountData.linkedin}
                                        onChange={(e) => handleAccountChange('linkedin', e.target.value)}
                                        placeholder="https://linkedin.com/in/yourprofile"
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="account-leetcode">Leetcode Username</Label>
                                    <Input
                                        id="account-leetcode"
                                        value={accountData.leetcode}
                                        onChange={(e) => handleAccountChange('leetcode', e.target.value)}
                                        placeholder="mvishok"
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            {/* Extra padding at bottom so scroll doesn't cut off border */}
                            <div className="pb-2"></div>
                        </div>
                    </div>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="mt-6">
                    <div className="flex items-center justify-between pb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                                Education
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                Update your educational background
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <Button
                                type="submit"
                                onClick={handleSubmit}
                                isLoading={submitting}
                                disabled={JSON.stringify(education) === JSON.stringify(educationData)}
                            >
                                Update
                            </Button>
                        </div>
                    </div>

                    <div
                        className="overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full"
                        style={{ maxHeight: 'calc(100vh - 260px)' }}
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="school">
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
                                    <Label htmlFor="degree" >
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
                                <Label htmlFor="field" >
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
                                    <Label htmlFor="startDate" >
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
                                    <Label htmlFor="endDate" >
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
                                <Label htmlFor="grade" >
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
                                <Label htmlFor="description" >
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={educationData.description}
                                    onChange={(e) => handleEducationChange('description', e.target.value)}
                                    className="mt-2 min-h-[100px]"
                                    placeholder="Describe your educational experience in a short sentence."
                                    hasError={error === 'description'}
                                />
                            </div>
                            <div className="pb-2"></div>
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