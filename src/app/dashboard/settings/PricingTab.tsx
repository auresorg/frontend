'use client';

import React, { useState } from 'react';
import { RiCheckboxCircleFill, RiLoader2Fill } from '@remixicon/react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Divider } from '@/components/Divider';
import { useUserStore } from '@/store/userStore';
import { BaseAPI, postWithToken } from '@/lib/utils';
import { toast } from '@/lib/useToast';
import { isAxiosError } from 'axios';
import Script from 'next/script';

const features = [
    //array-start
    {
        id: 1,
        name: 'Invite unlimited members',
    },
    {
        id: 2,
        name: 'Create unlimited workspaces',
    },
    {
        id: 3,
        name: '90 days of history',
    },
    {
        id: 4,
        name: '24/7 priority support',
    },
    {
        id: 5,
        name: 'Access to all enterprise plugins',
    },
    //array-end
];

export default function PricingTab() {
    const { user, updateUser } = useUserStore();
    const [loading, setLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');

    const handleCancel = () => {
        if (!user) return;
        if (cancelLoading) return;

        const confirmToast = toast({
            title: "Cancel Subscription?",
            description: "Are you sure you want to cancel your pro subscription? You'll lose access to all premium features.",
            variant: "error",
            action: {
                label: "Confirm Cancel",
                altText: "Confirm Cancel",
                onClick: async () => {
                    confirmToast.update({
                        action: {
                            altText: "Cancelling",
                            onClick: () => { },
                            label: (
                                <span className="pointer-events-none flex shrink-0 items-center justify-center gap-1.5">
                                    <RiLoader2Fill className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                                    Cancelling...
                                </span>
                            )
                        }
                    });

                    setCancelLoading(true);
                    try {
                        const res = await postWithToken('/subscription/cancel', {});
                        if (res?.status === 200) {
                            confirmToast.dismiss();
                            toast({ title: "Success", description: "Subscription cancelled successfully.", variant: "success", duration: 5000 });
                            try {
                                const { data } = await BaseAPI.post('/api/token/refresh', {});
                                localStorage.setItem('token', data.token);
                                updateUser({ ...user, plan: 'free' });
                            } catch {
                                updateUser({ ...user, plan: 'free' });
                            }
                        }
                    } catch (err) {
                        confirmToast.dismiss();
                        if (isAxiosError(err)) {
                            toast({ title: "Error", description: err.response?.data?.error || "Failed to cancel subscription", variant: "error" });
                        } else {
                            toast({ title: "Error", description: "An unexpected error occurred", variant: "error" });
                        }
                    } finally {
                        setCancelLoading(false);
                    }
                }
            }
        });
    };

    const handleSubscribe = async () => {
        if (!user) return;
        if (loading) return;

        setLoading(true);
        try {
            // 1. Ask backend to create subscription with optional coupon
            const payload = couponCode.trim() ? { coupon: couponCode.trim() } : {};
            const res = await postWithToken('/subscription/create', payload);

            if (res?.status === 200 && res.data) {
                const { subscription_id, key_id } = res.data;

                // 2. Initialize Razorpay
                const options = {
                    key: key_id,
                    subscription_id: subscription_id,
                    name: "Aures Pro",
                    description: "Professional Plan Subscription",
                    image: "/favicon.ico",
                    handler: function () {
                        toast({ title: "Success", description: "Payment successful! Pro subscription is activating.", variant: "success", duration: 5000 });

                        // Wait briefly to allow the backend webhook to mark the user as 'pro'
                        setTimeout(async () => {
                            try {
                                const { data } = await BaseAPI.post('/api/token/refresh', {});
                                localStorage.setItem('token', data.token);
                                updateUser({ ...user, plan: 'pro' });
                            } catch {
                                console.error("Failed to refresh token");
                                // Fallback optimistic update
                                updateUser({ ...user, plan: 'pro' });
                            }
                        }, 5000);
                    },
                    prefill: {
                        name: `${user.firstName} ${user.lastName}`.trim(),
                        email: user.email,
                        contact: user.phoneNumber || ''
                    },
                    theme: {
                        color: "#3b82f6" // blue-500
                    }
                };

                // @ts-expect-error Razorpay is injected globally via next/script
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response: { error: { description: string } }) {
                    toast({ title: "Payment Failed", description: response.error.description || "An error occurred", variant: "error" });
                });
                rzp.open();
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast({ title: "Error", description: err.response?.data?.error || "Failed to initiate subscription", variant: "error" });
            } else {
                toast({ title: "Error", description: "An unexpected error occurred", variant: "error" });
            }
        } finally {
            setLoading(false);
        }
    };

    const isPro = user?.plan === 'pro';

    return (
        <div className="obfuscate relative">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                        Unlock all features
                    </h3>
                    <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-500">
                        Get the full potential of your data with our enhanced features that
                        enable advanced data analytics and informed decision-making.
                    </p>
                    <div className="mt-8 space-y-6">
                        <div className="relative border-l-2 border-gray-200 pl-4 dark:border-gray-800">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                <a href="#" className="focus:outline-none">
                                    {/* Extend link to entire card */}
                                    <span className="absolute inset-0" aria-hidden={true} />
                                    Talk to Sales &#8594;
                                </a>
                            </h4>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                                Schedule a call with one of our sales representative
                            </p>
                        </div>
                        <div className="relative border-l-2 border-gray-200 pl-4 dark:border-gray-800">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                <a href="#" className="focus:outline-none">
                                    {/* Extend link to entire card */}
                                    <span className="absolute inset-0" aria-hidden={true} />
                                    Book a demo &#8594;
                                </a>
                            </h4>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                                Try out our premium features in a demo
                            </p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-start justify-between space-x-6">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                            Professional Plan Subscription
                        </h3>
                        <p className="flex items-baseline">
                            <span className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
                                ₹29
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-500">
                                /mo
                            </span>
                        </p>
                    </div>
                    <ul
                        role="list"
                        className="mt-4 text-sm text-gray-700 dark:text-gray-300"
                    >
                        {features.map((item) => (
                            <li key={item.id} className="flex items-center space-x-2 py-2.5">
                                <RiCheckboxCircleFill
                                    className="size-5 shrink-0 text-blue-500 dark:text-blue-500"
                                    aria-hidden={true}
                                />
                                <span>{item.name}</span>
                            </li>
                        ))}
                    </ul>
                    <Divider />
                    {!isPro && (
                        <div className="mb-4">
                            <Input
                                placeholder="Have a promo code?"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="w-full text-sm font-medium focus:ring-2"
                                disabled={loading}
                            />
                        </div>
                    )}
                    {isPro ? (
                        <Button
                            className="h-10 w-full"
                            variant="secondary"
                            onClick={handleCancel}
                            disabled={cancelLoading}
                        >
                            Cancel Subscription
                        </Button>
                    ) : (
                        <Button
                            className="h-10 w-full"
                            onClick={handleSubscribe}
                            isLoading={loading}
                        >
                            Upgrade
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
