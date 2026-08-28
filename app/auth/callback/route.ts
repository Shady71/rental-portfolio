import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const origin = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
  }

  const { data } = await supabase.auth.getClaims()

  if (!data) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.claims.sub)
    .maybeSingle()

  const destination = profile?.role === 'tenant' ? '/portal' : '/dashboard'
  return NextResponse.redirect(`${origin}${destination}`)
}
