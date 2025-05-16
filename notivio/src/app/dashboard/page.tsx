"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../components/ui/button"
import { auth } from "../lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(false)
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push("/dashboard")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c6ac8f]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]/30">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#8a7559]">Notivio Dashboard</h1>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-[#c6ac8f] text-[#8a7559] hover:bg-[#c6ac8f]/10"
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user?.displayName || "User"}!</h2>
          <p className="text-gray-600">You have successfully logged in with: {user?.email}</p>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Created</p>
                <p>
                  {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Sign In</p>
                <p>
                  {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email Verified</p>
                <p>{user?.emailVerified ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
