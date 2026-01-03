"use client";

import { Card } from '@/components/Card';
import { useUserStore } from '@/store/userStore';
import { ProgressBar } from '@/components/ProgressBar';
import { useEffect, useState } from 'react';

interface SkillData {
    name: string;
    count: number;
    percentage: number;
}

export default function SkillsCard() {
    const user = useUserStore((state) => state.user);
    const [skills, setSkills] = useState<SkillData[]>([]);
    const [topSkill, setTopSkill] = useState<SkillData | null>(null);

    useEffect(() => {
        if (user && user.skills) {
            const skillsData = Object.entries(user.skills);
            const projectsCount = user.projectsCount || 0;

            if (skillsData.length > 0) {
                // Calculate skill usage percentage
                const processedSkills: SkillData[] = skillsData.map(([name, count]) => ({
                    name,
                    count,
                    percentage: projectsCount > 0 ? Math.round((count / projectsCount) * 100) : 0
                }));

                // Sort by count (descending)
                const sortedSkills = processedSkills.sort((a, b) => b.count - a.count);
                
                // Take top skills (up to 5 for display)
                const displaySkills = sortedSkills.slice(0, 5);
                
                // Set top skill
                setTopSkill(displaySkills[0]);
                setSkills(displaySkills);
            }
        }
    }, [user]);

    const getVariantForSkill = (index: number) => {
        const variants: ('default' | 'neutral' | 'warning' | 'error' | 'success')[] = 
            ['default', 'success', 'warning', 'neutral', 'error'];
        return variants[index % variants.length];
    };

    return (
        <Card className="h-full">
            <div className="flex flex-col h-full">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Skills Overview
                    </h3>
                    {topSkill && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Top skill: <span className="font-medium text-gray-900 dark:text-gray-100">
                                {topSkill.name}
                            </span> ({topSkill.percentage}% of projects)
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    {skills.length > 0 ? (
                        <>
                            {skills.map((skill, index) => (
                                <div key={skill.name} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {skill.name}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {skill.count} {skill.count === 1 ? 'project' : 'projects'}
                                        </span>
                                    </div>
                                    <ProgressBar
                                        value={skill.percentage}
                                        max={100}
                                        variant={getVariantForSkill(index)}
                                        showAnimation={true}
                                    />
                                </div>
                            ))}
                            
                            {Object.keys(user?.skills || {}).length > 5 && (
                                <div className="pt-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        +{Object.keys(user?.skills || {}).length - 5} more skills
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-80 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-gray-500 dark:text-gray-400">
                                    No skills added yet
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    Add skills to your profile to see them here
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}