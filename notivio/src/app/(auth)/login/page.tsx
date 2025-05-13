"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Separator } from "../../components/ui/separator"
import { Alert, AlertDescription } from "../../components/ui/alert"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth"
import { auth } from "../../lib/firebase"

type FormData = {
  fullName: string
  email: string
  password: string
  phoneNumber: string
}

export default function AuthForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("login")
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

    // Phone number validation (if provided)
    if (activeTab === "register" && formData.phoneNumber) {
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(formData.phoneNumber)) {
        setError("Phone number must be 10 digits")
        return false
      }
    }

    // Full name validation for registration
    if (activeTab === "register" && !formData.fullName.trim()) {
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
      if (forgotPassword) {
        await sendPasswordResetEmail(auth, formData.email)
        setError("Password reset email sent! Check your inbox.")
        setForgotPassword(false)
        setLoading(false)
        return
      }

      if (activeTab === "login") {
        await signInWithEmailAndPassword(auth, formData.email, formData.password)
        router.push("/dashboard")
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)

        // Update profile with full name
        await updateProfile(userCredential.user, {
          displayName: formData.fullName,
        })

        router.push("/dashboard")
      }
    } catch (err: any) {
      console.error(err)

      // Handle specific Firebase errors with user-friendly messages
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password")
      } else if (err.code === "auth/email-already-in-use") {
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

  if (forgotPassword) {
    return (
      <div className="space-y-6">
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
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-[#8a7559]">
          {activeTab === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-muted-foreground">
          {activeTab === "login" ? "Sign in to access your account" : "Enter your information to create an account"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4">
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
          </form>
        </TabsContent>

        <TabsContent value="register" className="space-y-4">
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
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
