'use client'

import { useState } from 'react'
import { Mic, Shield, Eye, Users } from 'lucide-react'

export function ComplaintHero() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Mic Icon with Animation */}
          <div 
            className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-8 transition-all duration-300 hover:scale-110"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Mic 
              className={`w-12 h-12 text-white transition-all duration-300 ${
                isHovered ? 'scale-110 text-yellow-300' : ''
              }`} 
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Raise Your Voice
            <span className="block text-yellow-300">Be Heard</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            A transparent platform where every student's concern matters. 
            Submit complaints anonymously, track progress, and see real change happen.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Safe & Anonymous</h3>
              <p className="text-blue-100">Submit concerns without fear of retaliation</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Full Transparency</h3>
              <p className="text-blue-100">Track progress and see resolution updates</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Community Driven</h3>
              <p className="text-blue-100">Students, teachers, and admin working together</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              Submit Your First Complaint
            </button>
          </div>
        </div>
      </div>

      {/* Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-16 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.31-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor"></path>
        </svg>
      </div>
    </div>
  )
}