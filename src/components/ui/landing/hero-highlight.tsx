"use client";

import React, { useRef } from "react";
import { clsx } from "clsx";
import {
    motion,
    useMotionValue,
    useMotionTemplate,
    useInView,
} from "framer-motion";

export const HeroHighlight = ({
    children,
    className,
    containerClassName,
}: {
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
}) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const maskImage = useMotionTemplate`
        radial-gradient(
            200px circle at ${mouseX}px ${mouseY}px,
            black 0%,
            transparent 100%
        )
    `;

    function handleMouseMove(
        e: React.MouseEvent<HTMLDivElement>
    ) {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    }

    const dotPattern = (color: string) => ({
        backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
        backgroundSize: "16px 16px",
    });

    return (
        <div
            ref={ref}
            className={clsx(
                "relative h-[40rem] flex items-center bg-white dark:bg-neutral-900 justify-center w-full group",
                containerClassName
            )}
            onMouseMove={isInView ? handleMouseMove : undefined}
        >
            <div
                className="absolute inset-0 pointer-events-none opacity-70"
                style={dotPattern("rgb(212 212 212)")}
            />

            <div
                className="absolute inset-0 dark:opacity-70 opacity-0 pointer-events-none"
                style={dotPattern("rgb(38 38 38)")}
            />

            <motion.div
                className="pointer-events-none absolute inset-0 transition duration-300"
                animate={{ opacity: isInView ? 1 : 0 }}
                style={{
                    ...dotPattern("rgb(99 102 241)"),
                    WebkitMaskImage: isInView ? maskImage : "none",
                    maskImage: isInView ? maskImage : "none",
                }}
            />

            <div className={clsx("relative z-20", className)}>
                {children}
            </div>
        </div>
    );
};

export const Highlight = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <motion.span
            initial={{ backgroundSize: "0% 100%" }}
            whileInView={{ backgroundSize: "100% 100%" }}
            viewport={{ once: true }}
            transition={{
                duration: 2,
                ease: "linear",
                delay: 0.5,
            }}
            style={{
                backgroundRepeat: "no-repeat",
                backgroundPosition: "left center",
                display: "inline",
            }}
            className={clsx(
                "relative inline-block pb-1 px-1 rounded-lg bg-gradient-to-r from-indigo-300 to-purple-300 dark:from-indigo-500 dark:to-purple-500",
                className
            )}
        >
            {children}
        </motion.span>
    );
};
