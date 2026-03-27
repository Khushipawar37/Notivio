"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, FileText, Video, User, MessageSquare } from "lucide-react";
import { Lobster } from "next/font/google";

const lobster = Lobster({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const FlashCard = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  index: number;
  activeTab: number;
}

const NavItem = ({
  href,
  icon,
  label,
  isActive,
  onClick,
  index,
  activeTab,
}: NavItemProps) => {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center justify-center w-[6rem] h-16 transition-colors duration-200 z-10"
      onClick={onClick}
    >
      {isActive ? (
        <motion.div
          className="absolute flex flex-col items-center justify-center"
          initial={{ y: 0 }}
          animate={{ y: -14 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-[#cfcfcd]">{icon}</div>
          <span className="text-xs mt-1 font-medium text-[#cfcfcd]">{label}</span>
        </motion.div>
      ) : (
        <>
          <div className="text-black">{icon}</div>
          <span className="text-xs mt-1 font-medium text-black">{label}</span>
        </>
      )}
    </Link>
  );
};

interface NavbarProps {
  isAuthenticated?: boolean;
}

export default function Navbar({ isAuthenticated = false }: NavbarProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(0);
  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/", icon: <Home size={24} />, label: "Home" },
    { href: "/notes", icon: <FileText size={24} />, label: "Notes" },
    { href: "/convert", icon: <Video size={24} />, label: "Convert" },
    { href: "/template", icon: <FlashCard size={24} />, label: "Template" },
  ];

  useEffect(() => {
    const index = navItems.findIndex((item) => item.href === pathname);
    if (index !== -1) {
      setActiveTab(index);
      updateIndicatorPosition(index);
    }
  }, [pathname]);

  const updateIndicatorPosition = (index: number) => {
    if (!navRef.current) return;
    const position = index * 96 + 48 - 32;
    setIndicatorPosition(position);
  };

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    updateIndicatorPosition(index);
  };

  return (
    <>
      {/*
        Notivio & Contact use `absolute` (not fixed, not static).
        - They scroll away with the page ✓
        - They take ZERO height in document flow → no extra margin ✓
        - They visually align with the fixed pill at top-8 ✓
        The parent page must have `relative` positioning (or just rely on
        the nearest positioned ancestor — works in most layouts).
      */}
      <Link
        href="/"
        className={`hidden sm:block absolute top-8 left-6 text-5xl font-bold ${lobster.className} text-[#c6ac8f] z-30`}
      >
        Notivio
      </Link>

      <Link
        href="/contact"
        className="hidden sm:flex absolute top-8 right-6 items-center gap-2 bg-[#c6ac8f] text-black px-4 py-2 rounded-full transition-colors z-30"
      >
        <MessageSquare size={18} />
        <span>Contact Us</span>
      </Link>

      {/* Nav pill — fixed always. Desktop: top-center. Mobile: bottom-center. */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 sm:top-8 sm:bottom-auto">
        <div
          ref={navRef}
          className="relative flex items-center bg-[#c6ac8f] rounded-full h-16 px-4 shadow-lg"
        >
          <motion.div
            className="absolute w-16 h-16 bg-black rounded-full z-0"
            initial={{ x: indicatorPosition }}
            animate={{ x: indicatorPosition, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          {navItems.map((item, index) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={activeTab === index}
              onClick={() => handleTabClick(index)}
              index={index}
              activeTab={activeTab}
            />
          ))}

          <div className="h-8 w-px bg-gray-700 mx-2"></div>
          <Link
            href={isAuthenticated ? "/dashboard" : "/auth/login"}
            className="flex flex-col items-center justify-center w-[5.5rem] h-16 text-[black] hover:text-gray-300 transition-colors duration-200 z-10"
          >
            <User size={24} />
            <span className="text-xs mt-1 font-medium">
              {isAuthenticated ? "Dashboard" : "Login"}
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}