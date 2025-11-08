import { useState } from 'react';
import { postWithToken, postWithTokenNextEndpoint, putWithToken } from '@/lib/utils';
import { usePresetDialog } from "@/lib/dialogs";
import { toast } from "@/lib/useToast";
import { isAxiosError } from 'axios';
import { useUserStore } from '@/store/userStore';

type EntityType = 'award' | 'certification' | 'project' | 'experience';

interface UseEntitySubmitOptions {
    entityType: EntityType;
    endpoint: string;
    onSuccess?: (data: unknown) => void;
    onError?: (error: unknown) => void;
}

export function useEntitySubmit({ entityType, endpoint, onSuccess, onError }: UseEntitySubmitOptions) {
    const [submitting, setSubmitting] = useState(false);
    const PresetDialog = usePresetDialog();
    const { user } = useUserStore();

    const submitCreate = async (formData: Record<string, unknown>, setError: (error: string | null) => void) => {
        if (submitting) return null;
        setSubmitting(true);

        try {
            // Call AI endpoint to enhance description if needed
            const precreate = await postWithTokenNextEndpoint("/create", { ...formData, type: entityType });
            if (!precreate || precreate.status !== 200) {
                PresetDialog("unexpectedError");
                return null;
            }

            // Enhance data based on plan
            const enhancedData = { ...formData };
            
            if (user?.plan === 'pro' && precreate.data.description) {
                enhancedData.description = 
                    precreate.data.format && precreate.data.format !== "None"
                        ? `##${precreate.data.format}##${precreate.data.description}`
                        : precreate.data.description;
            }
            
            if (precreate.data.role) {
                enhancedData.role = precreate.data.role;
            }

            // Create entity
            const response = await postWithToken(endpoint, enhancedData);

            if (response && response.status === 201) {
                toast({
                    title: `${capitalize(entityType)} Added`,
                    description: `Your ${entityType} has been successfully added.`,
                    variant: "success",
                    duration: 4500,
                });
                onSuccess?.(response.data);
                return response.data;
            }

            return null;
        } catch (error) {
            handleError(error, setError);
            onError?.(error);
            return null;
        } finally {
            setSubmitting(false);
        }
    };

    const submitUpdate = async (id: string, formData: Record<string, unknown>, setError: (error: string | null) => void) => {
        if (submitting) return null;
        setSubmitting(true);

        try {
            const response = await putWithToken(`${endpoint}/${id}`, formData);
            
            if (response && response.status === 200) {
                toast({
                    title: `${capitalize(entityType)} Updated`,
                    description: `Your ${entityType} has been updated successfully.`,
                    variant: 'success',
                });
                onSuccess?.(response.data);
                return response.data;
            }

            return null;
        } catch (error) {
            handleError(error, setError);
            onError?.(error);
            return null;
        } finally {
            setSubmitting(false);
        }
    };

    const handleError = (error: unknown, setError: (error: string | null) => void) => {
        if (isAxiosError(error)) {
            if (error.response?.status === 400) {
                const errorMsg = error.response?.data?.errors
                    ? String(Object.values(error.response.data.errors)[0])
                    : "An error occurred.";
                toast({
                    title: "Error",
                    description: errorMsg,
                    variant: "error",
                    duration: 6000,
                });
                if (error.response.data.errors) {
                    setError(Object.keys(error.response.data.errors)[0]);
                }
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                PresetDialog("unauthorized");
            } else {
                PresetDialog("unexpectedError");
            }
        } else {
            PresetDialog("unexpectedError");
        }
    };

    return { submitting, submitCreate, submitUpdate };
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
