import { supabase } from "../lib/supabase.js";

export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signUp(email, password, fullName, role = "lawyer", officeName = null) {
    // 1. הרשמה למערכת ה-Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      throw error;
    }

    if (data.user) {
      let officeId = null;

      // 2. טיפול במשרד (Office)
      if (role === "admin" && officeName) {
        // יצירת משרד חדש עבור אדמין
        const { data: officeData, error: officeError } = await supabase
          .from("offices")
          .insert({ name: officeName })
          .select()
          .single();

        if (officeError) {
          console.error("Office creation error:", officeError);
          throw officeError;
        }
        officeId = officeData.id;
      } else {
        // שיוך למשרד קיים עבור עורך דין רגיל (לוקח את המשרד הראשון במערכת)
        const { data: existingOffice } = await supabase
          .from("offices")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existingOffice) {
          officeId = existingOffice.id;
        }
      }

      // 3. עדכון הפרופיל (הפרופיל נוצר אוטומטית ע"י הטריגר ב-DB)
      // אנחנו משתמשים ב-upsert כדי שזה יעבוד גם אם הטריגר קצת איטי
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        user_id: data.user.id,
        full_name: fullName,
        role: role,
        office_id: officeId,
      });

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      console.log("Signup and Profile setup complete");
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*, offices(*)") // מושך גם את פרטי המשרד בבת אחת
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};
