import { supabase } from '../lib/supabase.js';

export const officeService = {
  async getOfficeInfo() {
    const { data: profile } = await supabase
      .from('profiles')
      .select('office_id, role')
      .eq('id', (await supabase.auth.getUser()).data.user.id)
      .single();

    if (!profile?.office_id) return null;

    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('id', profile.office_id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateOffice(officeId, updates) {
    const { data, error } = await supabase
      .from('offices')
      .update(updates)
      .eq('id', officeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addLawyerToOffice(lawyerId, officeId) {
    const { error } = await supabase
      .from('office_members')
      .insert({
        office_id: officeId,
        lawyer_id: lawyerId
      });

    if (error) throw error;
  },

  async removeLawyerFromOffice(lawyerId, officeId) {
    const { error } = await supabase
      .from('office_members')
      .delete()
      .eq('office_id', officeId)
      .eq('lawyer_id', lawyerId);

    if (error) throw error;
  }
};
