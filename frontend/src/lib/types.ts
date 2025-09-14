// lib/types.ts - Enhanced version
export interface Event {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  opportunity_type?: string;
  opportunity_subtype?: string;
  organisation_name?: string;
  website_url?: string;
  mode?: 'online' | 'offline' | 'hybrid';
  categories?: string[];
  skills?: string[];
  event_date?: string;
  location?: string;
  max_attendees: number;
  image_url?: string;
  avatar_url?: string; // NEW: ReadyPlayer.me avatar URL
  price: number;
  status: 'active' | 'cancelled' | 'completed';
  created_at?: string;
  updated_at?: string;
}

export interface EventStage {
  id: string;
  event_id: string;
  stage_name: string;
  description?: string;
  purpose?: string;
  skills?: string[];
  duration?: string; // PostgreSQL interval as string
  start_date?: string;
  end_date?: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  phone?: string;
  participation_type: 'individual' | 'team';
  team_name?: string;
  team_members?: string[];
  registration_date: string;
  status: 'registered' | 'cancelled' | 'attended';
   events?: {
    title: string;
    event_date?: string;
  };
}

// Enhanced chat types for better AI integration
export interface EventChatSession {
  session_id: string;
  event_id: string;
  messages: EventChat[];
  created_at: string;
  last_activity: string;
}

export interface EmotionData {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: string[];
}

export interface EventChat {
  id: string;
  event_id: string;
  session_id?: string;
  user_message: string;
  bot_response: string;
  emotions?: EmotionData;
  created_at: string;
}
export interface RAGResponse {
 error?: string;
 generated_text?: string;
 sentences?: string[];
emotions?: string[];
}