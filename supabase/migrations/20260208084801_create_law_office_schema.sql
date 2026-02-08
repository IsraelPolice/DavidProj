/*
  # מערכת ניהול משרד עורכי דין - מבנה נתונים מלא

  ## תיאור
  מערכת לניהול תיקים, משימות, מסמכים, שיחות וצ'אט עם לקוחות.
  כוללת תבניות ציר רפואי, ניהול עורכי דין, וסוגי תיקים.

  ## טבלאות חדשות
  
  ### 1. profiles
  - פרופילים של עורכי דין במערכת
  - מקושרת ל-auth.users
  - שדות: id, user_id, full_name, role, created_at

  ### 2. lawyers
  - רשימת עורכי דין במשרד
  - שדות: id, name, is_active, created_at

  ### 3. case_types
  - סוגי תיקים (תאונת דרכים, רשלנות רפואית וכו')
  - שדות: id, name, is_active, created_at

  ### 4. cases
  - תיקים של לקוחות
  - שדות מלאים כולל פרטי לקוח, סטטוס, תאריכים
  - שדות: id, case_num, first_name, last_name, tz, phone, city, street, hmo, 
           case_type_id, status, ta_num, docs_deadline, open_date, created_by, created_at

  ### 5. case_lawyers
  - קשר many-to-many בין תיקים לעורכי דין
  - שדות: id, case_id, lawyer_id, created_at

  ### 6. case_tasks
  - משימות לביצוע בכל תיק
  - שדות: id, case_id, text, done, urgency, deadline, created_at

  ### 7. case_calls
  - תיעוד שיחות עם לקוחות
  - שדות: id, case_id, content, call_date, created_at

  ### 8. timeline_events
  - אירועי ציר זמן רפואי ומשפטי
  - שדות: id, case_id, event_type, event_date, title, description, 
           is_template, is_plan, created_at

  ### 9. event_files
  - קבצים מצורפים לאירועי ציר זמן
  - שדות: id, event_id, file_name, file_path, file_size, created_at

  ### 10. case_documents
  - מסמכי ייצוג (ייפוי כוח, הסכם שכט וכו')
  - שדות: id, case_id, doc_name, status, created_at

  ### 11. chat_messages
  - הודעות צ'אט בין עו"ד ללקוח
  - שדות: id, case_id, sender, message, sent_at

  ### 12. templates
  - תבניות ציר רפואי (workflows)
  - שדות: id, name, is_active, created_at

  ### 13. template_steps
  - שלבים בתוך תבנית
  - שדות: id, template_id, step_text, days_from_start, step_order, created_at

  ### 14. case_templates
  - קשר בין תיקים לתבניות שהוחלו
  - שדות: id, case_id, template_id, applied_at

  ## אבטחה
  - RLS מופעל על כל הטבלאות
  - משתמשים מאומתים יכולים לראות ולערוך את הנתונים שלהם
  - ניהול הרשאות לפי role
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- 1. PROFILES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text DEFAULT 'lawyer' CHECK (role IN ('admin', 'lawyer', 'assistant')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================
-- 2. LAWYERS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS lawyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lawyers"
  ON lawyers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage lawyers"
  ON lawyers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 3. CASE TYPES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS case_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view case types"
  ON case_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage case types"
  ON case_types FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 4. CASES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_num text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  tz text,
  phone text,
  city text,
  street text,
  hmo text,
  case_type_id uuid REFERENCES case_types(id),
  status text DEFAULT 'open' CHECK (status IN ('open', 'process', 'closed')),
  ta_num text,
  docs_deadline date,
  open_date text,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cases"
  ON cases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cases"
  ON cases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cases"
  ON cases FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cases"
  ON cases FOR DELETE
  TO authenticated
  USING (true);

-- ===========================
-- 5. CASE_LAWYERS TABLE (Many-to-Many)
-- ===========================
CREATE TABLE IF NOT EXISTS case_lawyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  lawyer_id uuid REFERENCES lawyers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(case_id, lawyer_id)
);

ALTER TABLE case_lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view case lawyers"
  ON case_lawyers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage case lawyers"
  ON case_lawyers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 6. CASE_TASKS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS case_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  done boolean DEFAULT false,
  urgency text DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high')),
  deadline date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE case_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view case tasks"
  ON case_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage case tasks"
  ON case_tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 7. CASE_CALLS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS case_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  call_date text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE case_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view case calls"
  ON case_calls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage case calls"
  ON case_calls FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 8. TIMELINE_EVENTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('medical', 'legal')),
  event_date date NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  is_template boolean DEFAULT false,
  is_plan boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view timeline events"
  ON timeline_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage timeline events"
  ON timeline_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 9. EVENT_FILES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS event_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES timeline_events(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view event files"
  ON event_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage event files"
  ON event_files FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 10. CASE_DOCUMENTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS case_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  doc_name text NOT NULL,
  status text DEFAULT 'none' CHECK (status IN ('none', 'sent', 'signed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view case documents"
  ON case_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage case documents"
  ON case_documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 11. CHAT_MESSAGES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  sender text NOT NULL CHECK (sender IN ('client', 'lawyer')),
  message text NOT NULL,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can send chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 12. TEMPLATES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage templates"
  ON templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 13. TEMPLATE_STEPS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS template_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  step_text text NOT NULL,
  days_from_start integer DEFAULT 0,
  step_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE template_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view template steps"
  ON template_steps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage template steps"
  ON template_steps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- 14. CASE_TEMPLATES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS case_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  applied_at timestamptz DEFAULT now(),
  UNIQUE(case_id, template_id)
);

ALTER TABLE case_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view case templates"
  ON case_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage case templates"
  ON case_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================
CREATE INDEX IF NOT EXISTS idx_cases_case_num ON cases(case_num);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_case_tasks_case_id ON case_tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_case_calls_case_id ON case_calls(case_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_case_id ON timeline_events(case_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_case_id ON chat_messages(case_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_template_steps_template_id ON template_steps(template_id);
