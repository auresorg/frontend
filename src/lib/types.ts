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
    skills: Record<string, number>;
    projectsCount: number;
    certCount: number;
    awardsCount: number;
    experienceCount: number;
    skillCount : number;
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
