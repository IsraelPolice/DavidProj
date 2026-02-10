import { supabase } from "../lib/supabase.js";

export const casesService = {
  async getAllCases() {
    // שליפת הפרופיל של המשתמש כדי לדעת לאיזה משרד הוא שייך
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("office_id")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase
      .from("cases")
      .select(
        `
        *,
        case_type:case_types(name),
        case_documents(*)
      `,
      )
      .eq("office_id", profile.office_id) // סינון לפי משרד!
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCaseById(id) {
    const { data, error } = await supabase
      .from("cases")
      .select(
        `
        *,
        case_type:case_types(name),
        case_lawyers(lawyer:profiles(*)),
        case_tasks(*),
        case_documents(*),
        timeline_events(*),
        case_calls(*)
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createCase(caseData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("office_id")
      .eq("id", user.id)
      .single();

    const { data: caseResult, error: caseError } = await supabase
      .from("cases")
      .insert({
        title: `${caseData.firstName} ${caseData.lastName}`,
        case_num: caseData.caseNum,
        first_name: caseData.firstName,
        last_name: caseData.lastName,
        tz: caseData.tz,
        phone: caseData.phone,
        case_type_id: caseData.caseTypeId,
        office_id: profile.office_id, // שיוך למשרד ביצירה
        status: "open",
        open_date: caseData.openDate,
      })
      .select()
      .single();

    if (caseError) throw caseError;
    return caseResult;
  },
};
