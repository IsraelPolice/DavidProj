import { supabase } from "../lib/supabase.js";

export const officeService = {
  async getOfficeInfo() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("office_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.office_id) return null;

    const { data, error } = await supabase
      .from("offices")
      .select("*")
      .eq("id", profile.office_id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateOffice(officeId, updates) {
    const { data, error } = await supabase
      .from("offices")
      .update(updates)
      .eq("id", officeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeLawyerFromOffice(lawyerId, officeId) {
    const { error } = await supabase
      .from("office_members")
      .delete()
      .eq("office_id", officeId)
      .eq("lawyer_id", lawyerId);

    if (error) throw error;
  },

  async getOfficeWithMembers(officeId) {
    const { data, error } = await supabase
      .from("offices")
      .select(
        `
        *,
        members:office_members(
          id,
          lawyer:lawyers(*)
        )
      `,
      )
      .eq("id", officeId)
      .single();

    if (error) throw error;
    return data;
  },

  // גרסה מתוקנת ללא Edge Function למניעת שגיאות CORS
  async addLawyerToOffice(officeId, name, email, password) {
    console.log("Adding lawyer to office:", { officeId, name, email });

    // 1. יצירת רשומת עורך הדין בטבלת ה-Lawyers
    const { data: lawyer, error: lawyerError } = await supabase
      .from("lawyers")
      .insert({
        name,
        email,
        is_active: true,
      })
      .select()
      .single();

    if (lawyerError) {
      console.error("Error creating lawyer record:", lawyerError);
      throw lawyerError;
    }

    // 2. יצירת הקשר בין עורך הדין למשרד בטבלת office_members
    const { error: memberError } = await supabase
      .from("office_members")
      .insert({
        office_id: officeId,
        lawyer_id: lawyer.id,
      });

    if (memberError) {
      console.error("Error linking lawyer to office:", memberError);
      throw memberError;
    }

    return { success: true, lawyer };
  },
};
