// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
export const getEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .order('event_date', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const getEvent = async (id: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const getEventRegistrations = async (eventId: string) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('registration_date', { ascending: false });
  
  if (error) throw error;
  return data;
};
export const getUser = () => supabase.auth.getUser()
export const getSession = () => supabase.auth.getSession()
export const signOut = () => supabase.auth.signOut()
