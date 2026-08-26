'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type TicketFormState = {
  errors?: {
    title?: string
  }
  formError?: string
}

export async function fileTicket(
  propertyId: string,
  _prevState: TicketFormState,
  formData: FormData
): Promise<TicketFormState> {
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()

  if (!title) {
    return { errors: { title: 'Title is required.' } }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { error } = await supabase.from('maintenance_tickets').insert({
    property_id: propertyId,
    created_by: data.claims.sub,
    title,
    description: description || null,
  })

  if (error) {
    return { formError: error.message }
  }

  revalidatePath('/portal')
  return {}
}
