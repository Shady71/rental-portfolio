import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { DashboardNav } from '@/components/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.claims.sub)
    .maybeSingle()

  if (profile?.role === 'tenant') {
    redirect('/portal')
  }

  return (
    <>
      <DashboardNav />
      {children}
    </>
  )
}
