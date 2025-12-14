'use client';
import React from 'react';
import Hero from '@/components/ui/landing/hero';
import Nav from '@/components/ui/landing/nav';
import ScrollArrow from '@/components/ui/ScrollArrow';


export default function Home() {

  return <>
    <Nav />
    <Hero />
    <ScrollArrow />
  </>
}