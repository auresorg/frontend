import React from 'react'

function Comparision() {
    return <>
        <div className="overflow-hidden">
            <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
                
                {/* Title */}
                <div className="mx-auto max-w-2xl mb-10 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-neutral-200">
                        Stop updating your resume manually. It's killing your progress.
                    </h2>
                </div>

                <div className="relative xl:w-10/12 xl:mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                        {/* Old Way */}
                        <div className="p-6 md:p-10 bg-white border border-gray-200 rounded-xl dark:bg-neutral-900 dark:border-neutral-800">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-neutral-200">
                                The Manual Grind
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500">
                                Why you hate updating profiles.
                            </p>

                            <ul className="mt-6 space-y-4 text-sm sm:text-base">
                                <li className="flex gap-x-3">
                                    <span className="size-5 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">✕</span>
                                    <span className="text-gray-800 dark:text-neutral-200">
                                        Updating Resume & Portfolio separately
                                    </span>
                                </li>

                                <li className="flex gap-x-3">
                                    <span className="size-5 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">✕</span>
                                    <span className="text-gray-800 dark:text-neutral-200">
                                        Switching tabs to ChatGPT constantly
                                    </span>
                                </li>

                                <li className="flex gap-x-3">
                                    <span className="size-5 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">✕</span>
                                    <span className="text-gray-800 dark:text-neutral-200">
                                        One typo means editing 3 documents
                                    </span>
                                </li>

                                <li className="flex gap-x-3">
                                    <span className="size-5 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">✕</span>
                                    <span className="text-gray-800 dark:text-neutral-200">
                                        Managing endless "Final_v2.pdf" files
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* AURES Way */}
                        <div className="p-6 md:p-10 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200 dark:bg-neutral-900 dark:border-neutral-800 dark:shadow-gray-900/20">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-neutral-200">
                                The Aures Workflow
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500">
                                One update. Everywhere instantly.
                            </p>

                            <ul className="mt-6 space-y-4 text-sm sm:text-base">
                                <li className="flex gap-x-3">
                                    <span className="size-5 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-800/30 dark:text-blue-500">✓</span>
                                    <span className="text-gray-800 dark:text-neutral-200">
                                        Add once, sync to Resume, API & Post
                                    </span>
                                </li>

                                <li className="flex gap-x-3">
                                    <span className="size-5 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-800/30 dark:text-blue-500">✓</span>
                                    <span className="text-gray-800 dark:text-neutral-200">
                                        Built-in AI writes it for you here
                                    </span>
                                </li>

                                <li className="flex gap-x-3">
                                    <span className="size-5 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-800/30 dark:text-blue-500">✓</span>
                                    <span className="text-gray-800 dark:text-neutral-200">
                                        Edit once, auto-corrects everywhere
                                    </span>
                                </li>

                                <li className="flex gap-x-3">
                                    <span className="size-5 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-800/30 dark:text-blue-500">✓</span>
                                    <span className="text-gray-800 dark:text-neutral-200">
                                        Live resumes that never go stale
                                    </span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </>
}

export default Comparision