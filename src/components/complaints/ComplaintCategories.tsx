'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  Users, 
  Shield, 
  Wifi, 
  Utensils, 
  Bus, 
  Building2, 
  Heart,
  Plus,
  ArrowRight
} from 'lucide-react'

export function ComplaintCategories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [
    {
      id: 'academic',
      name: 'Academic Issues',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      description: 'Course content, grading, teacher concerns',
      examples: ['Unclear course material', 'Grading disputes', 'Teacher availability']
    },
    {
      id: 'facilities',
      name: 'Facilities & Infrastructure',
      icon: Building2,
      color: 'from-green-500 to-green-600',
      description: 'Building maintenance, equipment, cleanliness',
      examples: ['Broken equipment', 'Cleanliness issues', 'Temperature problems']
    },
    {
      id: 'safety',
      name: 'Safety & Security',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      description: 'Security concerns, bullying, harassment',
      examples: ['Bullying incidents', 'Security issues', 'Emergency procedures']
    },
    {
      id: 'technology',
      name: 'Technology & IT',
      icon: Wifi,
      color: 'from-purple-500 to-purple-600',
      description: 'WiFi, computers, software issues',
      examples: ['WiFi connectivity', 'Computer problems', 'Software access']
    },
    {
      id: 'food',
      name: 'Food & Cafeteria',
      icon: Utensils,
      color: 'from-orange-500 to-orange-600',
      description: 'Food quality, menu, service',
      examples: ['Food quality', 'Menu variety', 'Service speed']
    },
    {
      id: 'transportation',
      name: 'Transportation',
      icon: Bus,
      color: 'from-yellow-500 to-yellow-600',
      description: 'Bus service, parking, traffic',
      examples: ['Bus delays', 'Parking issues', 'Traffic safety']
    },
    {
      id: 'social',
      name: 'Social & Community',
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      description: 'Student life, events, clubs',
      examples: ['Event organization', 'Club activities', 'Student engagement']
    },
    {
      id: 'health',
      name: 'Health & Wellness',
      icon: Heart,
      color: 'from-teal-500 to-teal-600',
      description: 'Medical, mental health, accessibility',
      examples: ['Medical facilities', 'Mental health support', 'Accessibility needs']
    }
  ]

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What Can We Help You With?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose a category that best describes your concern. This helps us route your complaint to the right team for faster resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${
                selectedCategory === category.id 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-transparent hover:border-gray-200'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg mb-4`}>
                <category.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {category.description}
              </p>

              {selectedCategory === category.id && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">Common examples:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {category.examples.map((example, index) => (
                      <li key={index} className="flex items-center">
                        <Plus className="w-3 h-3 mr-2 text-gray-400" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Click to see details
                </span>
                <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${
                  selectedCategory === category.id ? 'rotate-90' : ''
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Submit Button */}
        <div className="text-center mt-12">
          <button className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
            <Plus className="w-5 h-5" />
            <span>Submit New Complaint</span>
          </button>
        </div>
      </div>
    </div>
  )
}