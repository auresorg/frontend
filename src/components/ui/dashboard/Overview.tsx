'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import HealthCard from './HealthCard';
import ProjectsCard from './ProjectCard';
import StreakCard from './StreakCard';
import LeetcodeCard from './LeetcodeCard';

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
            changeType: 'positive' as const,
            href: 'projects',
        },
        {
            name: 'Skills',
            value: details[1] ?? 0,
            change: '+3.4%',
            changeType: 'positive' as const,
            href: 'projects',
        },
        {
            name: 'Certifications',
            value: details[2] ?? 0,
            change: '+1.1%',
            changeType: 'positive' as const,
            href: 'certifications',
        },
        {
            name: 'Experience',
            value: details[3] ?? 0,
            change: '-0.5%',
            changeType: 'negative' as const,
            href: 'experience',
        },
    ];

    // Mock data - replace with actual data
    const streakDays = 14;
    const leetcodeStats = {
        totalSolved: 147,
        easySolved: 85,
        mediumSolved: 52,
        hardSolved: 10
    };

    return (
        <div className="obfuscate">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <HealthCard />
                <StreakCard days={streakDays} />
                <ProjectsCard 
                    value={data[0].value}
                    change={data[0].change}
                    changeType={data[0].changeType}
                    href={data[0].href}
                />
                <LeetcodeCard 
                    totalSolved={leetcodeStats.totalSolved}
                    easySolved={leetcodeStats.easySolved}
                    mediumSolved={leetcodeStats.mediumSolved}
                    hardSolved={leetcodeStats.hardSolved}
                />
            </dl>
        </div>
    );
}