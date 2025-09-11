// types/database.ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          phone?: string
          dob?: string
          gender?: string
          institution?: string
          role: 'participant' | 'admin' | 'organizer'
          course?: string
          year_of_study?: number
          skills?: string[]
          profile_image_url?: string
          linkedin_url?: string
          github_url?: string
          resume_url?: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      admin_users: {
        Row: {
          id: string
          email: string
          password_hash: string
          role: 'admin' | 'super_admin'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>
      }
      events: {
        Row: {
          id: string
          title: string
          subtitle?: string
          description?: string
          opportunity_type?: string
          opportunity_subtype?: string
          organisation_name?: string
          website_url?: string
          mode?: 'online' | 'offline' | 'hybrid'
          categories?: string[]
          skills?: string[]
          event_date?: string
          location?: string
          max_attendees: number
          image_url?: string
          price: number
          status: 'active' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
    }
  }
}

export type UserRole = 'participant' | 'admin' | 'organizer'
export type AdminRole = 'admin' | 'super_admin'

export type UserProfile = Database['public']['Tables']['users']['Row'];
export type AdminProfile = Database['public']['Tables']['admin_users']['Row'];
