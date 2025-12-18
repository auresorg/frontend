"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BaseAPI } from "@/lib/utils";
import { isAxiosError } from "axios";
import { useDialog } from "@/components/ui/dialog-service";
import { useUserStore } from "@/store/userStore";
import { usePresetDialog } from "@/lib/dialogs";
import Loading from "@/components/Loading";
import { siteConfig } from "@/app/siteConfig";


import { Suspense } from "react";

function GithubCallbackInner() {
    const router = useRouter();
    const params = useSearchParams();
    const code = params.get("code");
    const [loading, setLoading] = useState(false);

    const setUser = useUserStore((state) => state.setUser);
    const PresetDialog = usePresetDialog();

    const { showDialog } = useDialog();

    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return; 
        ran.current = true;
        
        if (code && !loading) {
            setLoading(true);
            const sendCode = async () => {
                try {
                    const response = await BaseAPI.post("/auth/github", { code });
                    if (response.status === 200) {
                        const { token } = response.data;
                        localStorage.setItem("token", token);
                        response.data.user.skillCount = Object.keys(response.data.user.skills).length
                        setUser(response.data.user);
                        if (response.data.user.firstName) {
                            router.push("/dashboard");
                        } else {
                            router.push(siteConfig.baseLinks.onboarding);
                        }   
                    }
                } catch (err) {
                    if (isAxiosError(err)) {
                        if (err.response) {
                            if (err.response.status === 400) {
                                showDialog({
                                    title: "Login Failed",
                                    message: "Invalid code received. Please try logging in again.",
                                    type: "error",
                                    confirmText: "OK",
                                    onConfirm: () => { router.push("/"); },
                                    cancelText: "DONOT SHOW CANCEL",
                                });
                            } else if (err.response.status === 450) {
                                // error requesting access token from GitHub
                                showDialog({
                                    title: "Login Failed",
                                    message: "Failed to retrieve access token from GitHub. Please try logging in again.",
                                    type: "error",
                                    confirmText: "OK",
                                    onConfirm: () => { router.push("/"); },
                                    cancelText: "DONOT SHOW CANCEL",
                                });
                            } else if (err.response.status === 451) {
                                //Error parsing access token response
                                showDialog({
                                    title: "Login Failed",
                                    message: "Error parsing access token response from GitHub. Please try logging in again.",
                                    type: "error",
                                    confirmText: "OK",
                                    onConfirm: () => { router.push("/"); },
                                    cancelText: "DONOT SHOW CANCEL",
                                });
                            } else if (err.response.status === 460) {
                                // Error requesting user info (github)
                                showDialog({
                                    title: "Login Failed",
                                    message: "Failed to retrieve user info from GitHub. Please try logging in again.",
                                    type: "error",
                                    confirmText: "OK",
                                    onConfirm: () => { router.push("/"); },
                                    cancelText: "DONOT SHOW CANCEL",
                                });
                            } else if (err.response.status === 461) {
                                // Error parsing user info response (github). does the user have a public email set?
                                showDialog({
                                    title: "Login Failed",
                                    message: "Error parsing user info response from GitHub. Please ensure your email is public (in Github) and try logging in again.",
                                    type: "error",
                                    confirmText: "OK",
                                    onConfirm: () => { router.push("/"); },
                                    cancelText: "DONOT SHOW CANCEL",
                                });
                            } else {
                                showDialog({
                                    title: "Login Failed",
                                    message: `An error occurred during login (Error code: ${err.response.status}). Please try again.`,
                                    type: "error",
                                    confirmText: "OK",
                                    onConfirm: () => { router.push("/"); },
                                    cancelText: "DONOT SHOW CANCEL",
                                });
                            }
                        } else if (err.code == "ERR_NETWORK") {
                            PresetDialog("networkError");
                        } else {
                            showDialog({
                                title: "Login Failed",
                                message: "An error occurred during login. Please try again.",
                                type: "error",
                                confirmText: "OK",
                                onConfirm: () => { router.push("/"); },
                                cancelText: "DONOT SHOW CANCEL",
                            });
                        }
                    } else {
                        console.log(err);
                        PresetDialog("unexpectedError");
                    }
                } finally {
                    setLoading(false);
                }
            };
            sendCode();
        }
    }, [code, loading, router, setUser, showDialog]);

    return (
        loading ? (
            <Loading />
        ) : null
    );
}

export default function GithubCallback() {
    return (
        <Suspense fallback={<Loading />}>
            <GithubCallbackInner />
        </Suspense>
    );
}