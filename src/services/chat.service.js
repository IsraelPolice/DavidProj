import { supabase } from '../lib/supabase.js';

export const chatService = {
  async getMessagesByCase(caseId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('case_id', caseId)
      .order('sent_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getAllCasesWithMessages() {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        id,
        case_num,
        first_name,
        last_name,
        chat_messages(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.filter(c => c.chat_messages && c.chat_messages.length > 0);
  },

  async sendMessage(caseId, sender, message) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        case_id: caseId,
        sender,
        message
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  subscribeToMessages(caseId, callback) {
    const channel = supabase
      .channel(`chat:${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `case_id=eq.${caseId}`
        },
        payload => callback(payload.new)
      )
      .subscribe();

    return channel;
  }
};
