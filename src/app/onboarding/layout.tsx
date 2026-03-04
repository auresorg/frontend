"use client"
import { Button } from "@/components/Button"
import useScroll from "@/lib/useScroll"
import { cx } from "@/lib/utils"
import { usePathname } from "next/navigation"
import React from "react"
import logo from "@/assets/images/cover.png"
import Image from "next/image"

import { useEffect, useState } from "react"
import { getWithToken } from "@/lib/utils"
import { useUserStore } from "@/store/userStore"
import { isAxiosError } from "axios"
import { usePresetDialog } from "@/lib/dialogs"
import Loading from "@/components/Loading"


interface Step {
    name: string
    href: string
}

const steps: Step[] = [
    { name: "Name", href: "/onboarding/name" },
    { name: "Portfolio", href: "/onboarding/portfolio" },
    { name: "Social", href: "/onboarding/social" },
]

interface StepProgressProps {
    steps: Step[]
}

const StepProgress = ({ steps }: StepProgressProps) => {
    const pathname = usePathname()
    const currentStepIndex = steps.findIndex((step) =>
        pathname.startsWith(step.href),
    )

    return (
        <div aria-label="Onboarding progress">
            <ol className="mx-auto flex w-24 flex-nowrap gap-1 md:w-fit">
                {steps.map((step, index) => (
                    <li
                        key={step.name}
                        className={cx(
                            "h-1 w-12 rounded-full",
                            index <= currentStepIndex
                                ? "bg-blue-500"
                                : "bg-gray-300 dark:bg-gray-700",
                        )}
                    >
                        <span className="sr-only">
                            {step.name}{" "}
                            {index < currentStepIndex
                                ? "completed"
                                : index === currentStepIndex
                                    ? "current"
                                    : ""}
                        </span>
                    </li>
                ))}
            </ol>
        </div>
    )
}

const Layout = ({
    children,
}: Readonly<{
    children: React.ReactNode
}>) => {
    const scrolled = useScroll(15)

    const user = useUserStore((state) => state.user)
    const setUser = useUserStore((state) => state.setUser)
    const PresetDialog = usePresetDialog()

    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        async function fetchUser() {
            if (!isClient) return
            if (localStorage.getItem("token") !== null && !user) {
                try {
                    const response = await getWithToken("/user")
                    if (response?.status === 200) {
                        response.data.skillCount = Object.keys(response.data.skills).length
                        setUser(response.data)
                    }
                } catch (error) {
                    if (isAxiosError(error)) {
                        if (error.response?.status === 401) {
                            localStorage.clear();
                            PresetDialog("sessionExpired")
                        } else if (error.code === "ERR_NETWORK") {
                            PresetDialog("networkError")
                        }
                    } else {
                        PresetDialog("unexpectedError")
                    }
                }
            }
        }

        fetchUser()
    }, [user, setUser, isClient, PresetDialog])

    if (!isClient) return null

    if (!user) {
        const token = localStorage.getItem("token")
        if (token) {
            return <Loading />
        } else {
            window.location.href = "/"
            return null
        }
    }


    return (
        <>
            <header
                className={cx(
                    "fixed inset-x-0 top-0 isolate z-50 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 transition-all md:grid md:grid-cols-[200px_auto_200px] md:px-6 dark:border-gray-800 dark:bg-gray-925 dark:text-white",
                    scrolled ? "h-12" : "h-20",
                )}
            >
                <div
                    className="hidden flex-nowrap items-center gap-0.5 md:flex"
                    aria-hidden="true"
                >
                    <Image
                        src={logo}
                        className="w-18 p-px text-blue-500 dark:text-blue-500"
                        aria-hidden="true" alt={""} />
                </div>
                <StepProgress steps={steps} />
                <Button variant="ghost" className="ml-auto w-fit" asChild>
                    <a href="/dashboard" >Skip to dashboard</a>
                </Button>
            </header>
            <main id="main-content" className="mx-auto mb-20 mt-28 max-w-lg">
                {children}
            </main>
        </>
    )
}

export default Layout
