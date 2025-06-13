"use client"

import AboutSection from "./components/home/About"
import ContactPage from "./components/home/Contact"
import Faq from "./components/home/Faq"
import Footer from "./components/home/Footer"
import HeroSection from "./components/home/Hero"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <HeroSection/>
      <AboutSection/>
      <Faq/>
      <ContactPage/>
      <Footer/>
    </main>
  )
}
