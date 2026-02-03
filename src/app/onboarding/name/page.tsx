"use client"
import { Button } from "@/components/Button"
import ResumeImportCard from "@/components/ui/dashboard/ImportResume"
import { useUserStore } from "@/store/userStore"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"

export default function UserName() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)

    const router = useRouter()
    const user = useUserStore((state) => state.user)
    const updateUser = useUserStore((state) => state.updateUser)

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || "")
            setLastName(user.lastName || "")
        }
    }, [user])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (importing) return

        setLoading(true)
        setTimeout(() => {
            updateUser({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            })
            router.push("/onboarding/portfolio")
        }, 200)
    }

    const isFormValid = firstName.trim() && lastName.trim()

    return (
        <main className="mx-auto p-4">
            <ResumeImportCard
                onStatusChange={(s) => {
                    setImporting(Boolean(s && s !== "Done"))
                }}
            />

            <div
                className="motion-safe:animate-revealBottom"
                style={{ animationDuration: "500ms" }}
            >
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    How do we call you?
                </h1>
                <p className="mt-6 text-gray-700 sm:text-sm dark:text-gray-300">
                    This will help us personalize your experience.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
                <fieldset disabled={importing}>
                    <legend className="sr-only">Enter your first and last name</legend>

                    <div className="space-y-4">
                        <div
                            className="motion-safe:animate-revealBottom"
                            style={{
                                animationDuration: "600ms",
                                animationDelay: "100ms",
                                animationFillMode: "backwards",
                            }}
                        >
                            <label className="block text-sm font-medium mb-2">
                                First Name
                            </label>
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
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
                            <label className="block text-sm font-medium mb-2">
                                Last Name
                            </label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
                            />
                        </div>
                    </div>
                </fieldset>

                <div className="mt-6 flex justify-between">
                    <Button disabled>Back</Button>
                    <Button
                        type="submit"
                        disabled={!isFormValid || loading || importing}
                        isLoading={loading}
                    >
                        Continue
                    </Button>
                </div>
            </form>
        </main>
    )
}