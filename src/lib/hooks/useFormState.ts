import { useState, useCallback } from 'react';

export function useFormState<T extends Record<string, unknown>>(initialState: T) {
    const [formData, setFormData] = useState<T>(initialState);
    const [error, setError] = useState<string | null>(null);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const updateField = useCallback((name: string, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData(initialState);
        setError(null);
    }, [initialState]);

    const setFormState = useCallback((data: Partial<T>) => {
        setFormData(prev => ({ ...prev, ...data }));
    }, []);

    return {
        formData,
        setFormData,
        setFormState,
        error,
        setError,
        handleChange,
        updateField,
        resetForm,
    };
}
