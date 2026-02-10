import { supabase } from "../lib/supabase.js";

export const casesService = {
  /**
   * שליפת תיק ספציפי לפי מזהה כולל כל הישויות הקשורות
   */
  async getCaseById(caseId) {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select(
          `
          *,
          case_type:case_types(name),
          case_documents(*),
          case_tasks(*),
          case_calls(*),
          timeline_events(*, event_files(*)),
          case_lawyers(
            lawyer:profiles(full_name, name)
          )
        `,
        )
        .eq("id", caseId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error in getCaseById:", err);
      throw err;
    }
  },

  async getNextCaseNumber() {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("case_num")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].case_num) {
        const lastNum = parseInt(String(data[0].case_num).replace(/\D/g, ""));
        return isNaN(lastNum) ? "55001" : String(lastNum + 1);
      }
      return "55001";
    } catch (err) {
      console.error("Error in getNextCaseNumber:", err);
      return "55001";
    }
  },

  async getAllCases() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

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
          case_documents(*),
          case_lawyers(lawyer:profiles(full_name, name))
        `,
        )
        .eq("office_id", profile?.office_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error in getAllCases:", err);
      return [];
    }
  },

  async createCase(caseData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("office_id")
        .eq("id", user.id)
        .single();

      // שלב 1: יצירת התיק
      const { data: caseResult, error: caseError } = await supabase
        .from("cases")
        .insert({
          title: `${caseData.firstName} ${caseData.lastName}`.trim(),
          case_num: caseData.caseNum,
          first_name: caseData.firstName,
          last_name: caseData.lastName,
          tz: caseData.tz,
          phone: caseData.phone,
          case_type_id: caseData.caseTypeId,
          office_id: profile?.office_id,
          status: "open",
          open_date: caseData.openDate || new Date().toISOString(),
          docs_deadline: caseData.docsDeadline,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // שלב 2: שיוך עורכי דין לתיק (אם קיימים)
      if (
        caseData.lawyerIds &&
        Array.isArray(caseData.lawyerIds) &&
        caseData.lawyerIds.length > 0
      ) {
        const lawyerInserts = caseData.lawyerIds.map((id) => ({
          case_id: caseResult.id,
          lawyer_id: id,
        }));

        const { error: lawyerError } = await supabase
          .from("case_lawyers")
          .insert(lawyerInserts);

        if (lawyerError) console.error("Error linking lawyers:", lawyerError);
      }

      return caseResult;
    } catch (err) {
      console.error("Error in createCase:", err);
      throw err;
    }
  },

  async updateCase(caseId, updateData) {
    const { data, error } = await supabase
      .from("cases")
      .update(updateData)
      .eq("id", caseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export default casesService;
