'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/Dialog';
import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { Button } from '@/components/Button';
import { fetchTemplateSchema, type ConfigField } from '@/lib/github/schema';
import type { Template } from '@/lib/types';

interface DeployDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: Template | null;
    onDeploy: (data: Record<string, string | string[]>) => void;
}

export function DeployDialog({ open, onOpenChange, template, onDeploy }: DeployDialogProps) {
    const [fields, setFields] = useState<ConfigField[]>([]);
    const [formData, setFormData] = useState<Record<string, string | string[]>>({});
    const [customDomain, setCustomDomain] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && template) {
            setLoading(true);
            fetchTemplateSchema(template.repo)
                .then(schema => {
                    if (schema) {
                        setFields(schema);
                        // Load existing data from localStorage
                        const saved: Record<string, string | string[]> = {};
                        schema.forEach(field => {
                            const stored = localStorage.getItem(field.name);
                            if (stored) {
                                try {
                                    saved[field.name] = field.type === 'array'
                                        ? JSON.parse(stored)
                                        : stored;
                                } catch {
                                    saved[field.name] = stored;
                                }
                            } else {
                                saved[field.name] = field.defaultValue || '';
                            }
                        });
                        setCustomDomain(localStorage.getItem('portfolioCustomDomain') || '');
                        setFormData(saved);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [open, template]);

    const handleInputChange = (name: string, value: string, type: 'string' | 'array' | 'text', separator?: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: type === 'array' && separator
                ? value.split(separator).map(s => s.trim()).filter(Boolean)
                : value
        }));

        if (type === 'array' && separator) {
            const arrValue = value.split(separator).map(s => s.trim()).filter(Boolean);
            localStorage.setItem(name, JSON.stringify(arrValue));
        } else {
            localStorage.setItem(name, value);
        }
    };

    const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomDomain(val);
        const normalized = val.trim();
        if (normalized) {
            localStorage.setItem('portfolioCustomDomain', normalized);
        } else {
            localStorage.removeItem('portfolioCustomDomain');
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!template) return;

        const form = new FormData(e.currentTarget);
        const data: Record<string, string | string[]> = {};

        fields.forEach(field => {
            const value = form.get(field.name) as string;

            if (field.type === 'array' && field.separator) {
                data[field.name] = value
                    .split(field.separator)
                    .map(s => s.trim())
                    .filter(Boolean);
            } else {
                data[field.name] = value;
            }

            // Save to localStorage
            if (field.type === 'array') {
                localStorage.setItem(field.name, JSON.stringify(data[field.name]));
            } else {
                localStorage.setItem(field.name, data[field.name] as string);
            }
        });

        const normalizedCustomDomain = customDomain.trim();
        if (normalizedCustomDomain) {
            data.customDomain = normalizedCustomDomain;
            localStorage.setItem('portfolioCustomDomain', normalizedCustomDomain);
        } else {
            localStorage.removeItem('portfolioCustomDomain');
        }

        onDeploy(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-base">Deploy Portfolio</DialogTitle>
                    <DialogDescription>
                        Configure your portfolio before deploying.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-gray-500">Loading configuration...</div>
                ) : (
                    <div className="overflow-y-auto pr-2 mt-4 flex-1">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {fields.map(field => (
                                <div key={field.name}>
                                    <Label htmlFor={field.name}>
                                        {field.label}
                                        {field.description && (
                                            <span className="text-xs text-gray-500 ml-2">{field.description}</span>
                                        )}
                                    </Label>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={
                                            field.type === 'array' && Array.isArray(formData[field.name])
                                                ? (formData[field.name] as string[]).join(`${field.separator || ','} `)
                                                : (formData[field.name] as string) || ''
                                        }
                                        onChange={(e) => handleInputChange(field.name, e.target.value, field.type, field.separator)}
                                        placeholder={field.description}
                                    />
                                </div>
                            ))}

                            <div>
                                <Label htmlFor="customDomain">
                                    Custom Domain
                                    <span className="text-xs text-gray-500 ml-2">Optional. Leave blank to use GitHub Pages URL.</span>
                                </Label>
                                <Input
                                    id="customDomain"
                                    name="customDomain"
                                    value={customDomain}
                                    onChange={handleCustomDomainChange}
                                    placeholder="example.com"
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    Continue to GitHub
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}