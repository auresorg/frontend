// hooks/useGithubAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/lib/useToast';
import { exchangeCodeForToken, getStoredToken, storeToken } from '@/lib/github/auth';

interface UseGithubAuthReturn {
    token: string | null;
    isLoading: boolean;
    error: Error | null;
    handleOAuthCallback: (code: string) => Promise<boolean>;
}

export function useGithubAuth(): UseGithubAuthReturn {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const stored = getStoredToken();
        if (stored) {
            setToken(stored);
        }
    }, []);

    const handleOAuthCallback = useCallback(async (code: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            console.log("Exchanging code for token...");
            const accessToken = await exchangeCodeForToken(code);

            if (!accessToken) {
                throw new Error("No access token received");
            }

            console.log("Token received, storing...");
            storeToken(accessToken);
            setToken(accessToken);

            toast({
                title: "GitHub connected",
                description: "Authentication successful",
                variant: "success",
            });

            return true;
        } catch (err) {
            console.error("Auth callback error:", err);
            const error = err instanceof Error ? err : new Error("Authentication failed");
            setError(error);

            toast({
                title: "Authentication failed",
                description: error.message,
                variant: "error",
            });

            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { token, isLoading, error, handleOAuthCallback };
}