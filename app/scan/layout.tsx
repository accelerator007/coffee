import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth/roles'

export default async function ScanLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentUserRole()
  if (role !== 'admin' && role !== 'employee') {
    redirect(role === 'customer' ? '/dashboard' : '/login')
  }
  return children
}
