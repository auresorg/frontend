'use client';

import { Card } from '@/components/Card';
import { Flame } from 'lucide-react';

interface StreakCardProps {
    days: number;
}

export default function StreakCard({ days }: StreakCardProps) {
    const getStreakLevel = (daysNum: number) => {
        if (daysNum >= 30) return { level: 'Legendary', color: 'text-purple-600', bg: 'bg-purple-100' };
        if (daysNum >= 21) return { level: 'Epic', color: 'text-red-600', bg: 'bg-red-100' };
        if (daysNum >= 14) return { level: 'Strong', color: 'text-orange-600', bg: 'bg-orange-100' };
        if (daysNum >= 7) return { level: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
        return { level: 'Beginner', color: 'text-blue-600', bg: 'bg-blue-100' };
    };

    const streakLevel = getStreakLevel(days);

    return (
        <Card className="p-0!">
            <div className="px-4 py-4">
                <div className="mb-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Activity Streak
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${streakLevel.bg} ${streakLevel.color}`}>
                            {streakLevel.level}
                        </span>
                    </div>
                </div>
                
                <div className="flex justify-center mb-3">
                    <div className="relative">
                        <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
                    </div>
                </div>
                
                <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                        {days}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {days === 1 ? 'day' : 'days'}
                    </div>
                </div>
            </div>
        </Card>
    );
}