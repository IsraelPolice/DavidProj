/*
  # Refresh Schema Cache
  
  1. Purpose
    - Force PostgREST to reload schema cache
    - Fix relationship detection between cases and timeline_events
  
  2. Changes
    - Send reload notification to PostgREST
*/

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
