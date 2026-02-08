import { supabase } from '../lib/supabase.js';

export const documentsService = {
  async getDocumentsByCase(caseId) {
    const { data, error } = await supabase
      .from('case_documents')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createDocument(caseId, docName) {
    const { data, error } = await supabase
      .from('case_documents')
      .insert({
        case_id: caseId,
        doc_name: docName,
        status: 'none'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDocumentStatus(id, status) {
    const { data, error } = await supabase
      .from('case_documents')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDocumentName(id, newName) {
    const { data, error } = await supabase
      .from('case_documents')
      .update({ doc_name: newName })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDocument(id) {
    const { error } = await supabase
      .from('case_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
