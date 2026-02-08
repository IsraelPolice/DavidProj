import { supabase } from '../lib/supabase.js';

export const caseTypesService = {
  async getAllCaseTypes() {
    const { data, error } = await supabase
      .from('case_types')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createCaseType(name) {
    const { data, error } = await supabase
      .from('case_types')
      .insert({ name, is_active: true })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCaseType(id, name) {
    const { data, error } = await supabase
      .from('case_types')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCaseType(id) {
    const { error } = await supabase
      .from('case_types')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }
};
