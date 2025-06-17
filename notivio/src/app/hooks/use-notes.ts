"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/auth/auth-provider";
import type { Note, Folder, Tag } from "../lib/supabase";

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch folders
      const { data: foldersData } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch tags
      const { data: tagsData } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch notes with folder and tags
      const { data: notesData } = await supabase
        .from("notes")
        .select(
          `
          *,
          folder:folders(*),
          note_tags(tag:tags(*))
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Transform notes data to include tags array
      const transformedNotes =
        notesData?.map((note) => ({
          ...note,
          tags: note.note_tags?.map((nt: any) => nt.tag) || [],
        })) || [];

      setFolders(foldersData || []);
      setTags(tagsData || []);
      setNotes(transformedNotes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create note
  const createNote = async (noteData: {
    title: string;
    content: string;
    folder_id?: string;
    tag_ids?: string[];
  }) => {
    if (!user) return;

    try {
      const { data: note, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: noteData.title,
          content: noteData.content,
          folder_id: noteData.folder_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add tags if provided
      if (noteData.tag_ids && noteData.tag_ids.length > 0) {
        const tagInserts = noteData.tag_ids.map((tag_id) => ({
          note_id: note.id,
          tag_id,
        }));

        await supabase.from("note_tags").insert(tagInserts);
      }

      await fetchData(); // Refresh data
      return note;
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  };

  // Create folder
  const createFolder = async (name: string, color = "#c6ac8f") => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("folders")
        .insert({
          user_id: user.id,
          name,
          color,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchData(); // Refresh data
      return data;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  };

  // Create tag
  const createTag = async (name: string, color = "#8a7559") => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({
          user_id: user.id,
          name,
          color,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchData(); // Refresh data
      return data;
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  };

  // Update note
  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notes")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };

  // Delete note
  const deleteNote = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  return {
    notes,
    folders,
    tags,
    loading,
    createNote,
    createFolder,
    createTag,
    updateNote,
    deleteNote,
    refreshData: fetchData,
  };
}
