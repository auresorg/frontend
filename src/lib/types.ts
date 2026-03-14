export type User = {
    id?: string;
    firstName?: string;
    lastName?: string;
    username: string;
    email: string;
    avatarUrl: string;
    plan: 'free' | 'basic' | 'pro';
    linkedin?: string;
    portfolio?: string;
    leetcode?: string;
    phoneNumber?: string;
    skills: Record<string, number>;
    projectsCount: number;
    certCount: number;
    awardsCount: number;
    experienceCount: number;
    skillCount: number;
};

export type Project = {
    id: string;
    name: string;
    repo: string;
    tech: string[];
    description: string;
    role?: 'fullstack' | 'backend' | 'frontend' | 'devops' | 'mobile' | 'aiml' | 'product' | 'qa' | 'designer' | 'blockchain';
    startDate: string;
    endDate?: string;
    url: string;
};

export type Education = {
    id: string;
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    grade: string;
    description: string;
}

export type Certification = {
    id: string;
    title: string;
    platform: string;
    description: string;
    role?: '' | 'fullstack' | 'backend' | 'frontend' | 'devops' | 'mobile' | 'aiml' | 'product' | 'qa' | 'designer' | 'blockchain';
    url: string;
    completedOn: string;
};

export interface Award {
    id: string;
    title: string;
    issuer: string;
    type: string;
    description: string;
    date: string;
    role: string;
}

export type Experience = {
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string | null;
    description: string;
    role: string;
} & Record<string, unknown>;

export type UserExt = {
    showEmail: boolean;
    showProjects: boolean;
    showExperience: boolean;
    showCertifications: boolean;
    showEducation: boolean;
    showAwards: boolean;
}

export interface ResumeStats {
    projects: number;
    certificates: number;
    awards: number;
    experience: number;
}

export interface ResumeItem {
    role: string;
    last_compiled: string | null;
    stats: ResumeStats;
    template: string;
}
export interface Cusres {
    id: string;
    slug: string;
    dataUpdatedAt: string;
    compiledAt: string | null;
    projects: number[];
    certifications: number[];
    awards: number[];
    experiences: number[];
    stats: {
        projects: number;
        certificates: number;
        awards: number;
        experience: number;
    };
    template: string;
}

// lib/github/types.ts
export interface Template {
    id: string;
    name: string;
    description: string;
    image: string;
    repo: string;
}

export type DeploymentPlan =
    | { action: "create_repo"; username: string }
    | { action: "create_branch"; username: string }
    | { action: "overwrite_branch"; username: string };

export interface DeploymentConfig {
    username: string;
    basePath?: string;
    assetPrefix?: string;
    [key: string]: unknown;
}

export interface GithubUser {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    url: string;
    html_url: string;
    repos_url: string;
    name?: string;
    email?: string;
}

export interface GithubRepo {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    default_branch: string;
}

export interface GithubBranch {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
    protected: boolean;
}

export interface GithubTreeItem {
    path: string;
    mode: "100644" | "100755" | "040000" | "160000" | "120000";
    type: "blob" | "tree" | "commit";
    content?: string;
    sha?: string;
}

export interface GithubTree {
    sha: string;
    url: string;
    tree: GithubTreeItem[];
}

export interface GithubCommit {
    sha: string;
    node_id: string;
    url: string;
    html_url: string;
    message: string;
    tree: {
        sha: string;
        url: string;
    };
}