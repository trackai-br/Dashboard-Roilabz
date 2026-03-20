-- Add user_id column to oauth_states table
-- This allows the callback to identify the user without depending on cookies/sessions
ALTER TABLE public.oauth_states ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Remove the default after adding the column
ALTER TABLE public.oauth_states ALTER COLUMN user_id DROP DEFAULT;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS oauth_states_user_id_idx ON public.oauth_states(user_id);
