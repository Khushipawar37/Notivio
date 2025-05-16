"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Separator } from "../../components/ui/separator"
import { Alert, AlertDescription } from "../../components/ui/alert"
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth"
import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"

// Firebase initialization
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotPassword, setForgotPassword] = useState(false)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard")
      }
    })

    return () => unsubscribe()
  }, [router])

  const validateForm = () => {
    // Reset error
    setError(null)

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    // Password validation (at least 6 characters)
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    return true
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      if (forgotPassword) {
        await sendPasswordResetEmail(auth, formData.email)
        setError("Password reset email sent! Check your inbox.")
        setForgotPassword(false)
        setLoading(false)
        return
      }

      await signInWithEmailAndPassword(auth, formData.email, formData.password)
      router.push("/dashboard")
    } catch (err: any) {
      console.error(err)

      // Handle specific Firebase errors with user-friendly messages
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password")
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection")
      } else {
        setError(err.message || "An error occurred. Please try again")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      router.push("/dashboard")
    } catch (err: any) {
      console.error(err)
      setError("Google sign-in failed. Please try again")
    } finally {
      setLoading(false)
    }
  }

  const handleFacebookSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const provider = new FacebookAuthProvider()
      await signInWithPopup(auth, provider)
      router.push("/dashboard")
    } catch (err: any) {
      console.error(err)
      setError("Facebook sign-in failed. Please try again")
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  if (forgotPassword) {
    return (
      <main className="min-h-screen flex">
        {/* Left side - Illustration */}
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

          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-[#8a7559]/10 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#8a7559]/20 rounded-full"></div>
          <div className="absolute top-20 -left-20 w-64 h-64 bg-[#8a7559]/10 rounded-full"></div>
        </div>

        {/* Right side - Auth form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold text-[#8a7559]">Reset Password</h1>
              <p className="text-muted-foreground">Enter your email to receive a password reset link</p>
            </div>

            {error && (
              <Alert variant={error.includes("sent") ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-[#c6ac8f] hover:bg-[#8a7559]" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={() => setForgotPassword(false)}>
                Back to Login
              </Button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex">
      {/* Left side - Illustration */}
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

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-[#8a7559]/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#8a7559]/20 rounded-full"></div>
        <div className="absolute top-20 -left-20 w-64 h-64 bg-[#8a7559]/10 rounded-full"></div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-[#8a7559]">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to access your account</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button variant="link" className="px-0 text-xs" onClick={() => setForgotPassword(true)} type="button">
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#c6ac8f] hover:bg-[#8a7559]" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-[#8a7559] hover:underline">
                Register here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
