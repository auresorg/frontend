"use client"
import { Button } from "@/components/Button"
import { useUserStore } from "@/store/userStore"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"

export default function UserName() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [loading, setLoading] = React.useState(false)
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
        setLoading(true)
        setTimeout(() => {
            updateUser({ firstName: firstName.trim(), lastName: lastName.trim() })
            router.push("/onboarding/portfolio")
        }, 200)
    }

    const isFormValid = firstName.trim() && lastName.trim()

    return (
        <main className="mx-auto p-4">
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
                <fieldset>
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
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                First Name
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm"
                                placeholder="Enter your first name"
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
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Last Name
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm"
                                placeholder="Enter your last name"
                            />
                        </div>
                    </div>
                </fieldset>
                <div className="mt-6 flex justify-between">
                    <Button type="button" variant="ghost" disabled aria-disabled="true" className="cursor-not-allowed" > Back </Button>
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