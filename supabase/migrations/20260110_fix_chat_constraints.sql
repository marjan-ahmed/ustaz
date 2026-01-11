-- First, let's drop the existing foreign key constraints
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_recipient_id_fkey;

-- We'll modify the chat_messages table to allow UUIDs from both auth.users and ustaz_registrations
-- Since both tables use UUID primary keys, we'll make the foreign key constraints more flexible
-- by allowing any valid UUID, and add application-level validation

-- Add comments to document that the IDs can refer to either auth.users or ustaz_registrations
COMMENT ON COLUMN chat_messages.sender_id IS 'Can reference either auth.users.id or ustaz_registrations.userId';
COMMENT ON COLUMN chat_messages.recipient_id IS 'Can reference either auth.users.id or ustaz_registrations.userId';

-- Create a function to validate that the user ID exists in either table
CREATE OR REPLACE FUNCTION validate_user_exists(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) OR
    EXISTS(SELECT 1 FROM ustaz_registrations WHERE userId = user_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to validate chat message user IDs
CREATE OR REPLACE FUNCTION validate_chat_message_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate sender_id exists in either table
  IF NOT validate_user_exists(NEW.sender_id) THEN
    RAISE EXCEPTION 'Sender user ID does not exist in either auth.users or ustaz_registrations';
  END IF;

  -- Validate recipient_id exists in either table
  IF NOT validate_user_exists(NEW.recipient_id) THEN
    RAISE EXCEPTION 'Recipient user ID does not exist in either auth.users or ustaz_registrations';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to enforce the validation
DROP TRIGGER IF EXISTS validate_chat_message_users_trigger ON chat_messages;
CREATE TRIGGER validate_chat_message_users_trigger
  BEFORE INSERT OR UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_chat_message_users();

-- Add RLS policies for chat messages to ensure users can only access their own conversations
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see messages where they are sender or recipient
CREATE POLICY "Users can view their own chat messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() = recipient_id OR
    auth.uid() IN (
      SELECT userId FROM ustaz_registrations WHERE userId = sender_id OR userId = recipient_id
    )
  );

-- Policy to allow users to insert messages where they are the sender
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy to allow users to update their own messages (if needed)
CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Also update the profiles table to ensure it includes both consumer and provider profiles
-- Sync existing provider profiles to the profiles table
INSERT INTO profiles (id, full_name, email, created_at)
SELECT
  ur.userId as id,
  CONCAT(ur.firstName, ' ', ur.lastName) as full_name,
  ur.email,
  NOW() as created_at
FROM ustaz_registrations ur
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = ur.userId
)
ON CONFLICT (id) DO NOTHING;