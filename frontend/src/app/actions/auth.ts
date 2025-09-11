// app/actions/auth.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['participant', 'admin', 'organizer']).default('participant'),
})

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      message: error.message,
    }
  }

  revalidatePath('/', 'layout')
  
  const redirectTo = formData.get('redirectTo') as string
  redirect(redirectTo || '/dashboard')
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const validatedFields = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password, fullName, role } = validatedFields.data

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError) {
    return {
      message: authError.message,
    }
  }

  // Create user profile
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: authData.user.email!,
          full_name: fullName,
          role,
        },
      ])

    if (profileError) {
      return {
        message: 'Failed to create user profile',
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/login')
}
