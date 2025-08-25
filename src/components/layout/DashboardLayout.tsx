'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  UserIcon, 
  WrenchScrewdriverIcon, 
  CalendarIcon, 
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  CogIcon,
  BellIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { db } from '@/lib/supabase';
import { User, ServiceProvider, Customer } from '@/lib/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<User | ServiceProvider | Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      loadUserProfile();
    } else if (isLoaded && !user) {
      router.push('/auth/sign-in');
    }
  }, [isLoaded, user]);

  const loadUserProfile = async () => {
    try {
      const profile = await db.getUserProfile(user!.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Create profile if it doesn't exist
      try {
        const newProfile = await db.createUserProfile({
          clerk_id: user!.id,
          email: user!.emailAddresses[0]?.emailAddress || '',
          name: user!.fullName || '',
          role: 'customer'
        });
        setUserProfile(newProfile);
      } catch (createError) {
        console.error('Error creating user profile:', createError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getNavigationItems = () => {
    if (!userProfile) return [];

    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
      { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon },
      { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
    ];

    if (userProfile.role === 'customer') {
      return [
        ...baseItems,
        { name: 'Find Services', href: '/dashboard/find-services', icon: WrenchScrewdriverIcon },
        { name: 'My Bookings', href: '/dashboard/bookings', icon: CalendarIcon },
        { name: 'Chats', href: '/dashboard/chats', icon: ChatBubbleLeftRightIcon },
        { name: 'Payments', href: '/dashboard/payments', icon: CreditCardIcon },
        { name: 'Loyalty Points', href: '/dashboard/loyalty', icon: ChartBarIcon },
      ];
    }

    if (userProfile.role === 'provider') {
      return [
        ...baseItems,
        { name: 'Service Requests', href: '/dashboard/requests', icon: WrenchScrewdriverIcon },
        { name: 'My Jobs', href: '/dashboard/jobs', icon: CalendarIcon },
        { name: 'Chats', href: '/dashboard/chats', icon: ChatBubbleLeftRightIcon },
        { name: 'Earnings', href: '/dashboard/earnings', icon: CreditCardIcon },
        { name: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
      ];
    }

    if (userProfile.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
        { name: 'Providers', href: '/dashboard/providers', icon: WrenchScrewdriverIcon },
        { name: 'Bookings', href: '/dashboard/bookings', icon: CalendarIcon },
        { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCardIcon },
        { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
        { name: 'Verifications', href: '/dashboard/verifications', icon: DocumentTextIcon },
      ];
    }

    return baseItems;
  };

  const handleSignOut = async () => {
    await user?.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
          <p className="text-gray-600">Please wait while we set up your account.</p>
        </div>
      </div>
    );
  }

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-semibold text-gray-900">Ustaz</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Ustaz</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </a>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleSignOut}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="flex items-center gap-x-4">
                <span className="text-sm font-medium text-gray-900">
                  {userProfile.name}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {userProfile.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}