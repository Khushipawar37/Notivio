"use client"

import { useState, useEffect } from "react"
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth, db } from "../lib/firebase"
import type { Note, Folder, Tag } from "../lib/firebase"

export function useFirebaseNotes() {
  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      if (!user) {
        setNotes([])
        setFolders([])
        setTags([])
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Real-time listeners for user data
  useEffect(() => {
    if (!user) return

    setLoading(true)

    // Notes listener
    const notesQuery = query(collection(db, "notes"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Note[]
      setNotes(notesData)
    })

    // Folders listener
    const foldersQuery = query(collection(db, "folders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const foldersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Folder[]
      setFolders(foldersData)
    })

    // Tags listener
    const tagsQuery = query(collection(db, "tags"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribeTags = onSnapshot(tagsQuery, (snapshot) => {
      const tagsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Tag[]
      setTags(tagsData)
      setLoading(false)
    })

    return () => {
      unsubscribeNotes()
      unsubscribeFolders()
      unsubscribeTags()
    }
  }, [user])

  // Create note
  const createNote = async (noteData: {
    title: string
    content: string
    folderId?: string
    tags?: string[]
  }) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const docRef = await addDoc(collection(db, "notes"), {
        userId: user.uid,
        title: noteData.title,
        content: noteData.content,
        folderId: noteData.folderId || null,
        isFavorite: false,
        tags: noteData.tags || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error creating note:", error)
      throw error
    }
  }

  // Update note
  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const noteRef = doc(db, "notes", noteId)
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating note:", error)
      throw error
    }
  }

  // Delete note
  const deleteNote = async (noteId: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      await deleteDoc(doc(db, "notes", noteId))
    } catch (error) {
      console.error("Error deleting note:", error)
      throw error
    }
  }

  // Create folder
  const createFolder = async (name: string, color = "#c6ac8f") => {
    if (!user) throw new Error("User not authenticated")

    try {
      const docRef = await addDoc(collection(db, "folders"), {
        userId: user.uid,
        name,
        color,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error creating folder:", error)
      throw error
    }
  }

  // Update folder
  const updateFolder = async (folderId: string, updates: Partial<Folder>) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const folderRef = doc(db, "folders", folderId)
      await updateDoc(folderRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating folder:", error)
      throw error
    }
  }

  // Delete folder
  const deleteFolder = async (folderId: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      await deleteDoc(doc(db, "folders", folderId))
    } catch (error) {
      console.error("Error deleting folder:", error)
      throw error
    }
  }

  // Create tag
  const createTag = async (name: string, color = "#8a7559") => {
    if (!user) throw new Error("User not authenticated")

    try {
      const docRef = await addDoc(collection(db, "tags"), {
        userId: user.uid,
        name,
        color,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error creating tag:", error)
      throw error
    }
  }

  // Update tag
  const updateTag = async (tagId: string, updates: Partial<Tag>) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const tagRef = doc(db, "tags", tagId)
      await updateDoc(tagRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating tag:", error)
      throw error
    }
  }

  // Delete tag
  const deleteTag = async (tagId: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      await deleteDoc(doc(db, "tags", tagId))
    } catch (error) {
      console.error("Error deleting tag:", error)
      throw error
    }
  }

  // Toggle favorite
  const toggleFavorite = async (noteId: string, isFavorite: boolean) => {
    await updateNote(noteId, { isFavorite })
  }

  return {
    user,
    notes,
    folders,
    tags,
    loading,
    createNote,
    updateNote,
    deleteNote,
    createFolder,
    updateFolder,
    deleteFolder,
    createTag,
    updateTag,
    deleteTag,
    toggleFavorite,
  }
}
