import { supabase } from "../lib/supabase.js";

export const casesService = {
  // פונקציה לקבלת המספר הבא - וודא שהיא כתובה בדיוק כך
  async getNextCaseNumber() {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("case_num")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0 && data[0].case_num) {
        const lastNum = parseInt(data[0].case_num);
        return isNaN(lastNum) ? "55001" : String(lastNum + 1);
      }
      return "55001";
    } catch (err) {
      console.error("Error in getNextCaseNumber:", err);
      return "55001"; // ברירת מחדל במקרה תקלה
    }
  },

  async getAllCases() {
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
        case_documents(*)
      `,
      )
      .eq("office_id", profile?.office_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
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
        office_id: profile?.office_id,
        status: "open",
        open_date: caseData.openDate,
        docs_deadline: caseData.docsDeadline,
      })
      .select()
      .single();

    if (caseError) throw caseError;

    // הוספת עורכי דין לתיק
    if (caseData.lawyerIds?.length > 0) {
      const lawyerInserts = caseData.lawyerIds.map((id) => ({
        case_id: caseResult.id,
        lawyer_id: id,
      }));
      await supabase.from("case_lawyers").insert(lawyerInserts);
    }

    return caseResult;
  },
};
