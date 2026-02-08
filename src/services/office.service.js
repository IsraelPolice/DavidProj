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

  async removeLawyerFromOffice(lawyerId, officeId) {
    const { error } = await supabase
      .from('office_members')
      .delete()
      .eq('office_id', officeId)
      .eq('lawyer_id', lawyerId);

    if (error) throw error;
  },

  async getOfficeWithMembers(officeId) {
    const { data, error } = await supabase
      .from('offices')
      .select(`
        *,
        members:office_members(
          id,
          lawyer:lawyers(*)
        )
      `)
      .eq('id', officeId)
      .single();

    if (error) throw error;
    return data;
  },

  async addLawyerToOffice(officeId, name, email, password) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      throw new Error('Not authenticated');
    }

    const token = session.access_token;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-lawyer-to-office`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officeId,
          name,
          email,
          password
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Edge function error:', result);
      throw new Error(result.error || 'Failed to add lawyer');
    }

    return result;
  }
};
