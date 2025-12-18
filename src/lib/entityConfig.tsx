import { Award, Certification, Project, Experience } from './types';

export type EntityType = 'award' | 'certification' | 'project' | 'experience';

export type Entity = Award | Certification | Project | Experience;

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'date' | 'url' | 'file';
    placeholder?: string;
    required?: boolean;
    helperText?: string;
    icon?: React.ComponentType<{ className?: string }>;
    rows?: number;
    accept?: string;
    proLabel?: string; // Label for pro users
}

export interface EntityConfig {
    type: EntityType;
    singular: string;
    plural: string;
    endpoint: string;
    addButtonText: string;
    dialogTitle: string;
    editDialogTitle: string;
    formFields: FormField[];
    tableColumns: {
        key: string;
        label: string;
        render?: (value: unknown, row: Entity) => React.ReactNode;
    }[];
    storeName: 'award' | 'certificate' | 'project' | 'experience';
}

export const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
    award: {
        type: 'award',
        singular: 'Award',
        plural: 'Awards',
        endpoint: '/awards',
        addButtonText: 'Add Award',
        dialogTitle: 'Add New Award',
        editDialogTitle: 'Edit Award',
        storeName: 'award',
        formFields: [
            {
                name: 'certificate',
                label: 'Upload Certificate for Automatic Text Extraction (Optional)',
                type: 'file',
                accept: 'image/*,.pdf',
                required: false,
            },
            {
                name: 'title',
                label: 'Award Title',
                type: 'text',
                placeholder: 'Enter award title',
                required: true,
            },
            {
                name: 'issuer',
                label: 'Issuer',
                type: 'text',
                placeholder: 'e.g., Tech Innovation Summit, University Name',
                required: true,
            },
            {
                name: 'type',
                label: 'Award Type',
                type: 'text',
                placeholder: 'e.g., first, second, third',
                required: true,
            },
            {
                name: 'description',
                label: 'Description',
                proLabel: 'Yap about your award!',
                type: 'textarea',
                placeholder: 'Describe your achievement, the competition, or what you accomplished...',
                required: true,
                rows: 3,
            },
            {
                name: 'date',
                label: 'Date',
                type: 'date',
                required: true,
            },
        ],
        tableColumns: [
            { key: 'title', label: 'Award Title' },
            { key: 'issuer', label: 'Issuer' },
            { key: 'type', label: 'Type' },
            { key: 'date', label: 'Date' },
        ],
    },
    certification: {
        type: 'certification',
        singular: 'Certificate',
        plural: 'Certificates',
        endpoint: '/certifications',
        addButtonText: 'Add Certificate',
        dialogTitle: 'Add New Certificate',
        editDialogTitle: 'Edit Certificate',
        storeName: 'certificate',
        formFields: [
            {
                name: 'title',
                label: 'Certificate Title',
                type: 'text',
                placeholder: 'Enter certificate title',
                required: true,
            },
            {
                name: 'platform',
                label: 'Platform',
                type: 'text',
                placeholder: 'e.g., Coursera, Udemy, AWS',
                required: true,
            },
            {
                name: 'url',
                label: 'Certificate URL',
                type: 'url',
                placeholder: 'https://example.com/certificate',
                required: true,
            },
            {
                name: 'description',
                label: 'Description',
                proLabel: 'Yap about your certificate!',
                type: 'textarea',
                placeholder: 'Describe what you learned or achieved...',
                required: true,
                rows: 3,
            },
            {
                name: 'completedOn',
                label: 'Completion Date',
                type: 'date',
                required: true,
            },
        ],
        tableColumns: [
            { key: 'title', label: 'Certificate Title' },
            { key: 'platform', label: 'Platform' },
            { key: 'completedOn', label: 'Completed On' },
        ],
    },
    project: {
        type: 'project',
        singular: 'Project',
        plural: 'Projects',
        endpoint: '/projects',
        addButtonText: 'Add Project',
        dialogTitle: 'Add New Project',
        editDialogTitle: 'Edit Project',
        storeName: 'project',
        formFields: [
            {
                name: 'name',
                label: 'Project Name',
                type: 'text',
                placeholder: 'Enter project name',
                required: true,
            },
            {
                name: 'repo',
                label: 'Repository',
                type: 'text',
                placeholder: 'username/repository',
                required: true,
            },
            {
                name: 'url',
                label: 'URL',
                type: 'text',
                placeholder: 'https://aures.vishok.me/',
                required: false,
            },
            {
                name: 'tech',
                label: 'Technologies',
                type: 'text',
                placeholder: 'React, Node.js, MongoDB',
                required: true,
                helperText: 'Separate with commas',
            },
            {
                name: 'description',
                label: 'Description',
                proLabel: 'Yap about your project!',
                type: 'textarea',
                placeholder: 'Describe your project...',
                required: true,
                rows: 3,
            },
            {
                name: 'startDate',
                label: 'Start Date',
                type: 'date',
                required: true,
            },
            {
                name: 'endDate',
                label: 'End Date',
                type: 'date',
                required: false,
                helperText: 'Ongoing if empty',
            },
        ],
        tableColumns: [
            { key: 'name', label: 'Project Name' },
            { key: 'repo', label: 'Repository' },
            { key: 'startDate', label: 'Start Date' },
        ],
    },
    experience: {
        type: 'experience',
        singular: 'Experience',
        plural: 'Experiences',
        endpoint: '/experiences',
        addButtonText: 'Add Experience',
        dialogTitle: 'Add New Experience',
        editDialogTitle: 'Edit Experience',
        storeName: 'experience',
        formFields: [
            {
                name: 'title',
                label: 'Job Title',
                type: 'text',
                placeholder: 'e.g., Software Engineer',
                required: true,
            },
            {
                name: 'company',
                label: 'Company',
                type: 'text',
                placeholder: 'Company name',
                required: true,
            },
            {
                name: 'description',
                label: 'Description',
                proLabel: 'Yap about your experience!',
                type: 'textarea',
                placeholder: 'Describe your responsibilities and achievements...',
                required: true,
                rows: 3,
            },
            {
                name: 'startDate',
                label: 'Start Date',
                type: 'date',
                required: true,
            },
            {
                name: 'endDate',
                label: 'End Date',
                type: 'date',
                required: false,
                helperText: 'Current if empty',
            },
        ],
        tableColumns: [
            { key: 'title', label: 'Job Title' },
            { key: 'company', label: 'Company' },
            { key: 'startDate', label: 'Start Date' },
        ],
    },
};
