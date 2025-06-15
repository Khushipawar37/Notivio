import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

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
export const auth = getAuth(app)
export const db = getFirestore(app)

// Types for our data
export interface Note {
  id: string
  userId: string
  title: string
  content: string
  folderId?: string
  isFavorite: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Folder {
  id: string
  userId: string
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  userId: string
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  email: string
  fullName: string
  phoneNumber?: string
  createdAt: Date
  updatedAt: Date
}
