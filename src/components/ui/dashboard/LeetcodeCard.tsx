'use client';

import { Card } from '@/components/Card';
import { Code } from 'lucide-react';

interface LeetcodeCardProps {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    change?: string;
    changeType?: 'positive' | 'negative';
}

export default function LeetcodeCard({ 
    totalSolved, 
    easySolved, 
    mediumSolved, 
    hardSolved,
    change = '+12.5%',
    changeType = 'positive'
}: LeetcodeCardProps) {
    const getChangeColor = (type: 'positive' | 'negative') => {
        return type === 'positive' 
            ? 'text-emerald-700 dark:text-emerald-500' 
            : 'text-red-700 dark:text-red-500';
    };

    const getDifficultyColor = (type: 'easy' | 'medium' | 'hard') => {
        switch(type) {
            case 'easy': return 'text-emerald-600 dark:text-emerald-400';
            case 'medium': return 'text-amber-600 dark:text-amber-400';
            case 'hard': return 'text-red-600 dark:text-red-400';
        }
    };

    return (
        <Card className="p-0!">
            <div className="px-4 py-4">
                <div className="mb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg mr-3">
                                <Code className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Problems Solved
                            </h3>
                        </div>
                        <span className={`text-sm font-medium ${getChangeColor(changeType)}`}>
                            {change}
                        </span>
                    </div>
                </div>
                
                <div className="mb-4">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                        {totalSolved}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total solved
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <div className="text-center">
                        <div className={`font-semibold ${getDifficultyColor('easy')}`}>
                            {easySolved}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Easy</div>
                    </div>
                    <div className="text-center">
                        <div className={`font-semibold ${getDifficultyColor('medium')}`}>
                            {mediumSolved}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Medium</div>
                    </div>
                    <div className="text-center">
                        <div className={`font-semibold ${getDifficultyColor('hard')}`}>
                            {hardSolved}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">Hard</div>
                    </div>
                </div>
            </div>
        </Card>
    );
}