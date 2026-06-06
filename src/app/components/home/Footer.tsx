"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Github, Twitter, Instagram, Linkedin, Mail, Heart, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 500);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const footerLinks = [
    { name: "Home", href: "/" },
    { name: "Notes", href: "/notes" },
    { name: "Convert", href: "/convert" },
    { name: "Tutor", href: "/dashboard/tutor" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Contact", href: "/#contact" },
  ];

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
    { name: "GitHub", icon: Github, href: "#" },
    { name: "Email", icon: Mail, href: "mailto:info@notivio.com" },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#211a14] pb-10 pt-20 text-[#d7c6b3]">
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-50 rounded-full bg-[#c6ac8f] p-3 text-black shadow-lg transition-all duration-300 hover:bg-[#d8c0a5]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </motion.button>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-3">
          <section>
            <div className="relative mb-6 inline-block">
              <h2 className="text-4xl font-bold font-[cursive] text-[#c6ac8f]">Notivio</h2>
              <Sparkles className="absolute -right-5 -top-1 h-4 w-4 text-[#c6ac8f]" />
            </div>
            <p className="mb-6 max-w-md leading-relaxed text-gray-400">
              Transform your learning experience with AI-powered note-taking and study tools.
            </p>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    className="rounded-full border border-[#5d4a34]/50 bg-[#2f281f] p-2 text-[#c6ac8f] transition-colors hover:bg-[#3b3227]"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={link.name}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.a>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-6 text-lg font-semibold text-[#f7efe5]">Quick Links</h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <motion.li key={link.name} whileHover={{ x: 5 }}>
                  <Link href={link.href} className="text-gray-400 transition-colors hover:text-[#c6ac8f]">
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-6 text-lg font-semibold text-[#f7efe5]">Stay Updated</h3>
            <p className="mb-4 text-gray-400">
              Subscribe to our newsletter for the latest updates and features.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full rounded-lg border border-[#5d4a34]/60 bg-[#2f281f] px-4 py-3 text-[#f7efe5] outline-none focus:ring-2 focus:ring-[#c6ac8f]"
                required
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[#c6ac8f] px-4 py-3 font-medium text-black transition-colors hover:bg-[#d8c0a5]"
              >
                Subscribe
              </button>
            </form>
          </section>
        </div>

        <div className="flex flex-col items-center justify-between border-t border-[#5d4a34]/50 pt-6 text-sm text-[#bda78d] md:flex-row">
          <p className="mb-4 md:mb-0">© {new Date().getFullYear()} Notivio. All rights reserved.</p>
          <p className="flex items-center">
            Made with <Heart className="mx-1 h-4 w-4 text-[#c6ac8f]" /> for learners worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
