'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Bell, Info, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { Card } from '@/components/Card';
import { cx } from '@/lib/utils';

// Helper to render dynamic icons from lucide
const IconComponent = ({ name, className }: { name: string | null, className?: string }) => {
    switch (name) {
        case 'info':
            return <Info className={className} />;
        case 'alert-circle':
            return <AlertCircle className={className} />;
        case 'check-circle':
            return <CheckCircle className={className} />;
        case 'bell':
        default:
            return <Bell className={className} />;
    }
};

export default function NotificationBar() {
    const { notifications, fetchNotifications, dismissNotification } = useNotificationStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Ensure currentIndex is valid if notifications array shrinks
    useEffect(() => {
        if (notifications.length > 0 && currentIndex >= notifications.length) {
            setCurrentIndex(Math.max(0, notifications.length - 1));
        }
    }, [notifications.length, currentIndex]);

    if (!notifications || notifications.length === 0) {
        return null;
    }

    // Safely clamp index during render to avoid out-of-bounds before useEffect fires
    const safeIndex = Math.min(currentIndex, Math.max(0, notifications.length - 1));
    const currentNotif = notifications[safeIndex];

    if (!currentNotif) {
        return null; // extra safety
    }

    const hasMultiple = notifications.length > 1;
    const canGoPrev = safeIndex > 0;
    const canGoNext = safeIndex < notifications.length - 1;

    const next = () => {
        if (canGoNext) setCurrentIndex((prev) => prev + 1);
    };

    const prev = () => {
        if (canGoPrev) setCurrentIndex((prev) => prev - 1);
    };

    const handleDismiss = () => {
        dismissNotification(currentNotif.id);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;

        const diff = touchStartX.current - touchEndX.current;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                next();
            } else {
                prev();
            }
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    return (
        <Card className="w-full relative overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm p-0!">
            <div
                className="relative flex w-full items-start sm:items-center min-h-[80px] px-4 sm:px-14 py-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >

                {/* Left Navigation Arrow */}
                {hasMultiple && (
                    <button
                        onClick={prev}
                        disabled={!canGoPrev}
                        className={cx(
                            "hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors",
                            canGoPrev
                                ? "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                                : "text-transparent cursor-default pointer-events-none"
                        )}
                        aria-label="Previous notification"
                        aria-hidden={!canGoPrev}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}

                {/* Fade Transition Center Content */}
                <div
                    key={currentNotif.id}
                    className="flex-1 flex items-start gap-3 sm:gap-4 overflow-hidden animate-in fade-in duration-500 pr-4 sm:pr-16"
                >
                    <div className="flex-shrink-0 p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                        <IconComponent name={currentNotif.icon} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words leading-snug">
                            {currentNotif.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                            {new Date(currentNotif.createdAt).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>

                {/* Right Navigation Arrow */}
                {hasMultiple && (
                    <button
                        onClick={next}
                        disabled={!canGoNext}
                        className={cx(
                            "hidden sm:flex absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors",
                            canGoNext
                                ? "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                                : "text-transparent cursor-default pointer-events-none"
                        )}
                        aria-label="Next notification"
                        aria-hidden={!canGoNext}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}

                {/* Dismiss Button - Top Right Absolute alignment */}
                <button
                    onClick={handleDismiss}
                    className="absolute right-2 sm:right-3 top-2 sm:top-1/2 sm:-translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                    aria-label="Close notification"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Pagination Dots */}
            {hasMultiple && (
                <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1.5">
                    {notifications.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cx(
                                "h-1.5 rounded-full transition-all duration-300",
                                idx === safeIndex
                                    ? "bg-blue-500 w-3"
                                    : "bg-gray-300 dark:bg-zinc-700 hover:bg-gray-400 dark:hover:bg-zinc-600 w-1.5"
                            )}
                            aria-label={`Go to notification ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </Card>
    );
}