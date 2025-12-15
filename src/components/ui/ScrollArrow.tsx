"use client";

import React, { useEffect, useState } from "react";

function ScrollArrow() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div
        onClick={
          //scroll to next section
          () => {
            const nextSection = document.getElementById("s2");
            if (nextSection) {
              nextSection.scrollIntoView({ behavior: "smooth" });
            }
          }
        }
        className="scroll-arrow"
        aria-hidden
      >
        <div className="chevron"></div>
        <div className="chevron"></div>
        <div className="chevron"></div>
      </div>

      <style jsx>{`
                .scroll-arrow {
                    position: fixed;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    opacity: 1;
                    transition: opacity 0.3s ease-out;
                    cursor: pointer;
                    z-index: 50;
                }

                .chevron {
                    position: relative;
                    width: 1.2rem;
                    height: 0.3rem;
                    opacity: 0;
                    animation: move-chevron 2s ease-out infinite;
                }

                .chevron:first-child {
                    animation-delay: 0s;
                }

                .chevron:nth-child(2) {
                    animation-delay: 0.3s;
                }

                .chevron:nth-child(3) {
                    animation-delay: 0.6s;
                }

                .chevron::before,
                .chevron::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    height: 100%;
                    width: 50%;
                    background: #2c3e50;
                }

                .chevron::before {
                    left: 0;
                    transform: skewY(30deg);
                }

                .chevron::after {
                    right: 0;
                    transform: skewY(-30deg);
                }

                .chevron:first-child::before,
                .chevron:first-child::after {
                    background: #60a5fa;
                }

                .chevron:nth-child(2)::before,
                .chevron:nth-child(2)::after {
                    background: #3b82f6;
                }

                .chevron:nth-child(3)::before,
                .chevron:nth-child(3)::after {
                    background: #2563eb;
                }

                @keyframes move-chevron {
                    0% {
                        opacity: 0;
                        transform: translateY(0);
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(0.8rem);
                    }
                }
            `}</style>
    </>
  );
}

export default ScrollArrow;
