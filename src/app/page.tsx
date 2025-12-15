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

export default function Home() {
  return (
    <>
      <Nav />
      <main className="pt-[var(--nav-height)]">
        <Hero />
        <ScrollArrow />

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
      </main>
    </>
  );
}
