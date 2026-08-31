'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { isExpenseCategory, type ExpenseCategory } from '@/lib/expenses'
import { isPropertyStatus, validateAddress, validateMonthlyRent, type PropertyStatus } from '@/lib/properties'
import type { TicketStatus } from '@/lib/maintenance'

export type PropertyFormState = {
  errors?: {
    address?: string
    monthly_rent?: string
    purchase_price?: string
    status?: string
  }
  formError?: string
}

export type DeleteState = {
  error?: string
}

function parsePropertyForm(formData: FormData) {
  const address = String(formData.get('address') ?? '').trim()
  const monthlyRentRaw = String(formData.get('monthly_rent') ?? '').trim()
  const purchasePriceRaw = String(formData.get('purchase_price') ?? '').trim()
  const statusRaw = String(formData.get('status') ?? '').trim()

  const errors: NonNullable<PropertyFormState['errors']> = {}

  const addressError = validateAddress(address)
  if (addressError) {
    errors.address = addressError
  }

  const monthlyRentError = validateMonthlyRent(monthlyRentRaw)
  if (monthlyRentError) {
    errors.monthly_rent = monthlyRentError
  }
  const monthlyRent = Number(monthlyRentRaw)

  let purchasePrice: number | null = null
  if (purchasePriceRaw) {
    purchasePrice = Number(purchasePriceRaw)
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      errors.purchase_price = 'Purchase price must be a positive number.'
    }
  }

  const status: PropertyStatus | null = isPropertyStatus(statusRaw) ? statusRaw : null
  if (!status) {
    errors.status = 'Select a valid status.'
  }

  return { address, monthlyRent, purchasePrice, status, errors }
}

export async function createProperty(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const { address, monthlyRent, purchasePrice, status, errors } = parsePropertyForm(formData)
  if (Object.keys(errors).length > 0 || !status) {
    return { errors }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { error } = await supabase.from('properties').insert({
    owner_id: data.claims.sub,
    address,
    monthly_rent: monthlyRent,
    purchase_price: purchasePrice,
    status,
  })

  if (error) {
    return { formError: error.message }
  }

  revalidatePath('/dashboard/properties')
  redirect('/dashboard/properties')
}

export async function updateProperty(
  propertyId: string,
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const { address, monthlyRent, purchasePrice, status, errors } = parsePropertyForm(formData)
  if (Object.keys(errors).length > 0 || !status) {
    return { errors }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { data: updated, error } = await supabase
    .from('properties')
    .update({
      address,
      monthly_rent: monthlyRent,
      purchase_price: purchasePrice,
      status,
    })
    .eq('id', propertyId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { formError: error.message }
  }
  if (!updated) {
    return {
      formError: 'Property not found, or you no longer have access to it.',
    }
  }

  revalidatePath('/dashboard/properties')
  revalidatePath(`/dashboard/properties/${propertyId}`)
  redirect(`/dashboard/properties/${propertyId}`)
}

export async function deleteProperty(propertyId: string): Promise<DeleteState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { data: deleted, error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }
  if (!deleted) {
    return { error: 'Property not found, or you no longer have access to it.' }
  }

  revalidatePath('/dashboard/properties')
  redirect('/dashboard/properties')
}

export type ExpenseFormState = {
  errors?: {
    amount?: string
    category?: string
    incurred_on?: string
  }
  formError?: string
}

function parseExpenseForm(formData: FormData) {
  const amountRaw = String(formData.get('amount') ?? '').trim()
  const categoryRaw = String(formData.get('category') ?? '').trim()
  const incurredOn = String(formData.get('incurred_on') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()

  const errors: NonNullable<ExpenseFormState['errors']> = {}

  const amount = Number(amountRaw)
  if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Amount must be a positive number.'
  }

  const category: ExpenseCategory | null = isExpenseCategory(categoryRaw) ? categoryRaw : null
  if (!category) {
    errors.category = 'Select a valid category.'
  }

  if (!incurredOn) {
    errors.incurred_on = 'Date is required.'
  }

  return { amount, category, incurredOn, note: note || null, errors }
}

export async function createExpense(
  propertyId: string,
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const { amount, category, incurredOn, note, errors } = parseExpenseForm(formData)
  if (Object.keys(errors).length > 0 || !category) {
    return { errors }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { error } = await supabase.from('expenses').insert({
    property_id: propertyId,
    amount,
    category,
    incurred_on: incurredOn,
    note,
  })

  if (error) {
    return { formError: error.message }
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  return {}
}

export async function deleteExpense(
  expenseId: string,
  propertyId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { data: deleted, error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }
  if (!deleted) {
    return { error: 'Expense not found, or you no longer have access to it.' }
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  return {}
}

export type AssignTenantState = {
  error?: string
  message?: string
}

export async function assignTenant(
  propertyId: string,
  _prevState: AssignTenantState,
  formData: FormData
): Promise<AssignTenantState> {
  const email = String(formData.get('tenant_email') ?? '').trim()

  if (!email) {
    return { error: "Enter the tenant's email address." }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { data: tenantId, error: lookupError } = await supabase.rpc('find_tenant_by_email', {
    lookup_email: email,
  })

  if (lookupError) {
    return { error: lookupError.message }
  }
  if (!tenantId) {
    return { error: 'No tenant found with that email.' }
  }

  const { error: updateError } = await supabase
    .from('properties')
    .update({ tenant_id: tenantId })
    .eq('id', propertyId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Not a hard conflict — the schema allows one tenant across multiple
  // properties — but worth surfacing so a landlord notices an accidental
  // duplicate assignment.
  const { count } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .neq('id', propertyId)

  revalidatePath(`/dashboard/properties/${propertyId}`)

  if (count && count > 0) {
    return {
      message: `Tenant assigned. Note: this tenant is also linked to ${count} other propert${
        count === 1 ? 'y' : 'ies'
      } in your portfolio.`,
    }
  }

  return { message: 'Tenant assigned.' }
}

export async function unassignTenant(propertyId: string): Promise<AssignTenantState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { error } = await supabase.from('properties').update({ tenant_id: null }).eq('id', propertyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  return { message: 'Tenant unassigned.' }
}

export type TicketActionState = {
  error?: string
}

export async function advanceTicketStatus(
  ticketId: string,
  propertyId: string,
  nextStatus: TicketStatus
): Promise<TicketActionState> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { data: updated, error } = await supabase
    .from('maintenance_tickets')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: error.message }
  }
  if (!updated) {
    return { error: 'Ticket not found, or you no longer have access to it.' }
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  revalidatePath('/dashboard/maintenance')
  return {}
}

export type TicketUpdateState = {
  error?: string
}

export async function addTicketUpdate(
  ticketId: string,
  propertyId: string,
  _prevState: TicketUpdateState,
  formData: FormData
): Promise<TicketUpdateState> {
  const body = String(formData.get('body') ?? '').trim()

  if (!body) {
    return { error: 'Note cannot be empty.' }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    redirect('/login')
  }

  const { error } = await supabase.from('ticket_updates').insert({
    ticket_id: ticketId,
    author_id: data.claims.sub,
    body,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  return {}
}
