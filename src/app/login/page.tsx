'use client'

import React, { useEffect, useRef, useState } from 'react'
import Loader from '@/components/ui/landing/loader'
import { BaseAPI, githubClientId, nextBase } from '@/lib/utils'

function Page() {
    const [ready, setReady] = useState(false)
    const [showLoaded, setShowLoaded] = useState(false)
    const [fading, setFading] = useState(false)
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
    const [waitingFor200, setWaitingFor200] = useState(false)
    const [allowLoader, setAllowLoader] = useState(false)

    const waitingRef = useRef(false)
    const resolvedFastRef = useRef(false)

    useEffect(() => {
        const isLoggedIn = !!localStorage.getItem('token')
        setLoggedIn(isLoggedIn)
        

        const loaderTimer = setTimeout(() => {
            if (!resolvedFastRef.current) {
                
                setAllowLoader(true)
            }
        }, 900)

        const pingUntilReady = () => {
            

            BaseAPI.get('/auth/ping')
                .then(() => {
                    

                    if (!allowLoader) {
                        
                        resolvedFastRef.current = true
                        redirect()
                        return
                    }

                    if (waitingRef.current) {
                        
                        redirect()
                        return
                    }

                    
                    setReady(true)
                })
                .catch((err) => {
                    const status = err?.response?.status
                    

                    if (status === 502) {
                        

                        waitingRef.current = true
                        setWaitingFor200(true)
                        setAllowLoader(true)
                        setReady(true)

                        setTimeout(pingUntilReady, 1500)
                    } else {
                        setAllowLoader(true)
                        setReady(true)
                    }
                })
                .finally(() => {
                    clearTimeout(loaderTimer)
                })
        }

        pingUntilReady()
    }, [allowLoader])

    const redirect = () => {
        
        window.location.href = loggedIn
            ? 'dashboard'
            : `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(
                  nextBase + '/login/callback'
              )}&scope=read:user user:email`
    }

    const handleLoaderFinished = () => {
        

        setFading(true)

        setTimeout(() => {
            
            setShowLoaded(true)

            if (!waitingRef.current) {
                redirect()
            }
        }, 500)
    }

    return (
        <>
            {allowLoader && !showLoaded && (
                <Loader
                    forceComplete={ready}
                    onFinished={handleLoaderFinished}
                    fading={fading}
                />
            )}

            {showLoaded && waitingFor200 && (
                <div className="fixed inset-0 flex items-center justify-center text-white text-xl">
                    LOADED, REDIRECTING
                </div>
            )}
        </>
    )
}

export default Page
