// lib/auth.ts
import { createClient } from 'src/utils/supabase/server'
import { UserProfile, AdminProfile } from '../types/database'

export async function getUser() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function getUserProfile(): Promise<{
  user: any | null
  userProfile: UserProfile | null
  adminProfile: AdminProfile | null
}> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, userProfile: null, adminProfile: null }
  }

  // Try to get user profile first
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userProfile) {
    return { user, userProfile, adminProfile: null }
  }

  // If not found, try admin profile
  const { data: adminProfile } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, userProfile: null, adminProfile }
}

export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const { userProfile, adminProfile } = await getUserProfile()
  
  const userRole = userProfile?.role || adminProfile?.role
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new Error('Insufficient permissions')
  }
  
  return { userProfile, adminProfile }
}
