import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth/roles'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentUserRole()
  if (role !== 'admin') {
    redirect(role === 'employee' ? '/scan' : role === 'customer' ? '/dashboard' : '/login')
  }
  return children
}
