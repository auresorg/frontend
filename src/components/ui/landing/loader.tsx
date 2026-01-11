'use client'

import React, { useEffect, useRef, useState } from 'react'
import "./loader.css"

type LoaderProps = {
    forceComplete: boolean
    onFinished: () => void
    fading: boolean  // Add this prop
}

const steps = [
    { text: "Waking Aures core [1/6]", normalDelay: 2800 },
    { text: "Allocating compute resources [2/6]", normalDelay: 3300 },
    { text: "Spinning up runtime environment [3/6]", normalDelay: 2400 },
    { text: "Starting core services [4/6]", normalDelay: 2900 },
    { text: "Initializing request handlers [5/6]", normalDelay: 2200 },
    { text: "Almost ready [6/6]", normalDelay: 3000 }
]

function Loader({ forceComplete, onFinished, fading }: LoaderProps) {
    const [stepIndex, setStepIndex] = useState(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        document.title = "Login - Aures"
    }, [])

    useEffect(() => {
        if (stepIndex >= steps.length) return

        const isLastStep = stepIndex === steps.length - 1

        const delay = forceComplete
            ? isLastStep
                ? 1200   // wait on last step
                : 150   // rapid-play remaining steps
            : steps[stepIndex].normalDelay

        timerRef.current = setTimeout(() => {
            if (isLastStep) {
                onFinished()      // 🔴 tell parent we are done
            } else {
                setStepIndex(prev => prev + 1)
            }
        }, delay)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [stepIndex, forceComplete, onFinished])

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                opacity: fading ? 0 : 1,
                transition: 'opacity 0.5s ease-in-out',
                position: 'fixed',
                width: '100%',
                backgroundColor: '#000',
                zIndex: fading ? 0 : 10,
            }}
        >
            <h1>Booting Aures Core</h1>

            <div className="container">
                <div className="loading">
                    <div className="inside"><b /></div>
                </div>
            </div>

            <div className="info">
                <p style={{ opacity: 0.8 }}>
                    {steps[stepIndex].text}
                </p>
            </div>
        </div>
    )
}

export default Loader
