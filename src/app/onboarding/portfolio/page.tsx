"use client"
import { Button } from "@/components/Button"
import { useUserStore } from "@/store/userStore"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"

export default function Portfolio() {
    const [portfolioLink, setPortfolioLink] = useState("")
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    const user = useUserStore((state) => state.user)
    const updateUser = useUserStore((state) => state.updateUser)

    useEffect(() => {
        if (user) {
            setPortfolioLink(user.portfolio || "")
        }
    }, [user])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setTimeout(() => {
            updateUser({ portfolio: portfolioLink.trim() })
            router.push("/onboarding/social")
        }, 200)
    }

    const isFormValid = portfolioLink.trim()

    return (
        <main className="mx-auto p-4">
            <div
                className="motion-safe:animate-revealBottom"
                style={{ animationDuration: "500ms" }}
            >
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    Share your portfolio
                </h1>
                <p className="mt-6 text-gray-700 sm:text-sm dark:text-gray-300">
                    This will help us understand your work better.
                </p>
            </div>
            <form onSubmit={handleSubmit} className="mt-4">
                <fieldset>
                    <legend className="sr-only">Enter your portfolio link</legend>
                    <div className="space-y-4">
                        <div
                            className="motion-safe:animate-revealBottom"
                            style={{
                                animationDuration: "600ms",
                                animationDelay: "100ms",
                                animationFillMode: "backwards",
                            }}
                        >
                            <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Portfolio Link
                            </label>
                            <input
                                id="portfolio"
                                type="url"
                                value={portfolioLink}
                                onChange={(e) => setPortfolioLink(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm"
                                placeholder="https://yourportfolio.com"
                            />
                        </div>
                    </div>
                </fieldset>
                <div className="mt-6 flex justify-between">
                    <Button type="button" variant="ghost" asChild>
                        <Link href="/onboarding/name">Back</Link>
                    </Button>
                    <Button
                        className="disabled:bg-gray-200 disabled:text-gray-500"
                        type="submit"
                        disabled={loading}
                        aria-disabled={loading}
                        isLoading={loading}
                    >
                        {loading ? "Submitting..." : (isFormValid ? "Continue" : "Skip")}
                    </Button>
                </div>
            </form>
        </main>
    )
}