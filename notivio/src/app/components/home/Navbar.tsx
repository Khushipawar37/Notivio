"use client";

import type React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Video, User, MessageSquare, Menu, X } from "lucide-react";

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
  onClick?: () => void;
  variant?: "desktop" | "mobile";
}

const NavItem = ({ href, icon, label, isActive, onClick, variant = "desktop" }: NavItemProps) => {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full transition-colors duration-200 ${
        variant === "mobile"
          ? "h-11 justify-start px-3 text-sm"
          : "h-12 justify-center px-4 text-xs"
      } ${
        isActive
          ? "bg-black text-[#f5f0e8] shadow-sm"
          : "text-black hover:bg-[#b89d7e]/50"
      }`}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate font-semibold">{label}</span>
    </Link>
  );
};

interface NavbarProps {
  isAuthenticated?: boolean;
}

export default function Navbar({ isAuthenticated = false }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { href: "/", icon: <Home size={20} />, label: "Home", exact: true },
      { href: "/notes", icon: <FileText size={20} />, label: "Notes", exact: false },
      { href: "/convert", icon: <Video size={20} />, label: "Convert", exact: false },
      {
        href: "/dashboard/tutor",
        icon: <FlashCard width={20} height={20} />,
        label: "Tutor",
        exact: false,
      },
      {
        href: isAuthenticated ? "/dashboard" : "/auth/login",
        icon: <User size={20} />,
        label: isAuthenticated ? "Dashboard" : "Login",
        exact: true,
      },
    ],
    [isAuthenticated]
  );

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <Link
        href="/"
        className="absolute left-4 top-5 z-30 text-3xl font-bold font-[cursive] text-[#8a7559] drop-shadow-sm sm:left-6 sm:top-8 sm:text-5xl"
      >
        Notivio
      </Link>

      <Link
        href="/#contact"
        className="absolute right-4 top-5 z-30 hidden items-center gap-2 rounded-full bg-[#c6ac8f] px-4 py-2 text-black transition-colors hover:bg-[#b89d7e] sm:right-6 sm:top-8 sm:flex"
      >
        <MessageSquare size={18} />
        <span>Contact Us</span>
      </Link>

      <div className="fixed right-4 top-5 z-50 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6c0a4]/70 bg-[#f7efe5]/95 text-black shadow-lg shadow-black/10 backdrop-blur-md"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className="fixed left-4 right-4 top-[4.75rem] z-50 rounded-3xl border border-[#d6c0a4]/70 bg-[#f7efe5]/98 p-2 shadow-xl shadow-black/10 backdrop-blur-md sm:hidden">
          <div className="grid gap-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.href, item.exact)}
                onClick={() => setMobileMenuOpen(false)}
                variant="mobile"
              />
            ))}
            <Link
              href="/#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-black transition-colors hover:bg-[#b89d7e]/50"
            >
              <MessageSquare size={20} />
              Contact Us
            </Link>
          </div>
        </nav>
      )}

      <nav className="fixed left-1/2 top-8 z-50 hidden -translate-x-1/2 sm:block">
        <div className="flex items-center justify-between gap-1.5 rounded-full bg-[#c6ac8f] px-2 py-2 shadow-lg shadow-black/10">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.href, item.exact)}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
