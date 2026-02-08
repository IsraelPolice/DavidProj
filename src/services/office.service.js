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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    const { data: lawyer, error: lawyerError } = await supabase
      .from('lawyers')
      .insert({ name })
      .select()
      .single();

    if (lawyerError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw lawyerError;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        role: 'lawyer',
        office_id: officeId
      })
      .eq('user_id', authData.user.id);

    if (profileError) {
      await supabase.from('lawyers').delete().eq('id', lawyer.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    const { error: memberError } = await supabase
      .from('office_members')
      .insert({
        office_id: officeId,
        lawyer_id: lawyer.id
      });

    if (memberError) {
      await supabase.from('lawyers').delete().eq('id', lawyer.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw memberError;
    }

    return { lawyer, user: authData.user };
  }
};
