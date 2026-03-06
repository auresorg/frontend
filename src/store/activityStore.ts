import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GitHubContribution {
    date: string;
    count: number;
}

interface LeetCodeSubmission {
    date: string;
    count: number;
}

interface LeetCodeStats {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking?: number;
    reputation?: number;
}

interface GitHubEvent {
    created_at: string;
    [key: string]: unknown;
}

interface ActivityState {
    githubUsername: string | null;
    leetcodeUsername: string | null;
    githubContributions: GitHubContribution[];
    leetcodeSubmissions: LeetCodeSubmission[];
    leetcodeStats: LeetCodeStats | null;
    githubStreak: number;
    lastUpdated: Date | null;
    isLoading: boolean;
    error: string | null;

    setUsernames: (github: string | null, leetcode: string | null) => void;
    fetchGitHubContributions: () => Promise<void>;
    fetchLeetCodeStats: () => Promise<void>;
    fetchLeetCodeSubmissions: () => Promise<void>;
    calculateStreak: () => number;
    clearData: () => void;
}

export const useActivityStore = create<ActivityState>()(
    persist(
        (set, get) => ({
            githubUsername: null,
            leetcodeUsername: null,
            githubContributions: [],
            leetcodeSubmissions: [],
            leetcodeStats: null,
            githubStreak: 0,
            lastUpdated: null,
            isLoading: false,
            error: null,

            setUsernames: (github, leetcode) => set({
                githubUsername: github,
                leetcodeUsername: leetcode
            }),

            fetchGitHubContributions: async () => {
                const { githubUsername } = get();
                if (!githubUsername) return;

                set({ isLoading: true, error: null });

                try {

                    const htmlResponse = await fetch(
                        `https://api.codetabs.com/v1/proxy/?quest=https://github.com/users/${githubUsername}/contributions`
                    );

                    if (!htmlResponse.ok) {
                        throw new Error(`GitHub fetch error: ${htmlResponse.status}`);
                    }

                    const html = await htmlResponse.text();
                    const contributionsMap = new Map<string, number>();

                    const tenDaysAgo = new Date();
                    tenDaysAgo.setDate(tenDaysAgo.getDate() - 9);
                    for (let i = 0; i < 10; i++) {

                        const date = new Date(tenDaysAgo);
                        date.setDate(tenDaysAgo.getDate() + i);

                        const dateStr = date.toLocaleDateString('en-CA');
                        const regexString =
                            `data-date="${dateStr}"[\\s\\S]*?<tool-tip[^>]*>(.*?)<\\/tool-tip>`;
                        const regex = new RegExp(regexString);

                        const match = html.match(regex);
                        let count = 0;

                        if (match) {
                            const num = match[1].match(/(\d+) contributions?/);
                            if (num) {
                                count = Number(num[1]);
                            }
                        }
                        contributionsMap.set(dateStr, count);
                    }
                    // Fill missing days with 0
                    const contributions: GitHubContribution[] = [];
                    for (let i = 9; i >= 0; i--) {

                        const date = new Date();
                        date.setDate(date.getDate() - i);

                        const dateStr = date.toLocaleDateString('en-CA');

                        const count = contributionsMap.get(dateStr) || 0;
                        contributions.push({
                            date: dateStr,
                            count
                        });
                    }
                    set({
                        githubContributions: contributions,
                        lastUpdated: new Date(),
                        isLoading: false
                    });
                    const streak = get().calculateStreak();
                    set({ githubStreak: streak });

                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to fetch GitHub data',
                        isLoading: false
                    });

                    console.error('GitHub fetch error:', error);
                }
            },

            fetchLeetCodeStats: async () => {
                const { leetcodeUsername } = get();
                if (!leetcodeUsername) return;

                set({ isLoading: true, error: null });

                try {
                    const response = await fetch(
                        `https://leetcodeapi-oing.onrender.com/${leetcodeUsername}/solved`,
                        {
                            headers: {
                                'Accept': 'application/json',
                            },
                        }
                    );

                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorMessage = `LeetCode API error (Status: ${response.status})`;
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorMessage = errorJson.message || errorJson.error || errorMessage;
                        } catch {
                            if (errorText) errorMessage = `${errorMessage}: ${errorText}`;
                        }
                        throw new Error(errorMessage);
                    }

                    const data = await response.json();

                    const stats: LeetCodeStats = {
                        totalSolved: data.solvedProblem || 0,
                        easySolved: data.easySolved || 0,
                        mediumSolved: data.mediumSolved || 0,
                        hardSolved: data.hardSolved || 0,
                        ranking: data.ranking || 0,
                        reputation: data.reputation || 0
                    };

                    set({
                        leetcodeStats: stats,
                        lastUpdated: new Date(),
                        isLoading: false
                    });

                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to fetch LeetCode data',
                        isLoading: false
                    });
                    console.error('LeetCode fetch error:', error);
                }
            },

            fetchLeetCodeSubmissions: async () => {
                const { leetcodeUsername } = get();
                if (!leetcodeUsername) return;

                set({ isLoading: true, error: null });

                try {
                    // Using the LeetCode submissions API
                    const response = await fetch(
                        `https://leetcodeapi-oing.onrender.com/${leetcodeUsername}/calendar`,
                        {
                            headers: {
                                'Accept': 'application/json',
                            },
                        }
                    );

                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorMessage = `LeetCode API error (Status: ${response.status})`;
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorMessage = errorJson.message || errorJson.error || errorMessage;
                        } catch {
                            if (errorText) errorMessage = `${errorMessage}: ${errorText}`;
                        }
                        throw new Error(errorMessage);
                    }

                    const data = await response.json();

                    const rawCalendar = JSON.parse(data.submissionCalendar);

                    const calendar: Record<string, number> = {};

                    Object.entries(rawCalendar).forEach(([ts, count]) => {
                        const date = new Date(Number(ts) * 1000)
                            .toISOString()
                            .split("T")[0];

                        calendar[date] = count as number;
                    });

                    // The calendar API returns an object with date keys and submission counts
                    // We need to process last 30 days
                    const submissions: LeetCodeSubmission[] = [];
                    const tenDaysAgo = new Date();
                    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

                    // Fill last 30 days with data from API or 0
                    for (let i = 9; i >= 0; i--) {
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        const dateStr = date.toISOString().split('T')[0];

                        // Get submission count from API response
                        const submissionCount = calendar[dateStr] || 0;

                        submissions.push({
                            date: dateStr,
                            count: submissionCount
                        });
                    }

                    set({
                        leetcodeSubmissions: submissions,
                        lastUpdated: new Date(),
                        isLoading: false
                    });

                } catch {
                    set({
                        leetcodeSubmissions: [],
                        lastUpdated: new Date(),
                        isLoading: false
                    });
                }
            },

            calculateStreak: () => {
                const { githubContributions } = get();
                if (githubContributions.length === 0) return 0;

                let streak = 0;
                const today = new Date().toISOString().split('T')[0];

                // Check if today has contribution
                const todayContribution = githubContributions.find(c => c.date === today);
                if (todayContribution && todayContribution.count > 0) {
                    streak++;
                }

                // Count backwards until we find a day with no contributions
                for (let i = githubContributions.length - 2; i >= 0; i--) {
                    const contribution = githubContributions[i];
                    if (contribution.count > 0) {
                        streak++;
                    } else {
                        break;
                    }
                }

                return streak;
            },

            clearData: () => set({
                githubContributions: [],
                leetcodeSubmissions: [],
                leetcodeStats: null,
                githubStreak: 0,
                lastUpdated: null,
                error: null
            }),
        }),
        {
            name: 'activity-storage',
            partialize: (state) => ({
                githubContributions: state.githubContributions,
                leetcodeSubmissions: state.leetcodeSubmissions,
                leetcodeStats: state.leetcodeStats,
                githubStreak: state.githubStreak,
                lastUpdated: state.lastUpdated
            })
        }
    )
);