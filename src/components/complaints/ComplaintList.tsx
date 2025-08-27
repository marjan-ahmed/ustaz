'use client'

import { useState } from 'react'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  User,
  MapPin
} from 'lucide-react'

export function ComplaintList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Mock data - in real app this would come from API
  const complaints = [
    {
      id: 'CM-001',
      title: 'Broken air conditioning in Room 205',
      category: 'Facilities & Infrastructure',
      status: 'resolved',
      priority: 'high',
      submittedBy: 'Anonymous',
      submittedAt: '2024-01-15T10:30:00Z',
      location: 'Room 205',
      description: 'The air conditioning unit has been making loud noises and not cooling properly for the past week.',
      responseTime: '1.2 days',
      resolution: 'AC unit replaced on Jan 17th. Room temperature now normal.'
    },
    {
      id: 'CM-002',
      title: 'WiFi connectivity issues in Library',
      category: 'Technology & IT',
      status: 'in-progress',
      priority: 'medium',
      submittedBy: 'Sarah M.',
      submittedAt: '2024-01-16T14:15:00Z',
      location: 'Library',
      description: 'WiFi keeps dropping connection every 10-15 minutes. Very frustrating when trying to do research.',
      responseTime: '0.5 days',
      resolution: 'IT team investigating. Temporary hotspot available at front desk.'
    },
    {
      id: 'CM-003',
      title: 'Food quality concerns in cafeteria',
      category: 'Food & Cafeteria',
      status: 'pending',
      priority: 'low',
      submittedBy: 'Anonymous',
      submittedAt: '2024-01-17T12:00:00Z',
      location: 'Cafeteria',
      description: 'The vegetables seem to be overcooked and tasteless. Also, some items are not fresh.',
      responseTime: '0.1 days',
      resolution: null
    },
    {
      id: 'CM-004',
      title: 'Bullying incident near gym',
      category: 'Safety & Security',
      status: 'urgent',
      priority: 'urgent',
      submittedBy: 'Anonymous',
      submittedAt: '2024-01-17T15:45:00Z',
      location: 'Gym area',
      description: 'Witnessed verbal harassment of a student. Need immediate attention.',
      responseTime: '0.1 days',
      resolution: 'Security team notified. Investigation in progress.'
    },
    {
      id: 'CM-005',
      title: 'Bus delay causing tardiness',
      category: 'Transportation',
      status: 'resolved',
      priority: 'medium',
      submittedBy: 'Mike R.',
      submittedAt: '2024-01-14T07:20:00Z',
      location: 'Bus Route 3',
      description: 'Bus consistently 10-15 minutes late, causing students to be late for first period.',
      responseTime: '2.1 days',
      resolution: 'Bus schedule adjusted. New driver assigned to Route 3.'
    }
  ]

  const statuses = [
    { value: 'all', label: 'All Statuses', color: 'bg-gray-100 text-gray-700' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
  ]

  const categories = [
    'All Categories',
    'Academic Issues',
    'Facilities & Infrastructure',
    'Safety & Security',
    'Technology & IT',
    'Food & Cafeteria',
    'Transportation',
    'Social & Community',
    'Health & Wellness'
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'urgent':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter
    const matchesCategory = categoryFilter === 'All Categories' || complaint.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recent Complaints</h2>
          <p className="text-gray-600">Track the status of submitted concerns</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{complaints.length}</div>
          <div className="text-sm text-gray-500">Total Complaints</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search complaints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <div key={complaint.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(complaint.status)}`}>
                    {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(complaint.submittedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    {complaint.submittedBy}
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    {complaint.location}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusIcon(complaint.status)}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-4 line-clamp-2">{complaint.description}</p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  Response: {complaint.responseTime}
                </span>
                <span className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  {complaint.resolution ? 'Resolved' : 'Under Review'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>

            {/* Resolution (if available) */}
            {complaint.resolution && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Resolution</p>
                    <p className="text-sm text-green-700">{complaint.resolution}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredComplaints.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters to see more results.
          </p>
        </div>
      )}

      {/* View All Button */}
      <div className="text-center mt-8">
        <button className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium">
          <span>View All Complaints</span>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}