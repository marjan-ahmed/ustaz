import { Metadata } from 'next'
import { ComplaintNavigation } from '@/components/complaints/ComplaintNavigation'
import { ComplaintHero } from '@/components/complaints/ComplaintHero'
import { ComplaintStats } from '@/components/complaints/ComplaintStats'
import { ComplaintForm } from '@/components/complaints/ComplaintForm'
import { ComplaintList } from '@/components/complaints/ComplaintList'
import { ComplaintCategories } from '@/components/complaints/ComplaintCategories'

export const metadata: Metadata = {
  title: 'School Complaint Management System | Raise Your Voice',
  description: 'A transparent platform for students to raise concerns, teachers to track issues, and administrators to ensure accountability. Your voice matters! 🎤',
}

export default function ComplaintsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <ComplaintNavigation />
      <ComplaintHero />
      <ComplaintStats />
      <ComplaintCategories />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ComplaintForm />
          <ComplaintList />
        </div>
      </div>
    </div>
  )
}