"use client"
import { Button } from "@/components/Button"
import { useDialog } from "@/components/ui/dialog-service"
import { usePresetDialog } from "@/lib/dialogs"
import { putWithToken } from "@/lib/utils"
import { useUserStore } from "@/store/userStore"
import { isAxiosError } from "axios"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"

export default function SocialProfiles() {
    const [linkedin, setLinkedin] = useState("")
    const [leetcode, setLeetcode] = useState("")
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()
    const { showDialog } = useDialog();
    const user = useUserStore((state) => state.user)
    const updateUser = useUserStore((state) => state.updateUser)
    const PresetDialog = usePresetDialog()

    useEffect(() => {
        if (user) {
            setLinkedin(user.linkedin || "")
            setLeetcode(user.leetcode || "")
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        updateUser({ linkedin: linkedin.trim(), leetcode: leetcode.trim() })

        try {
            await putWithToken("/user", {
                firstName: user?.firstName,
                lastName: user?.lastName,
                portfolio: user?.portfolio,
                linkedin: linkedin.trim(),
                leetcode: leetcode.trim(),
            });
            router.push("/dashboard")
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response?.status === 401) {
                    PresetDialog("sessionExpired");
                } else {
                    showDialog({
                        title: "Update Failed",
                        message: "An error occurred while updating your profiles. Please try again.",
                        type: "error",
                        confirmText: "OK",
                        onConfirm: () => { },
                        cancelText: "DONOT SHOW CANCEL",
                    });
                }
            } else {
                PresetDialog("unexpectedError");
            }
            setLoading(false);
            return;
        }
    }

    const isFormValid = linkedin.trim() || leetcode.trim()

    return (
        <main className="mx-auto p-4">
            <div
                className="motion-safe:animate-revealBottom"
                style={{ animationDuration: "500ms" }}
            >
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    Where can we see your work?
                </h1>
                <p className="mt-6 text-gray-700 sm:text-sm dark:text-gray-300">
                    Share your professional profiles to help us get to know you better.
                </p>
            </div>
            <form onSubmit={handleSubmit} className="mt-4">
                <fieldset>
                    <legend className="sr-only">Enter your LinkedIn and LeetCode profiles</legend>
                    <div className="space-y-4">
                        <div
                            className="motion-safe:animate-revealBottom"
                            style={{
                                animationDuration: "600ms",
                                animationDelay: "100ms",
                                animationFillMode: "backwards",
                            }}
                        >
                            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                LinkedIn Profile
                            </label>
                            <input
                                id="linkedin"
                                type="url"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm"
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>
                        <div
                            className="motion-safe:animate-revealBottom"
                            style={{
                                animationDuration: "600ms",
                                animationDelay: "150ms",
                                animationFillMode: "backwards",
                            }}
                        >
                            <label htmlFor="leetcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                LeetCode Username
                            </label>
                            <input
                                id="leetcode"
                                type="text"
                                value={leetcode}
                                onChange={(e) => setLeetcode(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm"
                                placeholder="yourusername"
                            />
                        </div>
                    </div>
                </fieldset>
                <div className="mt-6 flex justify-between">
                    <Button type="button" variant="ghost" asChild>
                        <Link href="/onboarding/social">Back</Link>
                    </Button>
                    <Button
                        className="disabled:bg-gray-200 disabled:text-gray-500"
                        type="submit"
                        disabled={!isFormValid || loading}
                        aria-disabled={!isFormValid || loading}
                        isLoading={loading}
                    >
                        {loading ? "Submitting..." : "Continue"}
                    </Button>
                </div>
            </form>
        </main>
    )
}