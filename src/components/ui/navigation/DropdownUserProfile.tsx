"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSubMenu,
    DropdownMenuSubMenuContent,
    DropdownMenuSubMenuTrigger,
    DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { BaseAPI } from "@/lib/utils"
import { ArrowUpRight, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import * as React from "react"

type DropdownUserProfileProps = {
    children: React.ReactNode
    align?: "center" | "start" | "end",
    email?: string
}

export function DropdownUserProfile({
    children,
    align = "start",
    email,
}: DropdownUserProfileProps) {
    const [mounted, setMounted] = React.useState(false)
    const { theme, setTheme } = useTheme()
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
                <DropdownMenuContent
                    align={align}
                    className="min-w-[calc(var(--radix-dropdown-menu-trigger-width))]!"
                >
                    <DropdownMenuLabel>{email || "User"}</DropdownMenuLabel>
                    <DropdownMenuGroup>
                        <DropdownMenuSubMenu>
                            <DropdownMenuSubMenuTrigger>Theme</DropdownMenuSubMenuTrigger>
                            <DropdownMenuSubMenuContent>
                                <DropdownMenuRadioGroup
                                    value={theme}
                                    onValueChange={(value) => {
                                        setTheme(value)
                                    }}
                                >
                                    <DropdownMenuRadioItem
                                        aria-label="Switch to Light Mode"
                                        value="light"
                                        iconType="check"
                                    >
                                        <Sun className="size-4 shrink-0" aria-hidden="true" />
                                        Light
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        aria-label="Switch to Dark Mode"
                                        value="dark"
                                        iconType="check"
                                    >
                                        <Moon className="size-4 shrink-0" aria-hidden="true" />
                                        Dark
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem
                                        aria-label="Switch to System Mode"
                                        value="system"
                                        iconType="check"
                                    >
                                        <Monitor className="size-4 shrink-0" aria-hidden="true" />
                                        System
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubMenuContent>
                        </DropdownMenuSubMenu>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            Documentation
                            <ArrowUpRight
                                className="mb-1 ml-1 size-3 shrink-0 text-gray-500"
                                aria-hidden="true"
                            />
                        </DropdownMenuItem>
                        <Link href="/dashboard/settings" passHref>
                            <DropdownMenuItem>
                                Settings
                            </DropdownMenuItem>
                        </Link>
                        {/* <DropdownMenuItem>
              Join Slack community
              <ArrowUpRight
                className="mb-1 ml-1 size-3 shrink-0 text-gray-500"
                aria-hidden="true"
              />
            </DropdownMenuItem> */}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <button
                                className="w-full text-left"
                                onClick={async () => {
                                    try {
                                        await BaseAPI.post('/auth/logout');
                                    } catch (error) {
                                        console.warn("Logout failed on server, forcing local cleanup", error);
                                    } finally {
                                        localStorage.removeItem("token");
                                        localStorage.removeItem("user");
                                        window.location.href = "/";
                                    }
                                }}
                            >
                                Sign out
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
