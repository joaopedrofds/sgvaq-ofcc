import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/layout/admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') redirect('/login')
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
