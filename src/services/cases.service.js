import { supabase } from "../lib/supabase.js";

export const casesService = {
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

    if (error) throw error;
    return data || [];
  },

  async getCaseById(id) {
    console.log("casesService.getCaseById called with id:", id);
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

    console.log("casesService.getCaseById result:", { data, error });
    if (error) throw error;
    return data;
  },

  async createCase(caseData) {
    // יצירת כותרת אוטומטית משם פרטי ומשפחה כדי למנוע שגיאת NOT NULL
    const autoTitle =
      `${caseData.firstName || ""} ${caseData.lastName || ""}`.trim() ||
      "תיק חדש";

    const { data: caseResult, error: caseError } = await supabase
      .from("cases")
      .insert({
        title: autoTitle, // הוספת הכותרת
        case_num: caseData.caseNum,
        first_name: caseData.firstName,
        last_name: caseData.lastName,
        tz: caseData.tz,
        phone: caseData.phone,
        city: caseData.city,
        street: caseData.street,
        hmo: caseData.hmo,
        case_type_id: caseData.caseTypeId,
        status: "open",
        docs_deadline: caseData.docsDeadline,
        open_date: caseData.openDate,
      })
      .select()
      .single();

    if (caseError) {
      console.error("Error in createCase:", caseError);
      throw caseError;
    }

    // הוספת עורכי דין לתיק אם נבחרו
    if (caseData.lawyerIds && caseData.lawyerIds.length > 0) {
      const lawyerInserts = caseData.lawyerIds.map((lawyerId) => ({
        case_id: caseResult.id,
        lawyer_id: lawyerId,
      }));

      const { error: lawyersError } = await supabase
        .from("case_lawyers")
        .insert(lawyerInserts);

      if (lawyersError) console.error("Error adding lawyers:", lawyersError);
    }

    // יצירת מסמכי ברירת מחדל
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
      { case_id: caseResult.id, doc_name: "וסר", status: "none", name: "וסר" },
    ];

    const { error: docsError } = await supabase
      .from("case_documents")
      .insert(defaultDocs);

    if (docsError) console.error("Error adding default docs:", docsError);

    return caseResult;
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

  async deleteCase(id) {
    const { error } = await supabase.from("cases").delete().eq("id", id);

    if (error) throw error;
  },

  async getNextCaseNumber() {
    const { data, error } = await supabase
      .from("cases")
      .select("case_num")
      .order("case_num", { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0 && data[0].case_num) {
      const lastNum = parseInt(data[0].case_num);
      return isNaN(lastNum) ? "55001" : String(lastNum + 1);
    }

    return "55001";
  },

  async updateCaseLawyers(caseId, lawyerIds) {
    // מחיקת הקשרים הישנים
    await supabase.from("case_lawyers").delete().eq("case_id", caseId);

    // הוספת החדשים
    if (lawyerIds && lawyerIds.length > 0) {
      const inserts = lawyerIds.map((lawyerId) => ({
        case_id: caseId,
        lawyer_id: lawyerId,
      }));

      const { error } = await supabase.from("case_lawyers").insert(inserts);

      if (error) throw error;
    }
  },
};
