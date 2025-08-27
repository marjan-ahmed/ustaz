'use client'

import { useState } from 'react'
import { 
  Mic, 
  Eye, 
  EyeOff, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  Send,
  User,
  Shield
} from 'lucide-react'

export function ComplaintForm() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    priority: 'medium',
    anonymous: false,
    contactEmail: '',
    location: '',
    attachments: [] as File[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const categories = [
    'Academic Issues',
    'Facilities & Infrastructure', 
    'Safety & Security',
    'Technology & IT',
    'Food & Cafeteria',
    'Transportation',
    'Social & Community',
    'Health & Wellness',
    'Other'
  ]

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
    { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-100' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100' }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setShowSuccess(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
      setFormData({
        title: '',
        category: '',
        description: '',
        priority: 'medium',
        anonymous: false,
        contactEmail: '',
        location: '',
        attachments: []
      })
    }, 3000)
  }

  if (showSuccess) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Complaint Submitted Successfully! 🎤
        </h3>
        <p className="text-gray-600 mb-6">
          Thank you for raising your voice. We've received your complaint and will review it within 24 hours.
        </p>
        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
          <p className="text-sm">
            <strong>Reference ID:</strong> CM-{Date.now().toString().slice(-6)}
          </p>
          <p className="text-sm mt-1">
            You'll receive updates via email (if provided) or check the status here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Mic className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submit a Complaint</h2>
          <p className="text-gray-600">Your voice matters. Let's make things better together.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Brief description of your concern"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description *
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Please provide detailed information about your concern, including when it occurred, who was involved, and any relevant details..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (Optional)
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="e.g., Room 201, Cafeteria, Library, etc."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Anonymity Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Submit Anonymously</p>
              <p className="text-xs text-gray-600">Your identity will be hidden from staff</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.anonymous}
              onChange={(e) => handleInputChange('anonymous', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Contact Email (if not anonymous) */}
        {!formData.anonymous && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email (Optional)
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              placeholder="your.email@school.edu"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll use this to send you updates about your complaint
            </p>
          </div>
        )}

        {/* File Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500 font-medium">
                Click to upload files
              </span>
              <span className="text-gray-500"> or drag and drop</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC, or images up to 10MB each
            </p>
          </div>
          
          {/* File List */}
          {formData.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <DocumentIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Submit Complaint</span>
            </>
          )}
        </button>

        {/* Privacy Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By submitting this complaint, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
          </p>
        </div>
      </form>
    </div>
  )
}

// Simple document icon component
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}