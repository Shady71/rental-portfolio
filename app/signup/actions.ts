'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { mapAuthError } from '@/lib/auth-errors'

export type SignupState = {
  error?: string
  info?: string
}

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()
  const role = formData.get('role')

  if (!email || !password || !fullName) {
    return { error: 'Please fill in all fields.' }
  }
  if (role !== 'landlord' && role !== 'tenant') {
    return { error: 'Please select a valid role.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  })

  if (error) {
    return { error: mapAuthError(error) }
  }

  // "Confirm email" is on and this email already belongs to a confirmed
  // user: Supabase returns a fake user with no identities instead of an
  // error, so it can't be used to tell attackers which emails exist.
  if (data.user && data.user.identities?.length === 0) {
    return { error: 'This email is already registered. Try logging in instead.' }
  }

  if (!data.session) {
    // "Confirm email" is on: no session exists until the user clicks the
    // link in their inbox, so there's nothing to redirect into yet.
    return { info: 'Check your email to confirm your account, then log in.' }
  }

  redirect(role === 'landlord' ? '/dashboard' : '/portal')
}
