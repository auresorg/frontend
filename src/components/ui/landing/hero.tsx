import React, { useState } from 'react'

export default function Hero() {
    const [playVideo, setPlayVideo] = useState(false)

    return (
        <div className="relative overflow-hidden">
            <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="max-w-2xl text-center mx-auto">
                    <h1 className="block text-3xl font-bold text-gray-800 sm:text-4xl md:text-5xl dark:text-white">
                        Your Work. Your Profile. <br />One <span className="text-blue-600">Identity.</span>
                    </h1>
                    <p className="mt-3 text-lg text-gray-800 dark:text-neutral-400">
                        Become the 10x developer and stand out among the top 1%
                    </p>
                </div>

                <div className="mt-10 relative max-w-5xl mx-auto">

    {/* Media Wrapper */}
    <div className="relative w-full h-96 sm:h-120 rounded-xl overflow-hidden">

        {!playVideo ? (
            <div className="absolute inset-0 bg-[url('https://img.youtube.com/vi/mxYFXrwfGC0/maxresdefault.jpg')] bg-no-repeat bg-center bg-cover"></div>
        ) : (
            <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/mxYFXrwfGC0?autoplay=1&controls=0&modestbranding=1&rel=0"
                title="Overview Video"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
            />
        )}

        {/* Overlay Button */}
        {!playVideo && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <button
                    onClick={() => setPlayVideo(true)}
                    className="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-full border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
                >
                    <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Play the overview
                </button>
            </div>
        )}
    </div>

    {/* Decorative Blobs (force them behind) */}
    <div className="absolute bottom-12 -start-20 -z-10 size-48 bg-linear-to-b from-orange-500 to-white p-px rounded-lg dark:to-neutral-900">
        <div className="bg-white size-48 rounded-lg dark:bg-neutral-900"></div>
    </div>

    <div className="absolute -top-12 -end-20 -z-10 size-48 bg-linear-to-t from-blue-600 to-cyan-400 p-px rounded-full">
        <div className="bg-white size-48 rounded-full dark:bg-neutral-900"></div>
    </div>

</div>

            </div>
        </div>
    )
}
