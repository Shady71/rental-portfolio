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

  return (
    <>
      <DashboardNav />
      {children}
    </>
  )
}
