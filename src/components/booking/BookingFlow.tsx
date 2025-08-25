'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  MapPin,
  Clock,
  DollarSign,
  User,
  Star,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import PaymentForm from '../payment/PaymentForm';

interface Provider {
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
}

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
  provider?: Provider;
  created_at: string;
}

interface BookingFlowProps {
  booking: Booking;
  onUpdate: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ booking, onUpdate }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelBooking = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Booking cancelled successfully');
        onUpdate();
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (error) {
      toast.error('Failed to cancel booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    toast.success('Payment completed successfully!');
    onUpdate();
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
  };

  const canMakePayment = booking.status === 'accepted' && booking.payment_status === 'pending';
  const canCancel = ['pending', 'accepted'].includes(booking.status);
  const showProviderDetails = booking.provider && booking.status !== 'pending';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{booking.title}</CardTitle>
              <CardDescription className="mt-2">
                Booking ID: {booking.id.slice(0, 8)}...
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={getPaymentStatusColor(booking.payment_status)}>
                {booking.payment_status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Booking Details */}
            <div>
              <h4 className="font-semibold mb-2">Service Details</h4>
              <p className="text-gray-600 mb-3">{booking.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{booking.service_address}</span>
                </div>
                
                {booking.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{new Date(booking.scheduled_date).toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>
                    {booking.final_cost 
                      ? `PKR ${booking.final_cost}` 
                      : `Est. PKR ${booking.estimated_cost}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Provider Details */}
            {showProviderDetails && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Service Provider</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {booking.provider!.user_profiles.avatar_url ? (
                        <img
                          src={booking.provider!.user_profiles.avatar_url}
                          alt="Provider"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {booking.provider!.user_profiles.first_name} {booking.provider!.user_profiles.last_name}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{booking.provider!.average_rating.toFixed(1)}</span>
                          <span>({booking.provider!.total_jobs} jobs)</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        PKR {booking.provider!.hourly_rate}/hour
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Status Information */}
            <Separator />
            <div className="bg-gray-50 p-4 rounded-lg">
              {booking.status === 'pending' && (
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Waiting for a service provider to accept your request...
                  </span>
                </div>
              )}
              
              {booking.status === 'accepted' && booking.payment_status === 'pending' && (
                <div className="flex items-center gap-2 text-blue-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Service provider has accepted your request. Please complete payment to proceed.
                  </span>
                </div>
              )}
              
              {booking.status === 'accepted' && booking.payment_status === 'paid' && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Payment completed! The service provider will contact you soon.
                  </span>
                </div>
              )}
              
              {booking.status === 'in_progress' && (
                <div className="flex items-center gap-2 text-purple-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Service is in progress. You can chat with your provider for updates.
                  </span>
                </div>
              )}
              
              {booking.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Service completed! Please rate your experience.
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {canMakePayment && (
                <Button 
                  onClick={() => setShowPayment(true)}
                  className="flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pay Now (PKR {booking.final_cost || booking.estimated_cost})
                </Button>
              )}
              
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={handleCancelBooking}
                  disabled={isLoading}
                  className={canMakePayment ? '' : 'flex-1'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      {showPayment && canMakePayment && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>
              Secure payment for your service booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm
              bookingId={booking.id}
              amount={booking.final_cost || booking.estimated_cost}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
            
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setShowPayment(false)}
                className="w-full"
              >
                Cancel Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingFlow;