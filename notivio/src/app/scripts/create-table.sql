-- Create users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#c6ac8f',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8a7559',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create note_tags junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Folders policies
CREATE POLICY "Users can view own folders" ON folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON folders FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- Note_tags policies
CREATE POLICY "Users can view own note_tags" ON note_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
);
CREATE POLICY "Users can create own note_tags" ON note_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
);
CREATE POLICY "Users can delete own note_tags" ON note_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
);
