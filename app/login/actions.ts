'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { mapAuthError } from '@/lib/auth-errors'

export type LoginState = {
  error?: string
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Please enter your email and password.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: mapAuthError(error) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    return {
      error: 'Signed in, but your profile could not be loaded. Please try again.',
    }
  }

  redirect(profile.role === 'landlord' ? '/dashboard' : '/portal')
}
