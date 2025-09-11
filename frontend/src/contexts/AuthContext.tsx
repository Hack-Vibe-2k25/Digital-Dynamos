// contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from 'src/lib/supabase'
import { UserProfile, AdminProfile, UserRole, AdminRole } from 'src/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  adminProfile: AdminProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, userData?: Partial<UserProfile>) => Promise<any>
  signOut: () => Promise<void>
  hasRole: (role: UserRole | AdminRole) => boolean
  hasAnyRole: (roles: (UserRole | AdminRole)[]) => boolean
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
          setAdminProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const getInitialSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error getting session:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      // First try to get regular user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userData && !userError) {
        setUserProfile(userData)
        return
      }

      // If not found in users table, check admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .single()

      if (adminData && !adminError) {
        setAdminProfile(adminData)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signUp = async (
    email: string, 
    password: string, 
    userData?: Partial<UserProfile>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setUserProfile(null)
    setAdminProfile(null)
  }

  const hasRole = (role: UserRole | AdminRole): boolean => {
    if (userProfile?.role === role) return true
    if (adminProfile?.role === role) return true
    return false
  }

  const hasAnyRole = (roles: (UserRole | AdminRole)[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  const isAdmin = (): boolean => {
    return hasAnyRole(['admin', 'super_admin'])
  }

  const value = {
    user,
    session,
    userProfile,
    adminProfile,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasAnyRole,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
