'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type PropertyFormState = {
  errors?: {
    address?: string
    monthly_rent?: string
    purchase_price?: string
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

  const errors: NonNullable<PropertyFormState['errors']> = {}

  if (!address) {
    errors.address = 'Address is required.'
  }

  const monthlyRent = Number(monthlyRentRaw)
  if (!monthlyRentRaw || !Number.isFinite(monthlyRent) || monthlyRent <= 0) {
    errors.monthly_rent = 'Monthly rent must be a positive number.'
  }

  let purchasePrice: number | null = null
  if (purchasePriceRaw) {
    purchasePrice = Number(purchasePriceRaw)
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      errors.purchase_price = 'Purchase price must be a positive number.'
    }
  }

  return { address, monthlyRent, purchasePrice, errors }
}

export async function createProperty(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const { address, monthlyRent, purchasePrice, errors } = parsePropertyForm(formData)
  if (Object.keys(errors).length > 0) {
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
  const { address, monthlyRent, purchasePrice, errors } = parsePropertyForm(formData)
  if (Object.keys(errors).length > 0) {
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
