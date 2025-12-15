import React, { useEffect, useState } from 'react'
import logo from "@/assets/images/cover.png"
import Image from 'next/image'
import { githubClientId, nextBase } from '@/lib/utils'

function Nav() {
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
    const [open, setOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    
    const [activeLink, setActiveLink] = useState("Home");

    useEffect(() => {
        setLoggedIn(localStorage.getItem("token") ? true : false)

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [])

    const navLinks = [
        { name: "Home", href: "#" },
        { name: "Features", href: "#s3" },
        { name: "Product", href: "#" },
        { name: "Checkout", href: "#" },
    ];

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, linkName: string, href: string) => {
        setActiveLink(linkName);
        setOpen(false);

        if (href === "#") {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            return;
        }

        if (href.startsWith('#')) {
            e.preventDefault();
            const element = document.getElementById(href.substring(1));
            if (element) {
                const headerOffset = 80;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        }
    };

    return <>
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm shadow-sm py-4' : 'bg-transparent py-7'}`}>
            <nav className="relative max-w-7xl w-full flex flex-wrap lg:grid lg:grid-cols-12 basis-full items-center px-4 md:px-6 lg:px-8 mx-auto">
                <div className="lg:col-span-3 flex items-center">
                    <a className="flex-none rounded-xl text-xl inline-block font-semibold focus:outline-hidden focus:opacity-80" href="#" aria-label="Aures">
                        <Image src={logo} alt="Logo" className={`transition-all duration-300 ${isScrolled ? 'w-20' : 'w-24'}`} />
                    </a>
                    <div className="ms-1 sm:ms-2"></div>
                </div>

                {/* Button Group */}
                <div className="flex items-center gap-x-1 lg:gap-x-2 ms-auto py-1 lg:ps-6 lg:order-3 lg:col-span-3 lg:justify-end">
                    <button type="button" className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium text-nowrap rounded-xl border border-transparent bg-blue-600 text-black hover:bg-blue-500 focus:outline-hidden focus:bg-blue-500 transition disabled:opacity-50 disabled:pointer-events-none text-white"
                        onClick={() => {
                            window.location.href = loggedIn ?
                                "dashboard" :
                                `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(nextBase + "/login/callback")}&scope=read:user user:email`
                        }}
                    >
                        {loggedIn ? "Dashboard" : "Get Started"}
                    </button>

                    <div className="lg:hidden">
                        <button
                            type="button"
                            onClick={() => setOpen(prev => !prev)}
                            className={`size-9.5 flex justify-center items-center text-sm font-semibold rounded-xl border transition-colors ${isScrolled ? 'border-gray-300 bg-white/50' : 'border-gray-200'} text-black hover:bg-gray-100`}
                        >
                            <svg className={`${open ? 'hidden' : 'block'} shrink-0 size-4`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
                            <svg className={`${open ? 'block' : 'hidden'} shrink-0 size-4`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out basis-full grow ${open ? 'max-h-96' : 'max-h-0'} lg:overflow-visible lg:transition-none lg:max-h-none lg:block lg:order-2 lg:col-span-6`}>
                    <div className="flex flex-col gap-y-4 gap-x-0 mt-5 lg:flex-row lg:justify-center lg:items-center lg:gap-y-0 lg:gap-x-7 lg:mt-0">
                        
                        {navLinks.map((link) => (
                            <div key={link.name}>
                                <a 
                                    href={link.href}
                                    onClick={(e) => handleNavClick(e, link.name, link.href)}
                                    className={
                                        activeLink === link.name
                                        ? "relative inline-block text-black focus:outline-hidden before:absolute before:bottom-0.5 before:start-0 before:-z-1 before:w-full before:h-1 before:bg-blue-400 dark:text-white cursor-pointer"
                                        : "inline-block text-black hover:text-gray-600 focus:outline-hidden focus:text-gray-600 dark:text-white dark:hover:text-neutral-300 dark:focus:text-neutral-300 cursor-pointer"
                                    } 
                                >
                                    {link.name}
                                </a>
                            </div>
                        ))}

                    </div>
                </div>
            </nav>
        </header>
    </>
}

export default Nav