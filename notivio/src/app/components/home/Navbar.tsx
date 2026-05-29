"use client";

import type React from "react";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Video, User, MessageSquare } from "lucide-react";

const FlashCard = (props: React.SVGProps<SVGSVGElement>) => (
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
}

const NavItem = ({ href, icon, label, isActive }: NavItemProps) => {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 transition-colors duration-200 sm:h-12 sm:flex-none sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 ${
        isActive
          ? "bg-black text-[#f5f0e8] shadow-sm"
          : "text-black hover:bg-[#b89d7e]/50"
      }`}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate text-[10px] font-semibold sm:text-xs">{label}</span>
    </Link>
  );
};

interface NavbarProps {
  isAuthenticated?: boolean;
}

export default function Navbar({ isAuthenticated = false }: NavbarProps) {
  const pathname = usePathname();

  const navItems = useMemo(
    () => [
      { href: "/", icon: <Home size={21} />, label: "Home" },
      { href: "/notes", icon: <FileText size={21} />, label: "Notes" },
      { href: "/convert", icon: <Video size={21} />, label: "Convert" },
      { href: "/dashboard/tutor", icon: <FlashCard width={21} height={21} />, label: "Tutor" },
      {
        href: isAuthenticated ? "/dashboard" : "/auth/login",
        icon: <User size={21} />,
        label: isAuthenticated ? "Dashboard" : "Login",
      },
    ],
    [isAuthenticated]
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <Link
        href="/"
        className="absolute left-4 top-5 z-30 text-3xl font-bold font-[cursive] text-[#c6ac8f] sm:left-6 sm:top-8 sm:text-5xl"
      >
        Notivio
      </Link>

      <Link
        href="/contact"
        className="absolute right-4 top-5 z-30 hidden items-center gap-2 rounded-full bg-[#c6ac8f] px-4 py-2 text-black transition-colors hover:bg-[#b89d7e] sm:right-6 sm:top-8 sm:flex"
      >
        <MessageSquare size={18} />
        <span>Contact Us</span>
      </Link>

      <nav className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-8 sm:-translate-x-1/2">
        <div className="flex min-w-0 items-center justify-between gap-1 rounded-3xl border border-[#d6c0a4]/70 bg-[#f7efe5]/95 p-1.5 shadow-lg shadow-black/10 backdrop-blur-md sm:gap-1.5 sm:rounded-full sm:bg-[#c6ac8f] sm:px-2 sm:py-2">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.href)}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
