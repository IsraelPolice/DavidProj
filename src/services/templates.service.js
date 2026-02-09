import { supabase } from "../lib/supabase.js";

export const templatesService = {
  async getAllTemplates() {
    const { data, error } = await supabase
      .from("templates")
      .select("*, template_steps(*)")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    return data.map((template) => ({
      ...template,
      template_steps: template.template_steps.sort(
        (a, b) => a.step_order - b.step_order,
      ),
    }));
  },

  async getTemplateById(id) {
    const { data, error } = await supabase
      .from("templates")
      .select("*, template_steps(*)")
      .eq("id", id)
      .single();

    if (error) throw error;

    data.template_steps = data.template_steps.sort(
      (a, b) => a.step_order - b.step_order,
    );
    return data;
  },

  async createTemplate(name, steps) {
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .insert({ name, is_active: true })
      .select()
      .single();

    if (templateError) throw templateError;

    const stepsInserts = steps.map((step, index) => ({
      template_id: template.id,
      step_text: step.text,
      days_from_start: step.days,
      step_order: index + 1,
    }));

    const { error: stepsError } = await supabase
      .from("template_steps")
      .insert(stepsInserts);

    if (stepsError) throw stepsError;

    return template;
  },

  async updateTemplate(id, name, steps) {
    const { error: updateError } = await supabase
      .from("templates")
      .update({ name })
      .eq("id", id);

    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
      .from("template_steps")
      .delete()
      .eq("template_id", id);

    if (deleteError) throw deleteError;

    const stepsInserts = steps.map((step, index) => ({
      template_id: id,
      step_text: step.text,
      days_from_start: step.days,
      step_order: index + 1,
    }));

    const { error: insertError } = await supabase
      .from("template_steps")
      .insert(stepsInserts);

    if (insertError) throw insertError;

    return true;
  },

  async deleteTemplate(id) {
    const { error } = await supabase
      .from("templates")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
  },
};
