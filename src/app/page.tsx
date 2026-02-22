"use client";

import React from "react";
import Nav from "@/components/ui/landing/nav";
import Hero from "@/components/ui/landing/hero";
import ScrollArrow from "@/components/ui/ScrollArrow";
import {
  HeroHighlight,
  Highlight,
} from "@/components/ui/landing/hero-highlight";
import { motion } from "framer-motion";
import Features from "@/components/ui/landing/features";
import Comparision from "@/components/ui/landing/comparision";
import Globe from "@/components/ui/landing/globe";
import { BackgroundBeamsWithCollision } from "@/components/ui/landing/background";
import Footer from "@/components/ui/landing/footer";
import Faq from "@/components/ui/landing/faq";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="pt-(--nav-height)">

        <div id="s1">
          <Hero />
          <ScrollArrow />
        </div>

        <div id="s2">
          <HeroHighlight>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: [20, -5, 0] }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.5,
                ease: [0.4, 0.0, 0.2, 1],
              }}
              className="text-2xl px-4 md:text-4xl lg:text-5xl font-bold text-neutral-700 dark:text-white max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto"
            >
              You leveled up, your presence stayed behind.
              Everything became a{" "}
              <Highlight className="text-black dark:text-white">
                version, of a version, of a version
              </Highlight>
            </motion.h1>
          </HeroHighlight>
        </div>

        <div id="s3">
          <Features />
        </div>


        <div id="s6">
          <BackgroundBeamsWithCollision>
            <h2 className="text-2xl relative z-20 md:text-4xl lg:text-7xl font-bold text-center text-black dark:text-white font-sans tracking-tight">
              What&apos;s cooler than Aures?{" "}
              <div className="relative mx-auto inline-block w-max filter-[drop-shadow(0px_1px_3px_rgba(27,37,80,0.14))]">
                <div className="absolute left-0 top-px bg-clip-text bg-no-repeat text-transparent bg-linear-to-r py-4 from-[#0A2FFF] via-[#0B5CFF] to-[#1597FF] [text-shadow:0_0_rgba(0,0,0,0.1)]">
                  <span className="">Exploring Aures.</span>
                </div>
                <div className="relative bg-clip-text text-transparent bg-no-repeat bg-linear-to-r from-[#0A2FFF] via-[#0B5CFF] to-[#1597FF] py-4">
                  <span className="">Exploring Aures.</span>
                </div>
              </div>
            </h2>
          </BackgroundBeamsWithCollision>
        </div>

        <div id="s4">
          <Comparision />
        </div>

        <div id="s5" className="text-center">
          <Globe />
        </div>

        <div id="s6" className="pb-10">
            <Faq />
        </div>

        <div id="s7">
          <Footer />
        </div>
        
      </main>
    </>
  );
}