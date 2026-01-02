'use client';

import { Card } from '@/components/Card';
import Link from 'next/link';
import { FolderClosed, ChevronRight } from 'lucide-react';

interface ProjectsCardProps {
    value: number;
    change: string;
    changeType: 'positive' | 'negative';
    href: string;
}

export default function ProjectsCard({ value, change, changeType, href }: ProjectsCardProps) {
    const getChangeColor = (type: 'positive' | 'negative') => {
        return type === 'positive' 
            ? 'text-emerald-700 dark:text-emerald-500' 
            : 'text-red-700 dark:text-red-500';
    };

    return (
        <Card className="p-0!">
            <div className="px-4 py-4">
                <div className="mb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-3">
                                <FolderClosed className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Projects
                            </h3>
                        </div>
                        <span className={`text-sm font-medium ${getChangeColor(changeType)}`}>
                            {change}
                        </span>
                    </div>
                </div>
                
                <div className="mb-4">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                        {value}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Portfolio projects
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Link
                        href={href}
                        className="flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-500 hover:dark:text-blue-400"
                    >
                        <span>Manage projects</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </Card>
    );
}