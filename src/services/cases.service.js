import { supabase } from "../lib/supabase.js";

export const casesService = {
  // שליפת כל התיקים עם המידע הנלווה
  async getAllCases() {
    const { data, error } = await supabase
      .from("cases")
      .select(
        `
        *,
        case_type:case_types(name),
        case_lawyers(lawyer:lawyers(name)),
        case_tasks(*),
        case_documents(*),
        chat_messages(*)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all cases:", error);
      throw error;
    }
    return data || [];
  },

  // שליפת תיק ספציפי לפי ID
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
        case_templates(template:templates(*, template_steps(*)))
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

  // יצירת תיק חדש כולל הגדרות ברירת מחדל
  async createCase(caseData) {
    // יצירת כותרת אוטומטית במידה ולא סופקה
    const autoTitle =
      caseData.title ||
      `${caseData.firstName || ""} ${caseData.lastName || ""}`.trim() ||
      "תיק חדש";

    // הוספת התיק לטבלת cases
    const { data: caseResult, error: caseError } = await supabase
      .from("cases")
      .insert({
        title: autoTitle,
        case_num: caseData.caseNum,
        first_name: caseData.firstName,
        last_name: caseData.lastName,
        tz: caseData.tz,
        phone: caseData.phone,
        city: caseData.city,
        street: caseData.street,
        hmo: caseData.hmo,
        case_type_id: caseData.caseTypeId,
        status: caseData.status || "open",
        docs_deadline: caseData.docsDeadline,
        open_date: caseData.openDate || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (caseError) {
      console.error("Error in createCase (inserting case):", caseError);
      throw caseError;
    }

    // הוספת עורכי דין לתיק (קשר רבים לרבים)
    if (caseData.lawyerIds && caseData.lawyerIds.length > 0) {
      const lawyerInserts = caseData.lawyerIds.map((lawyerId) => ({
        case_id: caseResult.id,
        lawyer_id: lawyerId,
      }));

      const { error: lawyersError } = await supabase
        .from("case_lawyers")
        .insert(lawyerInserts);

      if (lawyersError)
        console.error("Error adding lawyers to case:", lawyersError);
    }

    // יצירת מסמכי חובה כברירת מחדל לכל תיק חדש
    const defaultDocs = [
      {
        case_id: caseResult.id,
        doc_name: "ייפוי כוח",
        status: "none",
        name: "ייפוי כוח",
      },
      {
        case_id: caseResult.id,
        doc_name: "הסכם שכר טרחה",
        status: "none",
        name: "הסכם שכר טרחה",
      },
      {
        case_id: caseResult.id,
        doc_name: "ותרנות על סודיות רפואית",
        status: "none",
        name: "וסר",
      },
    ];

    const { error: docsError } = await supabase
      .from("case_documents")
      .insert(defaultDocs);

    if (docsError) console.error("Error adding default documents:", docsError);

    return caseResult;
  },

  // עדכון פרטי תיק
  async updateCase(id, updates) {
    const { data, error } = await supabase
      .from("cases")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating case ${id}:`, error);
      throw error;
    }
    return data;
  },

  // מחיקת תיק
  async deleteCase(id) {
    const { error } = await supabase.from("cases").delete().eq("id", id);

    if (error) {
      console.error(`Error deleting case ${id}:`, error);
      throw error;
    }
    return true;
  },

  // חישוב מספר התיק הבא ברצף
  async getNextCaseNumber() {
    const { data, error } = await supabase
      .from("cases")
      .select("case_num")
      .order("case_num", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching next case number:", error);
      throw error;
    }

    if (data && data.length > 0 && data[0].case_num) {
      // ניקוי תווים שאינם מספרים למקרה שיש פורמט מיוחד
      const lastNum = parseInt(data[0].case_num.toString().replace(/\D/g, ""));
      return isNaN(lastNum) ? "55001" : String(lastNum + 1);
    }

    return "55001";
  },

  // עדכון רשימת עורכי הדין המשויכים לתיק
  async updateCaseLawyers(caseId, lawyerIds) {
    // שלב 1: מחיקת השיוכים הקיימים
    const { error: deleteError } = await supabase
      .from("case_lawyers")
      .delete()
      .eq("case_id", caseId);

    if (deleteError) throw deleteError;

    // שלב 2: הוספת השיוכים החדשים במידה ויש
    if (lawyerIds && lawyerIds.length > 0) {
      const inserts = lawyerIds.map((lawyerId) => ({
        case_id: caseId,
        lawyer_id: lawyerId,
      }));

      const { error: insertError } = await supabase
        .from("case_lawyers")
        .insert(inserts);

      if (insertError) throw insertError;
    }
    return true;
  },
};
