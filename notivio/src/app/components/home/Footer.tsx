"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Github, Twitter, Instagram, Linkedin, Mail, Heart } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("notivio-footer-theme");
    setIsDark(savedTheme === "dark");

    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 500);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const toggleTheme = () => {
    setIsDark((current) => {
      const next = !current;
      window.localStorage.setItem("notivio-footer-theme", next ? "dark" : "light");
      return next;
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const footerLinks = [
    { name: "Home", href: "/" },
    { name: "Notes", href: "/notes" },
    { name: "Convert", href: "/convert" },
    { name: "Tutor", href: "/dashboard/tutor" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Contact", href: "/contact" },
  ];

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
    { name: "GitHub", icon: Github, href: "#" },
    { name: "Email", icon: Mail, href: "mailto:info@notivio.com" },
  ];

  const theme = isDark
    ? {
        shell: "bg-[#2f281f] text-[#f7efe5] border-[#4b3f32]",
        muted: "text-[#d7c6b3]",
        panel: "bg-[#3b3227] border-[#5d4a34]",
        input: "bg-[#271f18] border-[#5d4a34] text-[#f7efe5] placeholder:text-[#bba68f]",
        button: "bg-[#d6b894] text-[#241c15] hover:bg-[#e4c8a5]",
      }
    : {
        shell: "bg-[#f7efe5] text-[#5d4a34] border-[#d8c6b2]",
        muted: "text-[#7a6852]",
        panel: "bg-[#fffaf3] border-[#e4d7c8]",
        input: "bg-white border-[#d8c6b2] text-[#5d4a34] placeholder:text-[#9b876e]",
        button: "bg-[#8a7559] text-white hover:bg-[#7a664f]",
      };

  return (
    <footer className={`relative overflow-hidden border-t ${theme.shell}`}>
      <motion.button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 rounded-full p-3 shadow-lg transition-all duration-300 ${theme.button}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </motion.button>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 border-b border-current/15 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-4xl font-bold font-[cursive] text-[#8a7559]">Notivio</h2>
            <p className={`mt-3 max-w-xl text-sm leading-relaxed ${theme.muted}`}>
              AI-powered notes, study planning, tutoring, and revision tools in one calm workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${theme.panel}`}
            aria-label="Toggle footer theme"
          >
            <span>{isDark ? "☀️" : "🌙"}</span>
            {isDark ? "Light footer" : "Dark footer"}
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <section className={`rounded-xl border p-5 ${theme.panel}`}>
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {footerLinks.map((link) => (
                <Link key={link.name} href={link.href} className={`text-sm transition-colors hover:text-[#8a7559] ${theme.muted}`}>
                  {link.name}
                </Link>
              ))}
            </div>
          </section>

          <section className={`rounded-xl border p-5 ${theme.panel}`}>
            <h3 className="text-lg font-semibold">Connect</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    className={`rounded-full border p-2 transition-colors hover:text-[#8a7559] ${theme.panel}`}
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

          <section className={`rounded-xl border p-5 ${theme.panel}`}>
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className={`mt-2 text-sm ${theme.muted}`}>Get occasional updates about study tools and features.</p>
            <form className="mt-4 space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#c6ac8f] ${theme.input}`}
                required
              />
              <button type="submit" className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${theme.button}`}>
                Subscribe
              </button>
            </form>
          </section>
        </div>

        <div className={`mt-10 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between ${theme.muted}`}>
          <p>© {new Date().getFullYear()} Notivio. All rights reserved.</p>
          <p className="flex items-center">
            Made with <Heart className="mx-1 h-4 w-4 text-[#8a7559]" /> for learners worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
