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
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile,
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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

    // Phone number validation (if provided)
    if (formData.phoneNumber) {
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(formData.phoneNumber)) {
        setError("Phone number must be 10 digits")
        return false
      }
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      setError("Please enter your full name")
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
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)

      // Update profile with full name
      await updateProfile(userCredential.user, {
        displayName: formData.fullName,
      })

      router.push("/dashboard")
    } catch (err: any) {
      console.error(err)

      // Handle specific Firebase errors with user-friendly messages
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered")
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

  return (
    <main className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#c6ac8f] to-[#f5f0e8] p-8 flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-3xl font-bold text-[#8a7559]">Notivio</h2>
          <p className="text-[#8a7559]/80 mt-2 max-w-md">Find 3d Objects, Mockups and Illustrations here</p>
        </div>

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
            <h1 className="text-3xl font-bold text-[#8a7559]">Create Account</h1>
            <p className="text-muted-foreground">Enter your information to create an account</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleFacebookSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z" />
              </svg>
              Facebook
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

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
              <Label htmlFor="phoneNumber">Phone Number (optional)</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="1234567890"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
            </div>

            <Button type="submit" className="w-full bg-[#c6ac8f] hover:bg-[#8a7559]" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#8a7559] hover:underline">
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
