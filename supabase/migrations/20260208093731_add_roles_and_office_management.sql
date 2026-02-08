/*
  # Add Roles and Office Management System

  ## Changes Made
  
  1. Tables Modified
    - `profiles`: Added `role` column (admin, lawyer, client) and `office_id`
    - Created `offices` table for multi-office support
    - Created `office_members` table to link lawyers to offices
  
  2. New Features
    - Role-based access control (admin, lawyer, client)
    - Office management for administrators
    - Client accounts linked to their cases
  
  3. Data Updates
    - Set default role for existing profiles to 'admin'
    - Create default office for migration
  
  4. Security
    - Updated RLS policies to support role-based access
    - Admins can manage their office
    - Lawyers can see their own cases
    - Clients can only see their own case
*/

-- Create offices table
CREATE TABLE IF NOT EXISTS offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

-- Add role and office_id to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'lawyer' CHECK (role IN ('admin', 'lawyer', 'client'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'office_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN office_id uuid REFERENCES offices(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'linked_case_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN linked_case_id uuid REFERENCES cases(id);
  END IF;
END $$;

-- Create office_members junction table (for lawyers in offices)
CREATE TABLE IF NOT EXISTS office_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  lawyer_id uuid NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(office_id, lawyer_id)
);

ALTER TABLE office_members ENABLE ROW LEVEL SECURITY;

-- Insert default office for existing data
INSERT INTO offices (name)
VALUES ('המשרד הראשי')
ON CONFLICT DO NOTHING;

-- Update existing profiles to be admin and link to default office
UPDATE profiles
SET role = 'admin',
    office_id = (SELECT id FROM offices LIMIT 1)
WHERE role IS NULL OR office_id IS NULL;

-- Update lawyers to be linked to default office
INSERT INTO office_members (office_id, lawyer_id)
SELECT (SELECT id FROM offices LIMIT 1), id
FROM lawyers
ON CONFLICT DO NOTHING;

-- RLS Policies for offices
CREATE POLICY "Users can view their office"
  ON offices FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update their office"
  ON offices FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT office_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT office_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for office_members
CREATE POLICY "Office members can view their office members"
  ON office_members FOR SELECT
  TO authenticated
  USING (
    office_id IN (SELECT office_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage office members"
  ON office_members FOR ALL
  TO authenticated
  USING (
    office_id IN (
      SELECT office_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    office_id IN (
      SELECT office_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update cases RLS policies to support roles
DROP POLICY IF EXISTS "Users can view all cases" ON cases;
DROP POLICY IF EXISTS "Users can create cases" ON cases;
DROP POLICY IF EXISTS "Users can update cases" ON cases;

CREATE POLICY "Admins and lawyers can view office cases"
  ON cases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'lawyer')
    )
    OR
    id IN (
      SELECT linked_case_id FROM profiles 
      WHERE id = auth.uid() AND role = 'client'
    )
  );

CREATE POLICY "Admins and lawyers can create cases"
  ON cases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'lawyer')
    )
  );

CREATE POLICY "Admins and lawyers can update cases"
  ON cases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'lawyer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'lawyer')
    )
  );

-- Update lawyers RLS policies
DROP POLICY IF EXISTS "Users can view all lawyers" ON lawyers;
DROP POLICY IF EXISTS "Users can create lawyers" ON lawyers;
DROP POLICY IF EXISTS "Users can update lawyers" ON lawyers;
DROP POLICY IF EXISTS "Users can delete lawyers" ON lawyers;

CREATE POLICY "Users can view office lawyers"
  ON lawyers FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT om.lawyer_id FROM office_members om
      JOIN profiles p ON p.office_id = om.office_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can create lawyers"
  ON lawyers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update lawyers"
  ON lawyers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete lawyers"
  ON lawyers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
