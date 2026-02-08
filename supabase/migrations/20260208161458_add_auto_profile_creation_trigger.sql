/*
  # Add automatic profile creation trigger

  1. Changes
    - Creates a trigger function that automatically creates a profile when a new user signs up
    - This ensures every user in auth.users has a corresponding profile in profiles table
    - Extracts full_name and role from user metadata if available
    - Assigns the user to the first available office by default

  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only triggers on INSERT to auth.users
    - Prevents duplicate profiles with ON CONFLICT DO NOTHING
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  default_office_id uuid;
BEGIN
  -- Get the first office ID (or null if none exists)
  SELECT id INTO default_office_id FROM public.offices LIMIT 1;

  -- Insert the new profile
  INSERT INTO public.profiles (id, user_id, full_name, role, office_id)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'משתמש חדש'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'lawyer'),
    default_office_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists and create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
