"use client";

import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@stackframe/stack";
import Footer from "../../components/home/Footer";

export default function LoginPage() {
  return (
    <>
    <main className="flex min-h-screen bg-[#f5f0e8]">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#d8c4a8] to-[#f5f0e8] p-8 md:flex md:w-1/2 md:flex-col md:justify-between">
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <Image
            src="/laptop-illustration.png"
            alt="Laptop with Notivio"
            width={500}
            height={400}
            className="transform hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-6 pt-28 md:w-1/2 md:p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-[#8a7559] text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Sign in to access your notes and workspace
          </p>
          <SignIn fullPage={false} />
          <p className="text-sm text-center mt-4 text-[#8a7559]">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
