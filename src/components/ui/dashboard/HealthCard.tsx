'use client';

import { Card } from '@/components/Card';
import { useUserStore } from '@/store/userStore';
import { useEffect, useState } from 'react';
import { ProgressCircle } from '@/components/ProgressCircle';

export default function HealthCard() {
    const user = useUserStore((state) => state.user);
    const [healthScore, setHealthScore] = useState<number>(0);

    useEffect(() => {
        if (user) {
            const metrics = [
                { label: 'Projects', value: user.projectsCount || 0, weight: 0.25 },
                { label: 'Skills', value: user.skillCount || 0, weight: 0.25 },
                { label: 'Experience', value: user.experienceCount || 0, weight: 0.20 },
                { label: 'Certifications', value: user.certCount || 0, weight: 0.15 },
                { label: 'Awards', value: user.awardsCount || 0, weight: 0.15 },
            ];

            let score = 0;
            metrics.forEach(metric => {
                let normalizedValue = 0;
                switch(metric.label) {
                    case 'Projects':
                        normalizedValue = Math.min((metric.value / 10) * 100, 100);
                        break;
                    case 'Skills':
                        normalizedValue = Math.min((metric.value / 15) * 100, 100);
                        break;
                    case 'Experience':
                        normalizedValue = Math.min((metric.value / 5) * 100, 100);
                        break;
                    case 'Certifications':
                        normalizedValue = Math.min((metric.value / 5) * 100, 100);
                        break;
                    case 'Awards':
                        normalizedValue = Math.min((metric.value / 3) * 100, 100);
                        break;
                }
                score += normalizedValue * metric.weight;
            });

            setHealthScore(Math.round(score));
        }
    }, [user]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'default';
        if (score >= 40) return 'warning';
        return 'error';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Work';
    };

    return (
        <Card className="p-0!">
            <div className="px-4 py-4">
                <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Health Score
                    </h3>
                </div>
                
                <div className="flex justify-center mb-3">
                    <ProgressCircle 
                        value={healthScore}
                        variant={getScoreColor(healthScore) as 'success' | 'default' | 'warning' | 'error'}
                        radius={32}
                        strokeWidth={6}
                        showAnimation={true}
                    >
                        <div className="text-center">
                            <span className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                                {healthScore}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                                /100
                            </span>
                        </div>
                    </ProgressCircle>
                </div>

                <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {getScoreLabel(healthScore)}
                    </p>
                </div>
            </div>
        </Card>
    );
}