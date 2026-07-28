export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'provider' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceProvider extends User {
  role: 'provider';
  businessName: string;
  description: string;
  categories: ServiceCategory[];
  skills: string[];
  hourlyRate: number;
  availability: Availability;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  documents: Document[];
  rating: number;
  totalJobs: number;
  totalEarnings: number;
  location: Location;
  isOnline: boolean;
}

export interface Customer extends User {
  role: 'customer';
  defaultAddress?: string;
  totalBookings: number;
  loyaltyPoints: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  averageRate: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

export interface Availability {
  isAvailable: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: number[]; // 0-6 (Sunday to Saturday)
  customSchedule?: {
    [key: string]: {
      start: string;
      end: string;
      isAvailable: boolean;
    };
  };
}

export interface Document {
  id: string;
  type: 'cnic' | 'license' | 'certificate' | 'other';
  url: string;
  verified: boolean;
  uploadedAt: Date;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  providerId?: string;
  categoryId: string;
  title: string;
  description: string;
  location: Location;
  scheduledDate?: Date;
  urgency: 'low' | 'medium' | 'high';
  estimatedDuration: number; // in hours
  budget: {
    min: number;
    max: number;
  };
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  serviceRequestId: string;
  customerId: string;
  providerId: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  totalAmount: number;
  platformFee: number; // 10% commission
  providerAmount: number; // 90% to provider
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'easypaisa' | 'jazzcash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: 'customer' | 'provider';
  content: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: Date;
  isRead: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
}

export interface LoyaltyProgram {
  id: string;
  customerId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  rewards: Reward[];
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  discountPercentage: number;
  isActive: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  platformCommission: number;
  pendingVerifications: number;
  activeBookings: number;
}