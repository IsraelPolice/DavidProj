/*
  # Fix Offices RLS Policies

  ## Changes Made
  
  1. Fixed RLS Policies
    - Fixed `offices` SELECT policy to use `user_id` instead of `id`
    - Fixed `offices` UPDATE policy to use `user_id` instead of `id`
    - Fixed `office_members` policies to use `user_id` instead of `id`
  
  2. Security
    - Ensures users can only access their own office data
    - Maintains role-based access control for admins
*/

-- Drop and recreate offices policies with correct user_id references
DROP POLICY IF EXISTS "Users can view their office" ON offices;
DROP POLICY IF EXISTS "Admins can update their office" ON offices;

CREATE POLICY "Users can view their office"
  ON offices FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT office_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update their office"
  ON offices FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT office_id FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT office_id FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Drop and recreate office_members policies with correct user_id references
DROP POLICY IF EXISTS "Office members can view their office members" ON office_members;
DROP POLICY IF EXISTS "Admins can manage office members" ON office_members;

CREATE POLICY "Office members can view their office members"
  ON office_members FOR SELECT
  TO authenticated
  USING (
    office_id IN (SELECT office_id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage office members"
  ON office_members FOR ALL
  TO authenticated
  USING (
    office_id IN (
      SELECT office_id FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    office_id IN (
      SELECT office_id FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fix cases policies to use user_id
DROP POLICY IF EXISTS "Admins and lawyers can view office cases" ON cases;
DROP POLICY IF EXISTS "Admins and lawyers can create cases" ON cases;
DROP POLICY IF EXISTS "Admins and lawyers can update cases" ON cases;

CREATE POLICY "Admins and lawyers can view office cases"
  ON cases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'lawyer')
    )
    OR
    id IN (
      SELECT linked_case_id FROM profiles 
      WHERE user_id = auth.uid() AND role = 'client'
    )
  );

CREATE POLICY "Admins and lawyers can create cases"
  ON cases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'lawyer')
    )
  );

CREATE POLICY "Admins and lawyers can update cases"
  ON cases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'lawyer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('admin', 'lawyer')
    )
  );

-- Fix lawyers policies to use user_id
DROP POLICY IF EXISTS "Users can view office lawyers" ON lawyers;
DROP POLICY IF EXISTS "Admins can create lawyers" ON lawyers;
DROP POLICY IF EXISTS "Admins can update lawyers" ON lawyers;
DROP POLICY IF EXISTS "Admins can delete lawyers" ON lawyers;

CREATE POLICY "Users can view office lawyers"
  ON lawyers FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT om.lawyer_id FROM office_members om
      JOIN profiles p ON p.office_id = om.office_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create lawyers"
  ON lawyers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update lawyers"
  ON lawyers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete lawyers"
  ON lawyers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );
