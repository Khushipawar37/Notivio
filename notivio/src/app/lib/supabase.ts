import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  folder_id?: string
  is_favorite: boolean
  created_at: string
  updated_at: string
  folder?: Folder
  tags?: Tag[]
}
