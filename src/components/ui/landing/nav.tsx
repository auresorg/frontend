import React, { useEffect, useState, useRef } from 'react'
import logo from "@/assets/images/cover.png"
import Image from 'next/image'
import Link from 'next/link';
import { githubClientId, nextBase } from '@/lib/utils';

function Nav() {
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
    const [open, setOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const [activeLink, setActiveLink] = useState("Home");
    const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });
    const linksRef = useRef<HTMLDivElement>(null);

    const navLinks = [
        { name: "Home", href: "#s1" },
        { name: "Features", href: "#s3" },
        { name: "The Aures Way", href: "#s4" }
    ];

    useEffect(() => {
        setLoggedIn(localStorage.getItem("token") ? true : false)

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);

            let currentSection = "Home";

            navLinks.forEach((link) => {
                if (link.href === "#") return;

                const element = document.getElementById(link.href.substring(1));
                if (element) {
                    if (window.scrollY >= (element.offsetTop - 180)) {
                        currentSection = link.name;
                    }
                }
            });

            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
                currentSection = navLinks[navLinks.length - 1].name;
            }

            setActiveLink(currentSection);
        };

        window.addEventListener('scroll', handleScroll);
        setTimeout(handleScroll, 100);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!linksRef.current) return;

        const activeElement = linksRef.current.querySelector<HTMLAnchorElement>(`[data-nav-link="${activeLink}"]`);

        if (activeElement) {
            setSliderStyle({
                left: activeElement.offsetLeft,
                width: activeElement.offsetWidth,
                opacity: 1
            });
        }
    }, [activeLink, open]);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, linkName: string, href: string) => {
        setActiveLink(linkName);
        setOpen(false);

        if (href === "#" || href === "#s1") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
                </div>

                <div className="flex items-center gap-x-1 lg:gap-x-2 ms-auto py-1 lg:ps-6 lg:order-3 lg:col-span-3 lg:justify-end">
                    <Link href={`https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(nextBase + "/login/callback")}&scope=read:user user:email`}>
                        <button type="button" className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium text-nowrap rounded-xl border border-transparent bg-blue-600 hover:bg-blue-500 focus:outline-hidden focus:bg-blue-500 transition disabled:opacity-50 disabled:pointer-events-none text-white">
                            {loggedIn ? "Dashboard" : "Get Started"}
                        </button>
                    </Link>

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
                    <div
                        className="flex flex-col gap-y-4 gap-x-0 mt-5 lg:flex-row lg:justify-center lg:items-center lg:gap-y-0 lg:gap-x-7 lg:mt-0 relative"
                        ref={linksRef}
                    >
                        <span
                            className="hidden lg:block absolute bottom-0 h-1 bg-blue-400 rounded-full transition-all duration-300 ease-out z-0"
                            style={{
                                left: sliderStyle.left,
                                width: sliderStyle.width,
                                opacity: sliderStyle.opacity,
                                marginBottom: '-5px'
                            }}
                        />

                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                data-nav-link={link.name}
                                onClick={(e) => handleNavClick(e, link.name, link.href)}
                                className={`relative z-10 inline-block text-black focus:outline-hidden dark:text-white cursor-pointer transition-colors duration-200
                                    ${activeLink === link.name
                                        ? "text-black dark:text-white font-medium"
                                        : "hover:text-gray-600 dark:hover:text-neutral-300"
                                    }`}
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>
                </div>
            </nav>
        </header>
    </>
}

export default Nav