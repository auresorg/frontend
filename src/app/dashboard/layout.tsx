"use client"
import React, { useEffect, useState } from "react"

import { cx, getWithToken } from "@/lib/utils"

import { Sidebar } from "@/components/ui/navigation/Sidebar"
import { useUserStore } from "@/store/userStore"
import { isAxiosError } from "axios"
import { usePresetDialog } from "@/lib/dialogs"
import Loading from "@/components/Loading"
import { Toaster } from "@/components/Toaster"

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed)
    }

    const user = useUserStore((state) => state.user)
    const setUser = useUserStore((state) => state.setUser)
    const PresetDialog = usePresetDialog()

    const [isClient, setIsClient] = useState(false)
    useEffect(() => { setIsClient(true) }, [])

    useEffect(() => {
        async function fetchUser() {
            if (!isClient) return
            if (localStorage.getItem('token') !== null && !user) {
                try {
                    const response = await getWithToken("/user")
                    if (response && response.status === 200) {
                        response.data.skillCount = Object.keys(response.data.skills).length
                        setUser(response.data)
                    }
                } catch (error) {
                    if (isAxiosError(error)) {
                        if (error.response?.status === 401) {
                            localStorage.removeItem("token")
                            PresetDialog("sessionExpired");
                        } else if (error.code === "ERR_NETWORK") {
                            PresetDialog("networkError");
                        }
                    } else {
                        PresetDialog("unexpectedError");
                    }
                }
            }
        }

        fetchUser()
    }, [user, setUser, isClient])

    if (!isClient) return null


    if (!user) {
        const token = localStorage.getItem('token')
        if (token) {
            return <Loading />
        } else {
            window.location.href = "/"
            return null
        }
    }

    return (
        <div className="mx-auto max-w-screen-2xl">
            <Toaster />
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
            <main
                className={cx(
                    isCollapsed ? "lg:pl-[60px]" : "lg:pl-64",
                    "ease transform-gpu transition-all duration-100 will-change-transform lg:bg-gray-50 lg:py-3 lg:pr-3 lg:dark:bg-gray-950 overflow-auto",
                )}
                style={{ height: "100vh" }}
            >
                <div className="bg-white p-4 sm:p-6 lg:rounded-lg lg:border lg:border-gray-200 dark:bg-gray-925 lg:dark:border-gray-900" style={{ height: "100%" }} >
                    {children}
                </div>
            </main>
        </div>
    )
}
