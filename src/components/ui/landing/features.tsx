"use client";

import { RadioTower, RefreshCcw } from 'lucide-react';
import React, { useState } from 'react'
import Image from 'next/image';

function Features() {
    // We use state to track the active tab. Default is 1.
    const [activeTab, setActiveTab] = useState(1);

    return (
        <>
            {/* Note: No external script needed anymore */}
            
            <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
                <div className="relative p-6 md:p-16">
                    {/* Grid */}
                    <div className="relative z-10 lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
                        <div className="mb-10 lg:mb-0 lg:col-span-6 lg:col-start-8 lg:order-2">
                            <h2 className="text-2xl text-gray-800 font-bold sm:text-3xl dark:text-neutral-200">
                                Powered by <u>intelligence</u>, designed for impact
                            </h2>

                            {/* Tab Navs */}
                            <nav className="grid gap-4 mt-5 md:mt-10" aria-label="Tabs" role="tablist">
                                
                                {/* Button 1 */}
                                <button 
                                    type="button" 
                                    onClick={() => setActiveTab(1)}
                                    className={`text-start p-4 md:p-5 rounded-xl focus:outline-hidden transition-all duration-200
                                        ${activeTab === 1 
                                            ? 'bg-white shadow-md text-blue-600 dark:bg-neutral-700 dark:text-blue-500' 
                                            : 'hover:bg-gray-200 text-gray-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                                        }`}
                                >
                                    <span className="flex gap-x-6">
                                        <svg className={`shrink-0 mt-2 size-6 md:size-7 ${activeTab === 1 ? 'text-blue-600 dark:text-blue-500' : 'text-gray-800 dark:text-neutral-200'}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                        </svg>
                                        <span className="grow">
                                            <span className={`block text-lg font-semibold ${activeTab === 1 ? 'text-blue-600 dark:text-blue-500' : 'text-gray-800 dark:text-neutral-200'}`}>
                                                On Demand
                                            </span>
                                            <span className="block mt-1 text-gray-800 dark:text-neutral-200">
                                                Deploy role-specific or custom resumes that are instantly available at a public link.
                                            </span>
                                        </span>
                                    </span>
                                </button>

                                {/* Button 2 */}
                                <button 
                                    type="button" 
                                    onClick={() => setActiveTab(2)}
                                    className={`text-start p-4 md:p-5 rounded-xl focus:outline-hidden transition-all duration-200
                                        ${activeTab === 2 
                                            ? 'bg-white shadow-md text-blue-600 dark:bg-neutral-700 dark:text-blue-500' 
                                            : 'hover:bg-gray-200 text-gray-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                                        }`}
                                >
                                    <span className="flex gap-x-6">
                                        <RefreshCcw className={`shrink-0 mt-2 size-6 md:size-7 ${activeTab === 2 ? 'text-blue-600 dark:text-blue-500' : 'text-gray-800 dark:text-neutral-200'}`} />
                                        <span className="grow">
                                            <span className={`block text-lg font-semibold ${activeTab === 2 ? 'text-blue-600 dark:text-blue-500' : 'text-gray-800 dark:text-neutral-200'}`}>
                                                Zero Rework
                                            </span>
                                            <span className="block mt-1 text-gray-800 dark:text-neutral-200">
                                                Edit your work once, update everything automatically without rewriting.
                                            </span>
                                        </span>
                                    </span>
                                </button>

                                {/* Button 3 */}
                                <button 
                                    type="button" 
                                    onClick={() => setActiveTab(3)}
                                    className={`text-start p-4 md:p-5 rounded-xl focus:outline-hidden transition-all duration-200
                                        ${activeTab === 3 
                                            ? 'bg-white shadow-md text-blue-600 dark:bg-neutral-700 dark:text-blue-500' 
                                            : 'hover:bg-gray-200 text-gray-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                                        }`}
                                >
                                    <span className="flex gap-x-6">
                                        <RadioTower className={`shrink-0 mt-2 size-6 md:size-7 ${activeTab === 3 ? 'text-blue-600 dark:text-blue-500' : 'text-gray-800 dark:text-neutral-200'}`} xmlns="http://www.w3.org/2000/svg" />
                                        <span className="grow">
                                            <span className={`block text-lg font-semibold ${activeTab === 3 ? 'text-blue-600 dark:text-blue-500' : 'text-gray-800 dark:text-neutral-200'}`}>
                                                One Identity
                                            </span>
                                            <span className="block mt-1 text-gray-800 dark:text-neutral-200">
                                                The same data powers resumes, portfolio updates, LinkedIn posts, and APIs and you never have to copy details again.
                                            </span>
                                        </span>
                                    </span>
                                </button>
                            </nav>
                            {/* End Tab Navs */}
                        </div>
                        {/* End Col */}

                        <div className="lg:col-span-6">
                            <div className="relative">
                                {/* Tab Content */}
                                <div>
                                    <div className={`${activeTab === 1 ? 'block' : 'hidden'}`}>
                                        <Image className="shadow-xl shadow-gray-200 rounded-xl dark:shadow-gray-900/20" src="https://images.unsplash.com/photo-1605629921711-2f6b00c6bbf4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=560&h=720&q=80" alt="Features Image" width={560} height={720} />
                                    </div>

                                    <div className={`${activeTab === 2 ? 'block' : 'hidden'}`}>
                                        <Image className="shadow-xl shadow-gray-200 rounded-xl dark:shadow-gray-900/20" src="https://images.unsplash.com/photo-1665686306574-1ace09918530?ixlib=rb-4.0.3&ixid=MnwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=560&h=720&q=80" alt="Features Image" width={560} height={720} />
                                    </div>

                                    <div className={`${activeTab === 3 ? 'block' : 'hidden'}`}>
                                        <Image className="shadow-xl shadow-gray-200 rounded-xl dark:shadow-gray-900/20" src="https://images.unsplash.com/photo-1598929213452-52d72f63e307?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=560&h=720&q=80" alt="Features Image" width={560} height={720} />
                                    </div>
                                </div>
                                {/* End Tab Content */}

                                {/* SVG Element */}
                                <div className="hidden absolute top-0 end-0 translate-x-20 md:block lg:translate-x-20">
                                    <svg className="w-16 h-auto text-orange-500" width="121" height="135" viewBox="0 0 121 135" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 16.4754C11.7688 27.4499 21.2452 57.3224 5 89.0164" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
                                        <path d="M33.6761 112.104C44.6984 98.1239 74.2618 57.6776 83.4821 5" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
                                        <path d="M50.5525 130C68.2064 127.495 110.731 117.541 116 78.0874" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
                                    </svg>
                                </div>
                                {/* End SVG Element */}
                            </div>
                        </div>
                        {/* End Col */}
                    </div>
                    {/* End Grid */}

                    {/* Background Color */}
                    <div className="absolute inset-0 grid grid-cols-12 size-full">
                        <div className="col-span-full lg:col-span-7 lg:col-start-6 bg-gray-100 w-full h-5/6 rounded-xl sm:h-3/4 lg:h-full dark:bg-neutral-800"></div>
                    </div>
                    {/* End Background Color */}
                </div>
            </div>
        </>
    )
}

export default Features