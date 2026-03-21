'use client';

import { Button } from '@/components/Button';
import { Divider } from '@/components/Divider';
import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs';
import { Textarea } from '@/components/Textarea';
import { useEffect, useState, useRef } from 'react';
import type { Education } from '@/lib/types';
import { useEducationStore } from '@/store/educationStore';
import { useUserStore } from '@/store/userStore';
import { useUserExtStore } from '@/store/userExtStore';
import { getWithToken, putWithToken } from '@/lib/utils';
import { isAxiosError } from 'axios';
import { usePresetDialog } from '@/lib/dialogs';
import { toast } from '@/lib/useToast';
import { Switch } from '@/components/Switch';
import PricingTab from './PricingTab';

export default function Settings() {
    // --- STORES ---
    const { education, setEducation, updateEducation, hasLoaded: eduLoaded, setHasLoaded: setEduLoaded } = useEducationStore();
    const { user, setUser, updateUser } = useUserStore();
    const { ext, setExt, updateExt } = useUserExtStore();

    // --- LOCAL STATE ---
    const [educationData, setEducationData] = useState<Education>({
        id: '', school: '', degree: '', field: '', startDate: '', endDate: '', grade: '', description: ''
    });

    const [accountData, setAccountData] = useState({
        firstName: '', lastName: '', username: '', email: '', linkedin: '', portfolio: '', leetcode: '', phoneNumber: ''
    });

    const [privacyData, setPrivacyData] = useState({
        showEmail: false, showProjects: true, showExperience: true, showCertifications: true, showEducation: true, showAwards: true
    });

    const [submittingEdu, setSubmittingEdu] = useState(false);
    const [submittingAcc, setSubmittingAcc] = useState(false);
    const [submittingPriv, setSubmittingPriv] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const presetDialog = usePresetDialog();
    const fetchedUserRef = useRef(false);

    // 1. Fetch User Profile immediately (Default Tab)
    useEffect(() => {
        if (fetchedUserRef.current || user) return;
        fetchedUserRef.current = true;

        const loadUser = async () => {
            try {
                const userRes = await getWithToken('/user');
                if (userRes?.status === 200) setUser(userRes.data);
            } catch (err) {
                if (isAxiosError(err) && err.response?.status === 403) {
                    presetDialog('sessionExpired');
                } else {
                    console.error("Failed to load user data", err);
                }
            }
        };
        loadUser();
    }, [user, setUser, presetDialog]);

    // Lazy Load Handlers
    const handleTabChange = (value: string) => {
        if (value === 'education' && !eduLoaded) {
            loadEducation();
        } else if (value === 'privacy' && !ext) {
            loadPrivacy();
        }
    };

    const loadEducation = async () => {
        try {
            const eduRes = await getWithToken('/education');
            if (eduRes?.status === 200) {
                setEducation(eduRes.data);
                setEduLoaded(true);
            }
        } catch (err) {
            if (isAxiosError(err) && err.response?.status === 403) presetDialog('sessionExpired');
        }
    };

    const loadPrivacy = async () => {
        try {
            const privRes = await getWithToken('/user/privacy');
            if (privRes?.status === 200) setExt(privRes.data);
        } catch (err) {
            if (isAxiosError(err) && err.response?.status === 403) presetDialog('sessionExpired');
        }
    };

    // Sync local state
    useEffect(() => { if (education) setEducationData(education); }, [education]);

    useEffect(() => {
        if (user) {
            setAccountData({
                firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || '',
                email: user.email || '', linkedin: user.linkedin || '', portfolio: user.portfolio || '', leetcode: user.leetcode || '', phoneNumber: user.phoneNumber || ''
            });
        }
    }, [user]);

    useEffect(() => {
        if (ext) {
            setPrivacyData({
                showEmail: ext.showEmail ?? false,
                showProjects: ext.showProjects ?? true,
                showExperience: ext.showExperience ?? true,
                showCertifications: ext.showCertifications ?? true,
                showEducation: ext.showEducation ?? true,
                showAwards: ext.showAwards ?? true
            });
        }
    }, [ext]);

    const handleError = (err: unknown) => {
        if (isAxiosError(err)) {
            if (err.response?.status === 403) presetDialog('sessionExpired');
            else if (err.response?.status === 400) {
                const e = err.response.data.errors?.[0] || err.response.data.errros?.[0];
                if (e) {
                    const field = Object.keys(e)[0];
                    setError(field);
                    toast({ title: 'Error', description: e[field], variant: 'error', duration: 5000 });
                }
            } else toast({ title: 'Error', description: 'Operation failed', variant: 'error' });
        } else presetDialog('unexpectedError');
    };

    const handleAccountSubmit = async () => {
        if (submittingAcc) return;
        setSubmittingAcc(true);
        try {
            const payload = {
                firstName: accountData.firstName, lastName: accountData.lastName, linkedin: accountData.linkedin,
                portfolio: accountData.portfolio, leetcode: accountData.leetcode, phoneNumber: accountData.phoneNumber
            };
            const res = await putWithToken('/user', payload);
            if (res?.status === 200) {
                updateUser(payload);
                toast({ title: 'Success', description: 'Account updated.', variant: 'success', duration: 4000 });
            }
        } catch (err) { handleError(err); }
        finally { setSubmittingAcc(false); }
    };

    const handleEducationSubmit = async () => {
        if (submittingEdu) return;
        setSubmittingEdu(true);
        try {
            const res = await putWithToken('/education', educationData);
            if (res?.status === 200) {
                updateEducation(educationData);
                toast({ title: 'Success', description: 'Education updated.', variant: 'success', duration: 4000 });
            }
        } catch (err) { handleError(err); }
        finally { setSubmittingEdu(false); }
    };

    const handlePrivacySubmit = async () => {
        if (submittingPriv) return;
        setSubmittingPriv(true);
        try {
            const res = await putWithToken('/user/privacy', privacyData);
            if (res?.status === 200) {
                updateExt(privacyData);
                toast({ title: 'Success', description: 'Privacy settings updated.', variant: 'success', duration: 4000 });
            }
        } catch (err) { handleError(err); }
        finally { setSubmittingPriv(false); }
    };

    return (
        <div className="obfuscate flex flex-col" style={{ height: 'calc(100vh - 2rem)' }}>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Settings</h1>
            <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-500">Manage your personal details, education and privacy.</p>

            <Tabs defaultValue="account" className="mt-6" onValueChange={handleTabChange}>
                <TabsList variant="line" className="w-full overflow-x-auto overflow-y-hidden flex-nowrap hide-scrollbar">
                    <TabsTrigger value="account" className="whitespace-nowrap flex-1">Account</TabsTrigger>
                    <TabsTrigger value="education" className="whitespace-nowrap flex-1">Education</TabsTrigger>
                    <TabsTrigger value="privacy" className="whitespace-nowrap flex-1">Privacy</TabsTrigger>
                    <TabsTrigger value="pricing" className="whitespace-nowrap flex-1">
                        {user?.plan == "pro" ? "Plan" : "Upgrade"}
                    </TabsTrigger>
                </TabsList>

                {/* --- ACCOUNT TAB --- */}
                <TabsContent value="account" className="mt-6">
                    <div className="flex items-center justify-between pb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Account Information</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-500">Update your account details</p>
                        </div>
                        <div className="shrink-0">
                            <Button
                                onClick={handleAccountSubmit}
                                isLoading={submittingAcc}
                                disabled={user ? (
                                    user.firstName === accountData.firstName && user.lastName === accountData.lastName &&
                                    (user.linkedin || '') === accountData.linkedin && (user.portfolio || '') === accountData.portfolio &&
                                    (user.leetcode || '') === accountData.leetcode && (user.phoneNumber || '') === accountData.phoneNumber
                                ) : true}
                            >Update</Button>
                        </div>
                    </div>
                    <div className="overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                        {!user ? (
                            <div className="space-y-6 animate-pulse">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i}>
                                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                                            <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                                <Divider />
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i}>
                                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                                            <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div><Label htmlFor="afn">First Name</Label><Input id="afn" value={accountData.firstName} onChange={(e) => setAccountData({ ...accountData, firstName: e.target.value })} placeholder="John" className="mt-2" /></div>
                                    <div><Label htmlFor="aln">Last Name</Label><Input id="aln" value={accountData.lastName} onChange={(e) => setAccountData({ ...accountData, lastName: e.target.value })} placeholder="Doe" className="mt-2" /></div>
                                    <div><Label htmlFor="aun">Username</Label><Input id="aun" value={accountData.username} disabled className="mt-2 bg-gray-50 dark:bg-gray-800 text-gray-500" /></div>
                                    <div><Label htmlFor="aem">Email</Label><Input id="aem" type="email" value={accountData.email} disabled className="mt-2 bg-gray-50 dark:bg-gray-800 text-gray-500" /></div>
                                </div>
                                <Divider />
                                <div className="space-y-4">
                                    <div><Label htmlFor="apo">Portfolio URL</Label><Input id="apo" type="url" value={accountData.portfolio} onChange={(e) => setAccountData({ ...accountData, portfolio: e.target.value })} placeholder="https://..." className="mt-2" /></div>
                                    <div><Label htmlFor="ali">LinkedIn URL</Label><Input id="ali" type="url" value={accountData.linkedin} onChange={(e) => setAccountData({ ...accountData, linkedin: e.target.value })} placeholder="https://linkedin.com/..." className="mt-2" /></div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div><Label htmlFor="alc">Leetcode Username</Label><Input id="alc" value={accountData.leetcode} onChange={(e) => setAccountData({ ...accountData, leetcode: e.target.value })} placeholder="mvishok" className="mt-2" /></div>
                                        <div><Label htmlFor="aph">Phone Number</Label><Input id="aph" type="tel" value={accountData.phoneNumber} onChange={(e) => setAccountData({ ...accountData, phoneNumber: e.target.value })} placeholder="+91 9876543210" className="mt-2" /></div>
                                    </div>
                                </div>
                                <div className="pb-2"></div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* --- EDUCATION TAB --- */}
                <TabsContent value="education" className="mt-6">
                    <div className="flex items-center justify-between pb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Education</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-500">Update your educational background</p>
                        </div>
                        <div className="shrink-0">
                            <Button type="submit" onClick={handleEducationSubmit} isLoading={submittingEdu} disabled={JSON.stringify(education) === JSON.stringify(educationData)}>Update</Button>
                        </div>
                    </div>
                    <div className="overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                        {!eduLoaded ? (
                            <div className="space-y-6 animate-pulse">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div><div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div><div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div></div>
                                    <div><div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div><div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div></div>
                                </div>
                                <div><div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div><div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div></div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div><div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div><div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div></div>
                                    <div><div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div><div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div></div>
                                </div>
                                <div><div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div><div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div></div>
                                <div><div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div><div className="h-28 w-full bg-gray-200 dark:bg-gray-800 rounded"></div></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div><Label htmlFor="esc">School/University</Label><Input id="esc" value={educationData.school} onChange={(e) => setEducationData({ ...educationData, school: e.target.value })} placeholder="University" className="mt-2" hasError={error === 'school'} /></div>
                                    <div><Label htmlFor="edg">Degree</Label><Input id="edg" value={educationData.degree} onChange={(e) => setEducationData({ ...educationData, degree: e.target.value })} className="mt-2" hasError={error === 'degree'} placeholder='e.g. B.Tech' /></div>
                                </div>
                                <div><Label htmlFor="efd">Field of Study</Label><Input id="efd" value={educationData.field} onChange={(e) => setEducationData({ ...educationData, field: e.target.value })} className="mt-2" hasError={error === 'field'} placeholder="Computer Science" /></div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div><Label htmlFor="esd">Start Date</Label><Input id="esd" type="date" value={educationData.startDate} onChange={(e) => setEducationData({ ...educationData, startDate: e.target.value })} className="mt-2" hasError={error === 'startDate'} /></div>
                                    <div><Label htmlFor="eed">End Date</Label><Input id="eed" type="date" value={educationData.endDate} onChange={(e) => setEducationData({ ...educationData, endDate: e.target.value })} className="mt-2" hasError={error === 'endDate'} /></div>
                                </div>
                                <div><Label htmlFor="egr">Grade/GPA</Label><Input id="egr" value={educationData.grade} onChange={(e) => setEducationData({ ...educationData, grade: e.target.value })} className="mt-2" placeholder="e.g. 3.8 GPA" hasError={error === 'grade'} /></div>
                                <div><Label htmlFor="eds">Description</Label><Textarea id="eds" value={educationData.description} onChange={(e) => setEducationData({ ...educationData, description: e.target.value })} className="mt-2 min-h-[100px]" placeholder="Description..." hasError={error === 'description'} /></div>
                                <div className="pb-2"></div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* --- PRIVACY TAB --- */}
                <TabsContent value="privacy" className="mt-6">
                    <div className="flex items-center justify-between pb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Privacy & Visibility</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-500">Control what data is exposed via the API</p>
                        </div>
                        <div className="shrink-0">
                            <Button
                                onClick={handlePrivacySubmit}
                                isLoading={submittingPriv}
                                disabled={ext ? (
                                    ext.showEmail === privacyData.showEmail && ext.showProjects === privacyData.showProjects &&
                                    ext.showExperience === privacyData.showExperience && ext.showCertifications === privacyData.showCertifications &&
                                    ext.showEducation === privacyData.showEducation && ext.showAwards === privacyData.showAwards
                                ) : false}
                            >Update</Button>
                        </div>
                    </div>
                    <div className="overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                        {!ext ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900/50">
                                        <div className="flex flex-col pr-4 gap-2 w-full">
                                            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                            <div className="h-3 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        </div>
                                        <div className="h-5 w-9 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {[
                                    { id: 'showEmail', label: 'Show Email Address', sub: 'Warning: Disabling this will hide your email from public view.', warn: true },
                                    { id: 'showProjects', label: 'Show Projects', sub: 'Allow public access to your projects.' },
                                    { id: 'showExperience', label: 'Show Experience', sub: 'Display your work history.' },
                                    { id: 'showEducation', label: 'Show Education', sub: 'Display your educational background.' },
                                    { id: 'showCertifications', label: 'Show Certifications', sub: 'Showcase your certifications.' },
                                    { id: 'showAwards', label: 'Show Awards', sub: 'Highlight your achievements.' }
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900/50">
                                        <div className="flex flex-col pr-4">
                                            <span className={`font-medium ${item.warn ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>{item.label}</span>
                                            <span className={`text-sm ${item.warn ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>{item.sub}</span>
                                        </div>
                                        <Switch
                                            checked={privacyData[item.id as keyof typeof privacyData]}
                                            onCheckedChange={(checked) => setPrivacyData({ ...privacyData, [item.id]: checked })}
                                        />
                                    </div>
                                ))}
                                <div className="pb-2"></div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* --- PRICING TAB --- */}
                <TabsContent value="pricing" className="mt-6">
                    <div className="overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ maxHeight: 'calc(100vh - 160px)' }}>
                        <PricingTab />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}