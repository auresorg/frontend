'use client';

import { cx } from '@/lib/utils';
import { Card } from '@/components/Card';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';

export default function Overview() {
    const [details, setDetails] = useState<number[]>([]);
    const user = useUserStore((state) => state.user);
    useEffect(() => {
        if (user) {
            setDetails([
                user.projectsCount,
                user.skillCount,
                user.certCount,
                user.experienceCount,
            ]);
        }
    }, [user?.projectsCount, user?.skillCount, user?.certCount, user?.experienceCount, user]);

    const data = [
        {
            name: 'Projects',
            value: details[0] ?? 0,
            change: '+6.1%',
            changeType: 'positive',
            href: 'projects',
        },
        {
            name: 'Skills',
            value: details[1] ?? 0,
            change: '+3.4%',
            changeType: 'positive',
            href: 'projects',
        },
        {
            name: 'Certifications',
            value: details[2] ?? 0,
            change: '+1.1%',
            changeType: 'positive',
            href: 'certifications',
        },
        {
            name: 'Experience',
            value: details[3] ?? 0,
            change: '-0.5%',
            changeType: 'negative',
            href: 'experience',
        },
    ];

    return (
        <div className="obfuscate">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {data.map((item) => (
                    <Card key={item.name} className="!p-0">
                        <div className="px-4 py-4">
                            <dd className="flex items-start justify-between space-x-2">
                                <span className="truncate text-sm text-gray-500 dark:text-gray-500">
                                    {item.name}
                                </span>
                                <span
                                    className={cx(
                                        item.changeType === 'positive'
                                            ? 'text-emerald-700 dark:text-emerald-500'
                                            : 'text-red-700 dark:text-red-500',
                                        'text-sm font-medium',
                                    )}
                                >
                                    {item.change}
                                </span>
                            </dd>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-50">
                                {item.value}
                            </dd>
                        </div>
                        <div className="flex justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-900">
                            <Link
                                href={item.href}
                                className="text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-500 hover:dark:text-blue-600"
                            >
                                View more →
                            </Link>
                        </div>
                    </Card>
                ))}
            </dl>
        </div>
    );
}
