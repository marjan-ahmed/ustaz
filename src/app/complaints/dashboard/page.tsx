import { Metadata } from 'next'
import { ComplaintDashboard } from '@/components/complaints/ComplaintDashboard'

export const metadata: Metadata = {
  title: 'Complaint Management Dashboard | Admin & Teacher Portal',
  description: 'Manage, track, and resolve student complaints efficiently. Real-time updates and comprehensive reporting.',
}

export default function ComplaintDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ComplaintDashboard />
    </div>
  )
}