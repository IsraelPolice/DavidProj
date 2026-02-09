import { supabase } from "../lib/supabase.js";

export const casesService = {
  // שליפת כל התיקים עם מידע בסיסי לתצוגת רשימה
  async getAllCases() {
    const { data, error } = await supabase
      .from("cases")
      .select(
        `
        *,
        case_type:case_types(name),
        case_documents(*)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all cases:", error);
      throw error;
    }
    return data || [];
  },

  // שליפת תיק ספציפי עם כל הנתונים הנלווים
  async getCaseById(id) {
    const { data, error } = await supabase
      .from("cases")
      .select(
        `
        *,
        case_type:case_types(name),
        case_lawyers(lawyer:lawyers(*)),
        case_tasks(*),
        case_documents(*),
        chat_messages(*),
        timeline_events(*),
        case_calls(*)
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching case ${id}:`, error);
      throw error;
    }
    return data;
  },

  // יצירת תיק חדש
  async createCase(caseData) {
    const autoTitle =
      caseData.title ||
      `${caseData.firstName || ""} ${caseData.lastName || ""}`.trim() ||
      "תיק חדש";

    const { data: caseResult, error: caseError } = await supabase
      .from("cases")
      .insert({
        title: autoTitle,
        case_num: caseData.caseNum,
        first_name: caseData.firstName,
        last_name: caseData.lastName,
        tz: caseData.tz,
        phone: caseData.phone,
        case_type_id: caseData.caseTypeId,
        status: caseData.status || "open",
        docs_deadline: caseData.docsDeadline,
        open_date: caseData.openDate,
      })
      .select()
      .single();

    if (caseError) throw caseError;

    // הוספת עורכי דין לתיק
    if (caseData.lawyerIds && caseData.lawyerIds.length > 0) {
      const lawyerInserts = caseData.lawyerIds.map((lawyerId) => ({
        case_id: caseResult.id,
        lawyer_id: lawyerId,
      }));
      await supabase.from("case_lawyers").insert(lawyerInserts);
    }

    // יצירת מסמכי חובה ראשוניים
    const defaultDocs = [
      { case_id: caseResult.id, doc_name: "ייפוי כוח", status: "none" },
      { case_id: caseResult.id, doc_name: "הסכם שכר טרחה", status: "none" },
      { case_id: caseResult.id, doc_name: "ויתור סודיות", status: "none" },
    ];
    await supabase.from("case_documents").insert(defaultDocs);

    return caseResult;
  },

  async getNextCaseNumber() {
    const { data, error } = await supabase
      .from("cases")
      .select("case_num")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) return "55001";
    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].case_num);
      return isNaN(lastNum) ? "55001" : String(lastNum + 1);
    }
    return "55001";
  },

  async updateCase(id, updates) {
    const { data, error } = await supabase
      .from("cases")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
