-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profiles are viewable by users who created them." ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Sync existing users from ustaz_registrations to profiles if they exist in auth.users
INSERT INTO profiles (id, full_name, email, created_at)
SELECT
  au.id,
  CONCAT(ur."firstName", ' ', ur."lastName") as full_name,
  au.email,
  au.created_at
FROM auth.users au
JOIN ustaz_registrations ur ON au.id = ur."userId"
ON CONFLICT (id) DO NOTHING;

-- Now, let's fix the chat_messages table by updating the foreign key constraints
-- First, drop the existing foreign key constraints
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_recipient_id_fkey;

-- Recreate them properly (they should already point to auth.users, which is correct)
-- But let's make sure they exist
ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_recipient_id_fkey
FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;