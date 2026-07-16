import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth/roles'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentUserRole()
  if (role !== 'customer') {
    redirect(role === 'admin' ? '/admin' : role === 'employee' ? '/scan' : '/login')
  }
  return children
}
