'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentPeriod, getDefaultDueDate, todayISO } from '@/lib/rent'

export type GenerateChargesState = {
  message?: string
  error?: string
}

export async function generateMonthlyCharges(): Promise<GenerateChargesState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, monthly_rent')

  if (propertiesError) {
    return { error: propertiesError.message }
  }
  if (!properties || properties.length === 0) {
    return { error: 'Add a property before generating charges.' }
  }

  const period = getCurrentPeriod()
  const dueDate = getDefaultDueDate()

  const rows = properties.map((property) => ({
    property_id: property.id,
    period,
    amount_due: property.monthly_rent,
    due_date: dueDate,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('rent_charges')
    .upsert(rows, { onConflict: 'property_id,period', ignoreDuplicates: true })
    .select('id')

  if (insertError) {
    return { error: insertError.message }
  }

  const created = inserted?.length ?? 0
  const skipped = properties.length - created

  revalidatePath('/dashboard/rent')
  revalidatePath('/dashboard/properties')

  return {
    message: `Created ${created} charge${created === 1 ? '' : 's'}, ${skipped} already existed.`,
  }
}

export type PaymentFormState = {
  errors?: {
    amount?: string
    paid_at?: string
  }
  formError?: string
}

function parsePaymentForm(formData: FormData) {
  const amountRaw = String(formData.get('amount') ?? '').trim()
  const paidAt = String(formData.get('paid_at') ?? '').trim()

  const errors: NonNullable<PaymentFormState['errors']> = {}

  const amount = Number(amountRaw)
  if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Amount must be a positive number.'
  }

  if (!paidAt) {
    errors.paid_at = 'Date is required.'
  } else if (paidAt > todayISO()) {
    errors.paid_at = 'Date cannot be in the future.'
  }

  return { amount, paidAt, errors }
}

export async function recordPayment(
  chargeId: string,
  propertyId: string,
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const { amount, paidAt, errors } = parsePaymentForm(formData)
  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { error } = await supabase.from('payments').insert({
    rent_charge_id: chargeId,
    amount,
    paid_at: paidAt,
    method: 'manual',
  })

  if (error) {
    return { formError: error.message }
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  revalidatePath('/dashboard/rent')
  return {}
}
