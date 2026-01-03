'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import HealthCard from './HealthCard';
import ProjectsCard from './ProjectCard';
import StreakCard from './StreakCard';
import LeetcodeCard from './LeetcodeCard';
import { useActivityStore } from '@/store/activityStore';
import { Graph } from './Graph';
import SkillsCard from './SkillsCard'; // Import the new SkillsCard

export default function Overview() {
    const user = useUserStore((state) => state.user);

    const {
        setUsernames,
        fetchGitHubContributions,
        fetchLeetCodeStats,
        fetchLeetCodeSubmissions,
        githubStreak,
        leetcodeStats,
        isLoading
    } = useActivityStore();

    // Set usernames from user data
    useEffect(() => {
        if (user) {
            const githubUsername = user.username;
            const leetcodeUsername = user.leetcode || null;
            setUsernames(githubUsername, leetcodeUsername);
        }
    }, [user, setUsernames]);

    // Fetch activity data
    useEffect(() => {
        const fetchActivityData = async () => {
            if (!user) return;

            const { lastUpdated } = useActivityStore.getState();
            const shouldFetch = !lastUpdated ||
                (new Date().getTime() - new Date(lastUpdated).getTime() > 5 * 60 * 1000);

            if (shouldFetch) {
                try {
                    await Promise.allSettled([
                        fetchGitHubContributions(),
                        fetchLeetCodeStats(),
                        fetchLeetCodeSubmissions()
                    ]);
                } catch (error) {
                    console.error('Error fetching activity data:', error);
                }
            }
        };

        fetchActivityData();
    }, [user, fetchGitHubContributions, fetchLeetCodeStats, fetchLeetCodeSubmissions]);

    // Prepare leetcode data for card
    const leetcodeData = leetcodeStats || {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0
    };

    return (
        <div className="space-y-6">
            {/* First row: 4 Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <HealthCard />
                <StreakCard days={githubStreak} />
                <ProjectsCard
                    value={user?.projectsCount || 0}
                    change=""
                    changeType="positive"
                    href="projects"
                />
                <LeetcodeCard
                    totalSolved={leetcodeData.totalSolved}
                    easySolved={leetcodeData.easySolved}
                    mediumSolved={leetcodeData.mediumSolved}
                    hardSolved={leetcodeData.hardSolved}
                    isLoading={isLoading}
                />
            </div>

            {/* Second row: Graph in 2 columns, Skills card in 1 column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Graph />
                </div>
                <div className="lg:col-span-1">
                    <SkillsCard />
                </div>
            </div>
        </div>
    );
}