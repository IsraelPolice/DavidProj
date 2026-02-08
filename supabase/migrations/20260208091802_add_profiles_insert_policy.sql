/*
  # הוספת פוליסי INSERT לטבלת profiles

  ## שינויים
  - הוספת פוליסי שמאפשר למשתמשים מאומתים ליצור פרופיל חדש
  - הפוליסי מוודא שהמשתמש יכול ליצור רק את הפרופיל של עצמו

  ## אבטחה
  - מאפשר INSERT רק למשתמשים מאומתים
  - מוודא ש-user_id תואם ל-auth.uid()
*/

-- הוספת פוליסי INSERT לטבלת profiles
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
