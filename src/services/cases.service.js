import { supabase } from '../lib/supabase.js';

export const casesService = {
  async getAllCases() {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        case_type:case_types(name),
        case_lawyers(lawyer:lawyers(name)),
        case_tasks(*),
        case_documents(*),
        chat_messages(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCaseById(id) {
    console.log('casesService.getCaseById called with id:', id);
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        case_type:case_types(name),
        case_lawyers(lawyer:lawyers(*)),
        case_tasks(*),
        case_calls(*),
        case_documents(*),
        timeline_events(*, event_files(*)),
        chat_messages(*),
        case_templates(template:templates(*, template_steps(*)))
      `)
      .eq('id', id)
      .maybeSingle();

    console.log('casesService.getCaseById result:', { data, error });
    if (error) throw error;
    return data;
  },

  async createCase(caseData) {
    const { data: caseResult, error: caseError } = await supabase
      .from('cases')
      .insert({
        case_num: caseData.caseNum,
        first_name: caseData.firstName,
        last_name: caseData.lastName,
        tz: caseData.tz,
        phone: caseData.phone,
        city: caseData.city,
        street: caseData.street,
        hmo: caseData.hmo,
        case_type_id: caseData.caseTypeId,
        status: 'open',
        docs_deadline: caseData.docsDeadline,
        open_date: caseData.openDate
      })
      .select()
      .single();

    if (caseError) throw caseError;

    if (caseData.lawyerIds && caseData.lawyerIds.length > 0) {
      const lawyerInserts = caseData.lawyerIds.map(lawyerId => ({
        case_id: caseResult.id,
        lawyer_id: lawyerId
      }));

      const { error: lawyersError } = await supabase
        .from('case_lawyers')
        .insert(lawyerInserts);

      if (lawyersError) throw lawyersError;
    }

    const defaultDocs = [
      { case_id: caseResult.id, doc_name: 'ייפוי כוח', status: 'none' },
      { case_id: caseResult.id, doc_name: 'הסכם שכר טרחה', status: 'none' },
      { case_id: caseResult.id, doc_name: 'וסר', status: 'none' }
    ];

    const { error: docsError } = await supabase
      .from('case_documents')
      .insert(defaultDocs);

    if (docsError) throw docsError;

    return caseResult;
  },

  async updateCase(id, updates) {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCase(id) {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getNextCaseNumber() {
    const { data, error } = await supabase
      .from('cases')
      .select('case_num')
      .order('case_num', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].case_num);
      return String(lastNum + 1);
    }

    return '55001';
  },

  async updateCaseLawyers(caseId, lawyerIds) {
    await supabase
      .from('case_lawyers')
      .delete()
      .eq('case_id', caseId);

    if (lawyerIds && lawyerIds.length > 0) {
      const inserts = lawyerIds.map(lawyerId => ({
        case_id: caseId,
        lawyer_id: lawyerId
      }));

      const { error } = await supabase
        .from('case_lawyers')
        .insert(inserts);

      if (error) throw error;
    }
  },

  async applyTemplate(caseId, templateId) {
    const existing = await supabase
      .from('case_templates')
      .select('id')
      .eq('case_id', caseId)
      .eq('template_id', templateId)
      .maybeSingle();

    if (existing.data) {
      throw new Error('תבנית זו כבר הוחלה על תיק זה');
    }

    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*, template_steps(*)')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    const { data: caseData } = await supabase
      .from('cases')
      .select('open_date')
      .eq('id', caseId)
      .single();

    const startDate = caseData.open_date ? new Date(caseData.open_date.split('/').reverse().join('-')) : new Date();

    const events = template.template_steps.map(step => {
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + step.days_from_start);

      return {
        case_id: caseId,
        event_type: 'medical',
        event_date: eventDate.toISOString().split('T')[0],
        title: step.step_text,
        description: '',
        is_template: true,
        is_plan: true
      };
    });

    const { error: eventsError } = await supabase
      .from('timeline_events')
      .insert(events);

    if (eventsError) throw eventsError;

    const { error: linkError } = await supabase
      .from('case_templates')
      .insert({
        case_id: caseId,
        template_id: templateId
      });

    if (linkError) throw linkError;

    return true;
  }
};
