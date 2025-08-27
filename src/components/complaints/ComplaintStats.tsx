'use client'

import { TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

export function ComplaintStats() {
  const stats = [
    {
      label: 'Total Complaints',
      value: '1,247',
      change: '+12%',
      changeType: 'positive',
      icon: TrendingUp,
      description: 'This month'
    },
    {
      label: 'Resolved',
      value: '89%',
      change: '+5%',
      changeType: 'positive',
      icon: CheckCircle,
      description: 'Resolution rate'
    },
    {
      label: 'Avg. Response Time',
      value: '2.3 days',
      change: '-0.5 days',
      changeType: 'positive',
      icon: Clock,
      description: 'From submission'
    },
    {
      label: 'Pending',
      value: '23',
      change: '-8',
      changeType: 'negative',
      icon: AlertTriangle,
      description: 'Under review'
    }
  ]

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transparency in Numbers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real-time statistics show our commitment to addressing your concerns promptly and effectively
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${
                  stat.changeType === 'positive' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  stat.changeType === 'positive'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {stat.change}
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}