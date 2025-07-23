"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUp,
  Github,
  Twitter,
  Instagram,
  Linkedin,
  Mail,                
  Heart,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1]);

  // Check if we've scrolled down enough to show the back-to-top button
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);                      
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Interactive elements for the footer
  const footerLinks = [
    { name: "Home", href: "/" },                  
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "About", href: "#about" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
  ];

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Instagram", icon: Instagram, href: "#" },                     
    { name: "LinkedIn", icon: Linkedin, href: "#" },
    { name: "GitHub", icon: Github, href: "#" },
    { name: "Email", icon: Mail, href: "mailto:info@notivio.com" },
  ];

  return (
    <footer className="relative bg-black overflow-hidden pt-20 pb-10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-900/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Back to top button */}
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 p-3 rounded-full bg-[#c6ac8f] text-black shadow-lg z-50 hover:bg-[#d8c0a5] transition-all duration-300"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.8,
          y: isVisible ? 0 : 20,
        }}
        transition={{ duration: 0.3 }}
        aria-label="Back to top"
      >                             
        <ArrowUp className="w-5 h-5" />
      </motion.button>

      {/* Main footer content */}
      <div className="container mx-auto px-4 relative z-10">
        {/* Top section with logo and links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Logo and description */}
          <div className="col-span-1">
            <div className="mb-6 relative">
              <motion.div
                className="inline-block relative"
                whileHover={{
                  rotate: [0, -5, 5, -5, 0],                           
                  transition: { duration: 0.5 },
                }}
              >
                <h2 className="text-4xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#c6ac8f] to-[#e2d1bc]">
                    Notivio
                  </span>
                </h2>
                <motion.div
                  className="absolute -top-1 -right-1 text-[#c6ac8f]"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.8, 1.2, 0.8],
                    rotate: 15,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                >
                  <Sparkles className="w-4 h-4" />                  
                </motion.div>
              </motion.div>
            </div>
            <p className="text-gray-400 mb-6">
              Transform your learning experience with AI-powered note-taking and
              study tools.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    className="p-2 rounded-full bg-gray-900 border border-gray-800 text-[#c6ac8f] hover:bg-gray-800 transition-colors"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={link.name}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );                  
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold text-lg mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <motion.li key={link.name} whileHover={{ x: 5 }}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#c6ac8f] transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>                 
          </div>

          {/* Newsletter signup */}
          <div className="col-span-1">
            <h3 className="text-white font-semibold text-lg mb-6">
              Stay Updated
            </h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest updates and features.
            </p>
            <form className="space-y-3">
              <div className="relative">
                <input                   
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6ac8f] text-white"
                  required
                />
              </div>
              <motion.button
                type="submit"
                className="w-full px-4 py-3 bg-[#c6ac8f] text-black font-medium rounded-lg hover:bg-[#d8c0a5] transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Subscribe
              </motion.button>
            </form>
          </div>                     
        </div>

        {/* Bottom section with copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-gray-800">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} Notivio. All rights reserved.
          </p>

          <div className="flex items-center text-gray-500 text-sm">                  
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              Made with <Heart className="w-4 h-4 mx-1 text-[#c6ac8f]" /> for             
              learners worldwide
            </motion.div>
          </div>
        </div>
      </div>

      {/* Decorative wave */}
      <div className="absolute top-0 left-0 right-0 h-20 overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-20 text-black"
          style={{ transform: "rotate(180deg)" }}
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill="currentColor"
            opacity=".25"
          ></path>
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            fill="currentColor"
            opacity=".5"
          ></path>
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
    </footer>
  );
}
