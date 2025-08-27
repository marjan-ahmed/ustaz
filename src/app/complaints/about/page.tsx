import { Metadata } from 'next'
import { ComplaintNavigation } from '@/components/complaints/ComplaintNavigation'
import { 
  Mic, 
  Shield, 
  Eye, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Heart
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'About VoiceBox | School Complaint Management System',
  description: 'Learn about our transparent complaint management system designed to give every student a voice.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <ComplaintNavigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            About VoiceBox
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A revolutionary complaint management system designed to give every student a voice 
            and ensure transparency in addressing school concerns.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            As Head Boy, I believe that every student deserves to be heard. VoiceBox was created 
            to bridge the gap between students and administration, ensuring that concerns are 
            addressed promptly, fairly, and transparently. Our mic symbol represents the power 
            of raising your voice for positive change.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Safe & Anonymous</h3>
            <p className="text-gray-600">
              Submit complaints anonymously to protect your identity and prevent any form of retaliation.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Transparency</h3>
            <p className="text-gray-600">
              Track the progress of your complaint in real-time and see how it's being resolved.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Response</h3>
            <p className="text-gray-600">
              Our system ensures complaints are reviewed within 24 hours and urgent issues are addressed immediately.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Driven</h3>
            <p className="text-gray-600">
              Students, teachers, and administrators work together to create a better school environment.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit</h3>
              <p className="text-gray-600">
                Students submit complaints through our easy-to-use form, choosing to remain anonymous or provide contact information.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-yellow-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review</h3>
              <p className="text-gray-600">
                Teachers and administrators review complaints, assign them to appropriate teams, and begin the resolution process.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resolve</h3>
              <p className="text-gray-600">
                Issues are addressed systematically, with regular updates provided to students and the community.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Benefits for Everyone</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">For Students</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Safe way to voice concerns</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Real-time updates on progress</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Anonymous submission option</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">For Staff</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Organized complaint tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Efficient resolution workflow</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Performance analytics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Make a Difference?</h2>
            <p className="text-gray-600 mb-6">
              Join us in creating a more transparent and responsive school environment. 
              Your voice matters, and together we can make positive changes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/complaints"
                className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                <Mic className="w-5 h-5" />
                <span>Submit a Complaint</span>
              </a>
              <a
                href="/complaints/dashboard"
                className="inline-flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                <TrendingUp className="w-5 h-5" />
                <span>View Dashboard</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p className="flex items-center justify-center space-x-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span>Built with care for our school community</span>
          </p>
          <p className="text-sm mt-2">
            VoiceBox Complaint Management System • Empowering Student Voices
          </p>
        </div>
      </div>
    </div>
  )
}