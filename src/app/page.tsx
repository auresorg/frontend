'use client';
import React, { useEffect } from 'react';
import { SparklesCore } from "./sparkles";
import logo from "@/assets/images/cover.png"
import Image from "next/image";


export default function Home() {
  useEffect(() => {
    // store previous background so we can restore it when this page unmounts
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#000';
    return () => {
      document.body.style.backgroundColor = prev;
    };
  }, []);

  return (
          <div className="h-160 w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
              <h1 className="md:text-7xl text-3xl lg:text-9xl font-bold text-center text-white relative z-20">
                  <Image src={logo} alt="AURES Logo" className="relative z-20 w-auto h-24" />
              </h1>
              <div className="w-160 h-40 relative">
                  {/* Gradients */}
                  <div className="absolute inset-x-20 top-0 bg-linear-to-rrom-transparent via-indigo-500 to-transparent h-0.5-3/4 blur-sm" />
                  <div className="absolute inset-x-20 top-0 bg-linear-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
                  <div className="absolute inset-x-60 top-0 bg-linear-to-rrom-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
                  <div className="absolute inset-x-60 top-0 bg-linear-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
  
                  {/* Core component */}
                  <SparklesCore
                      background="transparent"
                      minSize={0.4}
                      maxSize={1}
                      particleDensity={1200}
                      className="w-full h-full"
                      particleColor="#FFFFFF"
                  />
  
                  {/* Radial Gradient to prevent sharp edges */}
                  <div className="absolute inset-0 w-full h-full bg-black mask-[radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
              </div>
          </div>
      );
}