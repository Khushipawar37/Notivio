"use client";

import Image from "next/image";
import Link from "next/link";
import { SignUp } from "@stackframe/stack";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#c6ac8f] to-[#f5f0e8] p-8 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <Image
            src="/laptop-illustration.png"
            alt="Laptop with Notivio"
            width={500}
            height={400}
            className="transform hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-[#8a7559]/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#8a7559]/20 rounded-full" />
        <div className="absolute top-20 -left-20 w-64 h-64 bg-[#8a7559]/10 rounded-full" />
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-[#8a7559] text-center mb-2">
            Create Account
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Start building your persistent study workspace
          </p>
          <SignUp fullPage={false} />
          <p className="text-sm text-center mt-4 text-[#8a7559]">
            Already have an account?{" "}
            <Link href="/auth/login" className="hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
