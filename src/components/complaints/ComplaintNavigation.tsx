'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Mic, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  Home,
  Plus,
  Eye,
  Users
} from 'lucide-react'

export function ComplaintNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Home',
      href: '/complaints',
      icon: Home,
      description: 'Main complaints page'
    },
    {
      name: 'Submit Complaint',
      href: '/complaints/submit',
      icon: Plus,
      description: 'Raise a new concern'
    },
    {
      name: 'View Complaints',
      href: '/complaints/list',
      icon: Eye,
      description: 'Browse all complaints'
    },
    {
      name: 'Dashboard',
      href: '/complaints/dashboard',
      icon: BarChart3,
      description: 'Admin & teacher portal'
    },
    {
      name: 'About',
      href: '/complaints/about',
      icon: Users,
      description: 'Learn about the system'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/complaints' && pathname === '/complaints') return true
    if (href !== '/complaints' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/complaints" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">VoiceBox</h1>
                <p className="text-xs text-gray-500">Complaint Management</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className="text-xs text-gray-500">{item.description}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}