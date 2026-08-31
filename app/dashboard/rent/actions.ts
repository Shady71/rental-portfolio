'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentPeriod, getDefaultDueDate, validatePaymentAmount, validatePaymentDate } from '@/lib/rent'

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
    .eq('status', 'occupied')

  if (propertiesError) {
    return { error: propertiesError.message }
  }
  if (!properties || properties.length === 0) {
    return { error: 'No occupied properties to generate charges for.' }
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
    message: `Created ${created} charge${created === 1 ? '' : 's'} for occupied properties, ${skipped} already existed.`,
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

  const amountError = validatePaymentAmount(amountRaw)
  if (amountError) {
    errors.amount = amountError
  }
  const amount = Number(amountRaw)

  const paidAtError = validatePaymentDate(paidAt)
  if (paidAtError) {
    errors.paid_at = paidAtError
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

export async function updatePayment(
  paymentId: string,
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

  const { data: updated, error } = await supabase
    .from('payments')
    .update({ amount, paid_at: paidAt })
    .eq('id', paymentId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { formError: error.message }
  }
  if (!updated) {
    return { formError: 'Payment not found, or you no longer have access to it.' }
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  revalidatePath('/dashboard/rent')
  return {}
}

export async function deletePayment(paymentId: string, propertyId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { data: deleted, error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }
  if (!deleted) {
    return { error: 'Payment not found, or you no longer have access to it.' }
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  revalidatePath('/dashboard/rent')
  return {}
}
