import { supabase } from '../lib/supabase.js';

export const tasksService = {
  async getTasksByCase(caseId) {
    const { data, error } = await supabase
      .from('case_tasks')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllTasks() {
    const { data, error } = await supabase
      .from('case_tasks')
      .select(`
        *,
        case:cases(id, first_name, last_name, case_num, docs_deadline, case_documents(status))
      `)
      .eq('done', false)
      .order('deadline', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createTask(caseId, taskData) {
    const { data, error } = await supabase
      .from('case_tasks')
      .insert({
        case_id: caseId,
        text: taskData.text,
        urgency: taskData.urgency || 'low',
        deadline: taskData.deadline,
        done: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(id, updates) {
    const { data, error } = await supabase
      .from('case_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleTask(id, done) {
    const { data, error } = await supabase
      .from('case_tasks')
      .update({ done })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(id) {
    const { error } = await supabase
      .from('case_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
