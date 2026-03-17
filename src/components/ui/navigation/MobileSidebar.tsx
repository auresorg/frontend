import { siteConfig } from "@/app/siteConfig"
import { Button } from "@/components/Button"
import {
    Drawer,
    DrawerBody,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/Drawer"
import { cx, focusRing } from "@/lib/utils"

import { BriefcaseBusiness, FileBadge, FileText, Flame, FolderClosed, Hammer, Menu, Trophy } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import logo from "@/assets/images/cover.png"
import { RiPagesLine } from "@remixicon/react"

const navigation = [
    { name: "Overview", href: siteConfig.baseLinks.overview, icon: Flame },
    { name: "Projects", href: siteConfig.baseLinks.projects, icon: FolderClosed },
    {
        name: "Certifications",
        href: siteConfig.baseLinks.certifications,
        icon: FileBadge,
    },
    {
        name: "Awards",
        href: siteConfig.baseLinks.awards,
        icon: Trophy,
    },
    {
        name: "Experiences",
        href: siteConfig.baseLinks.experiences,
        icon: BriefcaseBusiness,
    },
] as const

const systemNavigation = [
    { name: "Role Resumes", href: siteConfig.baseLinks.roleres, icon: FileText },
    { name: "Custom Resumes", href: siteConfig.baseLinks.cusres, icon: Hammer },
    { name: "Portfolio", href: siteConfig.baseLinks.portfolio, icon: RiPagesLine },
] as const

export default function MobileSidebar() {
    const pathname = usePathname()
    const isActive = (itemHref: string) => {
        return pathname === itemHref || pathname.startsWith(itemHref)
    }
    return (
        <>
            <Drawer>
                <DrawerTrigger asChild>
                    <Button
                        variant="ghost"
                        aria-label="open sidebar"
                        className="group flex items-center rounded-md p-1.5 text-sm font-medium hover:bg-gray-100 data-[state=open]:bg-gray-400/10 hover:dark:bg-gray-400/10"
                    >
                        <Menu className="size-6 shrink-0 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                    </Button>
                </DrawerTrigger>
                <DrawerContent className="sm:max-w-lg">
                    <DrawerHeader>
                        <DrawerTitle>
                            <Image
                                src={logo}
                                alt="Logo"
                                height={24}
                                className="object-contain ml-1"
                            />
                        </DrawerTitle>
                    </DrawerHeader>
                    <DrawerBody>
                        <nav
                            aria-label="core mobile navigation links"
                            className="flex flex-1 flex-col space-y-10"
                        >
                            <div>
                                <span
                                    className={cx(
                                        "block h-6 text-xs font-medium leading-6 text-gray-500 transition-opacity dark:text-gray-400",
                                    )}
                                >
                                    Platform
                                </span>
                                <ul role="list" className="mt-1 space-y-1.5">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <DrawerClose asChild>
                                                <Link
                                                    href={item.href}
                                                    className={cx(
                                                        isActive(item.href)
                                                            ? "text-blue-600 dark:text-blue-500"
                                                            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
                                                        "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-base font-medium transition hover:bg-gray-100 sm:text-sm hover:dark:bg-gray-900",
                                                        focusRing,
                                                    )}
                                                >
                                                    <item.icon
                                                        className="size-5 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                </Link>
                                            </DrawerClose>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <span
                                    className={cx(
                                        "block h-6 text-xs font-medium leading-6 text-gray-500 transition-opacity dark:text-gray-400",
                                    )}
                                >
                                    Artifacts
                                </span>
                                <ul role="list" className="mt-1 space-y-1.5">
                                    {systemNavigation.map((item) => (
                                        <li key={item.name}>
                                            <DrawerClose asChild>
                                                <Link
                                                    href={item.href}
                                                    className={cx(
                                                        isActive(item.href)
                                                            ? "text-blue-600 dark:text-blue-500"
                                                            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 hover:dark:text-gray-50",
                                                        "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-base font-medium transition hover:bg-gray-100 sm:text-sm hover:dark:bg-gray-900",
                                                        focusRing,
                                                    )}
                                                >
                                                    <item.icon
                                                        className="size-5 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                </Link>
                                            </DrawerClose>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </nav>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    )
}