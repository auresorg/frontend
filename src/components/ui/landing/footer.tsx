import { RiGithubFill, RiInstagramFill } from '@remixicon/react'
import React from 'react'

function Footer() {
    return <>
        {/* ========== FOOTER ========== */}
        <footer className="w-full max-w-[85rem] px-4 sm:px-6 lg:px-8 mx-auto">
            {/* Grid */}
            <div className="text-center">
                {/* End Col */}

                <div className="mt-3">
                    <p className="text-gray-500 dark:text-neutral-500">A project by <a className="text-blue-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-blue-500" href="https://vishok.me/" target='blank'>Vishok Manikantan</a>.</p>
                    <p className="text-gray-500 dark:text-neutral-500">
                        © 2025 Aures.
                    </p>
                </div>

                {/* Social Brands */}
                <div className="mt-3 space-x-2">
                    <a className="size-8 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent text-gray-500 hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700" href="https://github.com/auresorg" target='blank'>
                        <RiGithubFill className="size-6" />
                    </a>
                    <a className="size-8 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent text-gray-500 hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700" href="https://instagram.com/madebyaures" target='blank'>
                        <RiInstagramFill className="size-6" />
                    </a>
                    
                </div>
            </div>
            {/* End Grid */}
        </footer>
        {/* ========== END FOOTER ========== */}
    </>
}

export default Footer