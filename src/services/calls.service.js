import { supabase } from '../lib/supabase.js';

export const callsService = {
  async getCallsByCase(caseId) {
    const { data, error } = await supabase
      .from('case_calls')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createCall(caseId, content, callDate) {
    const { data, error } = await supabase
      .from('case_calls')
      .insert({
        case_id: caseId,
        content,
        call_date: callDate
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCall(id) {
    const { error } = await supabase
      .from('case_calls')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
