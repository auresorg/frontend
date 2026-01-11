'use client'

import React, { useEffect, useState } from 'react'
import Loader from '@/components/ui/landing/loader'
import { BaseAPI, githubClientId, nextBase } from '@/lib/utils'

function Page() {
    const [ready, setReady] = useState(false)
    const [showLoaded, setShowLoaded] = useState(false)
    const [fading, setFading] = useState(false)
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        BaseAPI.get("/auth/ping")
            .finally(() => {
                setReady(true)
            });
        setLoggedIn(localStorage.getItem("token") ? true : false)
    }, [])

    const handleLoaderFinished = () => {
        setFading(true)
        // Wait for loader to fade out, then show splash
        setTimeout(() => {
            setShowLoaded(true);

            window.location.href = loggedIn ?
            "dashboard" :
            `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(nextBase + "/login/callback")}&scope=read:user user:email`
        }, 500)
    }

    return (
        <>
            {!showLoaded && (
                <Loader
                    forceComplete={ready}
                    onFinished={handleLoaderFinished}
                    fading={fading}
                />
            )}
        </>
    )
}

export default Page
