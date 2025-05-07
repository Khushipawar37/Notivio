"use client"

import AboutSection from "./components/About"
import HeroSection from "./components/Hero"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <HeroSection/>
      <AboutSection/>
    </main>
  )
}
