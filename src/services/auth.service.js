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
    console.log("Starting signup process...");

    // 1. הרשמה למערכת ה-Auth של Supabase
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
      // --- פתרון קריטי: המתנה קלה כדי לוודא שהמשתמש נוצר בטבלאות המערכת ---
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let officeId = null;

      // 2. טיפול במשרד (Office)
      if (role === "admin" && officeName) {
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
        const { data: existingOffice } = await supabase
          .from("offices")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existingOffice) {
          officeId = existingOffice.id;
        }
      }

      // 3. יצירת/עדכון הפרופיל בטבלת profiles
      // שימוש ב-upsert פותר את שגיאת ה-409 (Conflict) אם הטריגר ב-DB כבר יצר שורה
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          user_id: data.user.id,
          full_name: fullName,
          role: role,
          office_id: officeId,
        },
        {
          onConflict: "id", // מעדכן אם ה-ID כבר קיים
        },
      );

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
      .select("*, offices(*)")
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
