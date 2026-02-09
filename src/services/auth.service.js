import { supabase } from "../lib/supabase.js";

export const authService = {
  // ... (signIn unchanged)
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: role },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      throw error;
    }

    // בדיקה אם המשתמש נוצר אבל מחכה לאימות מייל (אם האופציה דלוקה)
    if (data?.user && data?.session === null) {
      console.log("User created, but needs email confirmation.");
      // כאן אפשר להחזיר הודעה לממשק: "אנא בדוק את תיבת המייל שלך"
      return { ...data, needsConfirmation: true };
    }

    if (data.user) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      let officeId = null;

      if (role === "admin" && officeName) {
        const { data: officeData, error: officeError } = await supabase
          .from("offices")
          .insert({ name: officeName })
          .select()
          .single();
        if (officeError) throw officeError;
        officeId = officeData.id;
      } else {
        const { data: existingOffice } = await supabase
          .from("offices")
          .select("id")
          .limit(1)
          .maybeSingle();
        if (existingOffice) officeId = existingOffice.id;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            user_id: data.user.id,
            full_name: fullName,
            role: role,
            office_id: officeId,
          },
          { onConflict: "id" },
        );

      if (profileError) throw profileError;
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
