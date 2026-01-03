"use client"

import React, { useEffect } from 'react';
import { useActivityStore } from '@/store/activityStore';
import { AreaChart } from '@/components/AreaChart';

interface ActivityData {
    date: string;
    GitHub: number;
    LeetCode: number;
}

export const Graph = () => {
    const { 
        githubContributions, 
        leetcodeSubmissions, 
        fetchGitHubContributions, 
        fetchLeetCodeSubmissions,
        githubUsername,
        leetcodeUsername,
        isLoading 
    } = useActivityStore();

    useEffect(() => {
        if (githubUsername) {
            fetchGitHubContributions();
        }
        if (leetcodeUsername) {
            fetchLeetCodeSubmissions();
        }
    }, [githubUsername, leetcodeUsername, fetchGitHubContributions, fetchLeetCodeSubmissions]);

    // Format date to short format (e.g., "Mar 15")
    const formatDateForDisplay = (dateStr: string): string => {
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        return `${month} ${day}`;
    };

    // Prepare data for the chart - show only last 10 days
    const chartData: ActivityData[] = React.useMemo(() => {
        if (githubContributions.length === 0 || leetcodeSubmissions.length === 0) {
            return [];
        }

        // Take only last 10 days (most recent)
        const recentGithub = githubContributions.slice(-10);
        const recentLeetcode = leetcodeSubmissions.slice(-10);

        // Combine datasets by date
        return recentGithub.map((githubItem, index) => ({
            date: formatDateForDisplay(githubItem.date),
            GitHub: githubItem.count,
            LeetCode: recentLeetcode[index]?.count || 0
        }));
    }, [githubContributions, leetcodeSubmissions]);

    // GitHub: emerald (green), LeetCode: amber (orange/yellow)
    const chartColors: ["emerald", "amber"] = ["emerald", "amber"];

    if (isLoading && chartData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="h-full flex items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400 text-sm">Loading activity data...</div>
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="h-full flex items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                        Set GitHub & LeetCode usernames to see activity
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Activity Overview (Last 10 Days)
            </h2>
            <div className="h-80">
                <AreaChart
                    data={chartData}
                    index="date"
                    categories={['GitHub', 'LeetCode']}
                    colors={chartColors}
                    valueFormatter={(value: number) => `${value}`}
                    showGridLines={true}
                    showXAxis={true}
                    showYAxis={true}
                    yAxisWidth={40}
                    showTooltip={true}
                    showLegend={true}
                    autoMinValue={true}
                    startEndOnly={false}
                    intervalType="preserveStartEnd"
                    enableLegendSlider={false}
                    xAxisLabel=""
                    yAxisLabel=""
                    type="default"
                    legendPosition="center"
                    fill="gradient"
                    className="h-full"
                />
            </div>
        </div>
    );
};