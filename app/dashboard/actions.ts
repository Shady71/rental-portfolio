'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { isCurrencyCode } from '@/lib/currency'

export type CurrencyFormState = {
  error?: string
}

export async function updateCurrency(
  _prevState: CurrencyFormState,
  formData: FormData
): Promise<CurrencyFormState> {
  const currency = String(formData.get('currency') ?? '').trim()

  if (!isCurrencyCode(currency)) {
    return { error: 'Select a valid currency.' }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { error } = await supabase.from('profiles').update({ currency }).eq('id', data.claims.sub)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return {}
}
