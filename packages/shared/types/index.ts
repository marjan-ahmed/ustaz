export type ServiceRequestStatus =
  | 'notified_multiple'
  | 'accepted'
  | 'provider_enroute'
  | 'arriving'
  | 'arrived'
  | 'in_progress'
  | 'work_in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_ustaz_found'
  | 'rejected';

export type WarrantyClaimStatus = 'pending' | 'accepted' | 'refused' | 'resolved';

export interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: string;
  status: ServiceRequestStatus;
  address?: string | null;
  request_latitude?: number | null;
  request_longitude?: number | null;
  accepted_by_provider_id?: string | null;
  service_completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Provider {
  userId: string;
  firstName: string;
  lastName: string;
  service_type: string;
  online_status?: boolean;
  provider_status?: 'available' | 'busy' | 'offline' | string;
  rating_avg?: number;
  rating_count?: number;
}

export interface WalletTransaction {
  id: string;
  provider_id: string;
  type: 'topup' | 'commission' | 'penalty' | string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string | null;
  created_at: string;
}

export interface WarrantyClaim {
  id: string;
  request_id: string;
  customer_id: string;
  provider_id: string;
  status: WarrantyClaimStatus;
  description?: string | null;
  claimed_at: string;
  provider_responded_at?: string | null;
  resolved_at?: string | null;
}