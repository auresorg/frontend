"use client";

import { motion } from "framer-motion";
import {
    Users,
    FolderGit2,
    Briefcase,
    Award,
    GraduationCap,
    FileText,
    Activity,
    Trophy,
    LucideIcon,
} from "lucide-react";

interface StatsData {
    users: number;
    projects: number;
    experiences: number;
    certifications: number;
    awards: number;
    educations: number;
    resumes: number;
    usersList: { username: string; fullname: string }[];
    schoolsList: string[];
    certsList: string[];
    experiencesList: string[];
}

const StatCard = ({
    title,
    value,
    icon: Icon,
    delay,
    colorClass,
}: {
    title: string;
    value: number;
    icon: LucideIcon;
    delay: number;
    colorClass: string;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`relative overflow-hidden rounded-2xl p-6 bg-neutral-900 border border-neutral-800 shadow-xl group`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={120} className={colorClass} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl bg-black/50 ${colorClass}`}>
                        <Icon size={24} />
                    </div>
                    <h3 className="text-neutral-400 font-medium text-lg">{title}</h3>
                </div>

                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold tracking-tight text-white drop-shadow-md">
                        {value.toLocaleString()}
                    </span>
                    <span className="text-sm text-neutral-500 font-medium tracking-wide uppercase">
                        Total
                    </span>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </motion.div>
    );
};

export default function StatsDisplay({ stats }: { stats: StatsData }) {
    const totalEntities = stats.users + stats.projects + stats.experiences + stats.certifications + stats.awards + stats.educations + stats.resumes;

    const cards = [
        { title: "Active Users", value: stats.users, icon: Users, colorClass: "text-blue-500" },
        { title: "Projects", value: stats.projects, icon: FolderGit2, colorClass: "text-emerald-500" },
        { title: "Experiences", value: stats.experiences, icon: Briefcase, colorClass: "text-purple-500" },
        { title: "Certifications", value: stats.certifications, icon: Award, colorClass: "text-amber-500" },
        { title: "Awards", value: stats.awards, icon: Trophy, colorClass: "text-rose-500" },
        { title: "Educations", value: stats.educations, icon: GraduationCap, colorClass: "text-cyan-500" },
        { title: "Resumes", value: stats.resumes, icon: FileText, colorClass: "text-indigo-500" },
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-neutral-800 p-8 pb-24 md:p-12 lg:p-20 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-sm mb-6 text-neutral-300">
                            <Activity size={16} className="text-blue-400" />
                            <span>System Overview</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
                            Platform Statistics
                        </h1>
                        <p className="text-lg text-neutral-400">
                            Real-time metrics and aggregated data across all entities in the database.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-black border border-neutral-800 shadow-2xl flex flex-col min-w-[200px]"
                    >
                        <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">Total Records</span>
                        <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            {totalEntities.toLocaleString()}
                        </div>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {cards.map((card, index) => (
                        <StatCard
                            key={card.title}
                            title={card.title}
                            value={card.value}
                            icon={card.icon}
                            colorClass={card.colorClass}
                            delay={0.1 * index}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {/* Users List */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                            <Users className="text-blue-500" size={20} /> All Users
                        </h3>
                        <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {stats.usersList.map((user, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
                                    <span className="font-medium text-neutral-200">{user.fullname}</span>
                                    <span className="text-sm text-neutral-500">@{user.username}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Schools List */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                            <GraduationCap className="text-cyan-500" size={20} /> Schools
                        </h3>
                        <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {stats.schoolsList.map((school, i) => (
                                <div key={i} className="p-3 bg-black/50 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
                                    <span className="text-neutral-300">{school}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Certifications List */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                            <Award className="text-amber-500" size={20} /> Certifications
                        </h3>
                        <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {stats.certsList.map((cert, i) => (
                                <div key={i} className="p-3 bg-black/50 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
                                    <span className="text-neutral-300">{cert}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Experiences List */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                            <Briefcase className="text-purple-500" size={20} /> Companies
                        </h3>
                        <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {stats.experiencesList.map((company, i) => (
                                <div key={i} className="p-3 bg-black/50 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
                                    <span className="text-neutral-300">{company}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(0,0,0,0.2);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255,255,255,0.1);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255,255,255,0.2);
                    }
                `}} />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="mt-20 text-center text-sm text-neutral-600"
                >
                    <p>Data refreshed automatically on each page load | Secure Admin Dashboard</p>
                </motion.div>
            </div>
        </div>
    );
}
