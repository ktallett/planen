import { createClient } from '@supabase/supabase-js';

// Placeholder - user should set their own Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Sync functionality (optional cloud sync)
export const syncService = {
  enabled: !!supabase,

  async syncChart(localChart) {
    if (!supabase) return null;

    // Upload chart to Supabase
    const { data, error } = await supabase
      .from('charts')
      .upsert({
        id: localChart.id,
        ...localChart,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async fetchCharts(userId) {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('charts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
