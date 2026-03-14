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
                        setFormData(saved);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [open, template]);

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

        onDeploy(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base">Deploy Portfolio</DialogTitle>
                    <DialogDescription>
                        Configure your portfolio before deploying.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-gray-500">Loading configuration...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                                    defaultValue={
                                        field.type === 'array' && Array.isArray(formData[field.name])
                                            ? (formData[field.name] as string[]).join(` ${field.separator} `)
                                            : (formData[field.name] as string) || ''
                                    }
                                    placeholder={field.description}
                                />
                            </div>
                        ))}

                        <DialogFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                Continue to GitHub
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}