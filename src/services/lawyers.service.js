import { supabase } from '../lib/supabase.js';

export const lawyersService = {
  async getAllLawyers() {
    const { data, error } = await supabase
      .from('lawyers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createLawyer(name) {
    const { data, error } = await supabase
      .from('lawyers')
      .insert({ name, is_active: true })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLawyer(id, name) {
    const { data, error } = await supabase
      .from('lawyers')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLawyer(id) {
    const { error } = await supabase
      .from('lawyers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }
};
