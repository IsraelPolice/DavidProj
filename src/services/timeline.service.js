import { supabase } from '../lib/supabase.js';

export const timelineService = {
  async getEventsByCase(caseId, eventType = null) {
    let query = supabase
      .from('timeline_events')
      .select('*, event_files(*)')
      .eq('case_id', caseId);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query.order('event_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async createEvent(caseId, eventData) {
    const { data, error } = await supabase
      .from('timeline_events')
      .insert({
        case_id: caseId,
        event_type: eventData.eventType,
        event_date: eventData.eventDate,
        title: eventData.title,
        description: eventData.description || '',
        is_template: eventData.isTemplate || false,
        is_plan: eventData.isPlan || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEvent(id, updates) {
    const { data, error } = await supabase
      .from('timeline_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEvent(id) {
    const { error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addFileToEvent(eventId, fileName, filePath, fileSize) {
    const { data, error } = await supabase
      .from('event_files')
      .insert({
        event_id: eventId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFile(fileId) {
    const { error } = await supabase
      .from('event_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
  },

  async renameFile(fileId, newName) {
    const { data, error } = await supabase
      .from('event_files')
      .update({ file_name: newName })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
