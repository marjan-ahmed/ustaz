'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../../../client/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Clock,
  MapPin,
  DollarSign,
  User,
  Star,
  MessageSquare,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Plus
} from 'lucide-react';
import BookingFlow from '@/components/booking/BookingFlow';
import ChatSystem from '@/components/chat/ChatSystem';
import ReviewForm from '@/components/reviews/ReviewForm';
import Link from 'next/link';

interface Booking {
  id: string;
  title: string;
  description: string;
  service_address: string;
  estimated_cost: number;
  final_cost?: number;
  status: string;
  payment_status: string;
  scheduled_date?: string;
  created_at: string;
  service_category: {
    name: string;
  };
  provider?: {
    id: string;
    user_id: string;
    hourly_rate: number;
    average_rating: number;
    total_jobs: number;
    user_profiles: {
      first_name: string;
      last_name: string;
      phone_number: string;
      avatar_url?: string;
    };
  };
}

export default function BookingsPage() {
  const { user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchBookings();
    }
  }, [user?.id]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          id,
          title,
          description,
          service_address,
          estimated_cost,
          final_cost,
          status,
          payment_status,
          scheduled_date,
          created_at,
          service_category:service_category_id(name),
          provider:provider_id(
            id,
            user_id,
            hourly_rate,
            average_rating,
            total_jobs,
            user_profiles!inner(first_name, last_name, phone_number, avatar_url)
          )
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    switch (activeTab) {
      case 'pending':
        return booking.status === 'pending';
      case 'active':
        return ['accepted', 'in_progress'].includes(booking.status);
      case 'completed':
        return booking.status === 'completed';
      case 'cancelled':
        return ['cancelled', 'rejected'].includes(booking.status);
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStats = () => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      active: bookings.filter(b => ['accepted', 'in_progress'].includes(b.status)).length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => ['cancelled', 'rejected'].includes(b.status)).length,
    };
  };

  const stats = getBookingStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600">Manage your service requests and bookings</p>
          </div>
          <Link href="/find-provider">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bookings List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>
                  View and manage all your service bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="space-y-4 mt-6">
                    {filteredBookings.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No bookings found
                        </h3>
                        <p className="text-gray-500 mb-6">
                          {activeTab === 'all' 
                            ? "You haven't made any bookings yet."
                            : `No ${activeTab} bookings found.`
                          }
                        </p>
                        <Link href="/find-provider">
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Book a Service
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      filteredBookings.map((booking) => (
                        <Card 
                          key={booking.id} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedBooking?.id === booking.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{booking.title}</h3>
                                <p className="text-sm text-gray-600">{booking.service_category?.name}</p>
                              </div>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{booking.service_address}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <span>
                                  {booking.final_cost 
                                    ? `PKR ${booking.final_cost}` 
                                    : `Est. PKR ${booking.estimated_cost}`
                                  }
                                </span>
                              </div>

                              {booking.scheduled_date && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>{new Date(booking.scheduled_date).toLocaleString()}</span>
                                </div>
                              )}

                              {booking.provider && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {booking.provider.user_profiles.first_name} {booking.provider.user_profiles.last_name}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs">{booking.provider.average_rating.toFixed(1)}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                Created: {new Date(booking.created_at).toLocaleDateString()}
                              </span>
                              
                              <div className="flex gap-2">
                                {booking.provider && ['accepted', 'in_progress'].includes(booking.status) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBooking(booking);
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {booking.status === 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBooking(booking);
                                    }}
                                  >
                                    <Star className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Booking Details Sidebar */}
          <div className="space-y-6">
            {selectedBooking ? (
              <>
                {/* Booking Flow Component */}
                <BookingFlow
                  booking={selectedBooking}
                  onUpdate={fetchBookings}
                />

                {/* Chat System - Show for accepted/in_progress bookings */}
                {selectedBooking.provider && ['accepted', 'in_progress', 'completed'].includes(selectedBooking.status) && (
                  <ChatSystem
                    bookingId={selectedBooking.id}
                    otherUser={{
                      user_id: selectedBooking.provider.user_id,
                      first_name: selectedBooking.provider.user_profiles.first_name,
                      last_name: selectedBooking.provider.user_profiles.last_name,
                      avatar_url: selectedBooking.provider.user_profiles.avatar_url,
                      user_type: 'provider'
                    }}
                  />
                )}

                {/* Review Form - Show for completed bookings */}
                {selectedBooking.status === 'completed' && selectedBooking.provider && (
                  <ReviewForm
                    bookingId={selectedBooking.id}
                    providerId={selectedBooking.provider.id}
                    providerName={`${selectedBooking.provider.user_profiles.first_name} ${selectedBooking.provider.user_profiles.last_name}`}
                    onSubmit={() => {
                      toast.success('Thank you for your feedback!');
                      fetchBookings();
                    }}
                  />
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Booking
                  </h3>
                  <p className="text-gray-500">
                    Choose a booking from the list to view details, chat with providers, or manage payments.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}