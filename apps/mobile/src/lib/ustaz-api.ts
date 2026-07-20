import type { RealtimeChannel, User } from '@supabase/supabase-js';
import { PROVIDER_MIN_WALLET_BALANCE } from '@ustaz/shared';
import { supabase } from './supabase';

export async function sendPushNotification(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (!userIds?.length) return;
  try {
    const { error } = await supabase.functions.invoke('send-fcm', {
      body: { userIds, title, body, data: data ?? {} },
    });
    if (error) console.warn('[sendPushNotification] edge function error', error.message);
  } catch (e) {
    console.warn('[sendPushNotification] failed (non-fatal)', e);
  }
}

export type ServiceRequestStatus =
  | 'pending_notification'
  | 'notified_multiple'
  | 'accepted'
  | 'provider_enroute'
  | 'arriving'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'error'
  | 'no_ustaz_found';

export type ServiceRequest = {
  id: string;
  user_id: string;
  service_type: string;
  request_details?: string | null;
  address?: string | null;
  status: ServiceRequestStatus;
  request_latitude?: number | null;
  request_longitude?: number | null;
  accepted_by_provider_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  service_started_at?: string | null;
  service_completed_at?: string | null;
};

export type ProviderCandidate = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  serviceType: string | null;
  city?: string | null;
  avatarUrl?: string | null;
  distance: number;
};

export type HistoryRow = {
  request_id: string;
  service_type: string;
  status: ServiceRequestStatus | string;
  address: string | null;
  created_at: string;
  completed_at: string | null;
  provider_id: string | null;
  provider_name: string | null;
  warranty_status: string | null;
  warranty_claimed_at: string | null;
  has_rated: boolean;
};

export type WalletData = {
  wallet_id: string;
  balance: number;
  total_earned: number;
  total_commission_paid: number;
  recent_transactions: any[];
  pending_topups: any[];
};

export type ProviderNotification = {
  notificationId: string;
  requestId: string;
  message: string | null;
  serviceType: string | null;
  status: string;
  createdAt: string;
  requestDetails: ServiceRequest | null;
};

export type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  updated_at?: string | null;
};

export type Conversation = {
  peerId: string;
  peerName: string;
  requestId: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export const ACTIVE_STATUSES: ServiceRequestStatus[] = [
  'notified_multiple',
  'accepted',
  'provider_enroute',
  'arriving',
  'arrived',
  'in_progress',
  'work_in_progress',
];

export async function sendPhoneOtp(phone: string) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${supabaseUrl}/functions/v1/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error || `Server error (${res.status})`;
    throw new Error(msg);
  }
}

export async function verifyPhoneOtp(phone: string, code: string) {
  const { data, error } = await supabase.functions.invoke('verify-otp', { body: { phone, code } });
  if (error || !data?.ok) throw error ?? new Error('Incorrect or expired code.');

  const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: data.hashed_token,
    type: 'magiclink',
  });
  if (sessionError || !sessionData.user) throw sessionError ?? new Error('Could not start session.');
  return sessionData.user;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function findNearbyProviders(serviceType: string, userLat: number, userLng: number, radiusKm = 3) {
  const radiusMeters = radiusKm * 1000;
  const { data, error } = await supabase.rpc('find_providers_nearby_ranked', {
    p_user_lat: userLat,
    p_user_lng: userLng,
    p_service_type: serviceType,
    p_radius_meters: radiusMeters,
    p_limit: 5,
  });

  if (!error && data) {
    return ((data ?? []) as any[])
      .map((provider: any) => ({
        id: provider.user_id ?? provider.userId,
        firstName: provider.first_name ?? provider.firstName ?? null,
        lastName: provider.last_name ?? provider.lastName ?? null,
        email: provider.email ?? null,
        phoneNumber: provider.phone_number ?? provider.phoneNumber ?? null,
        serviceType: provider.service_type ?? serviceType,
        city: provider.city ?? null,
        avatarUrl: provider.avatar_url ?? provider.avatarUrl ?? null,
        distance: Math.round(provider.distance_meters ?? provider.distance ?? Number.MAX_SAFE_INTEGER),
      }))
      .slice(0, 5) as ProviderCandidate[];
  }


  if ((error as any).code !== '42883') throw error;

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('ustaz_registrations')
    .select('userId, firstName, lastName, email, phoneNumber, service_type, city, avatarUrl')
    .eq('service_type', serviceType)
    .eq('online_status', true)
    .eq('provider_status', 'available')
    .not('location', 'is', null)
    .limit(5);

  if (fallbackError) throw fallbackError;
  return (fallbackData ?? []).map((provider: any) => ({
    id: provider.userId,
    firstName: provider.firstName ?? null,
    lastName: provider.lastName ?? null,
    email: provider.email ?? null,
    phoneNumber: provider.phoneNumber ?? null,
    serviceType: provider.service_type,
    city: provider.city ?? null,
    avatarUrl: provider.avatarUrl ?? null,
    distance: Number.MAX_SAFE_INTEGER,
  })) as ProviderCandidate[];
}

export async function createServiceRequest(input: {
  serviceType: string;
  userLat: number;
  userLng: number;
  requestDetails?: string | null;
  landmark?: string | null;
  entrancePhotoUrl?: string | null;
  radiusKm?: number;
}) {
  const radiusMeters = Math.max(100, Math.min(50_000, Math.round((input.radiusKm ?? 3) * 1000)));
  const { data, error } = await supabase.rpc('create_service_request_with_notifications', {
    p_service_type: input.serviceType,
    p_request_latitude: input.userLat,
    p_request_longitude: input.userLng,
    p_request_details: input.requestDetails ?? null,
    p_radius_meters: radiusMeters,
    p_landmark: input.landmark ?? null,
    p_entrance_photo_url: input.entrancePhotoUrl ?? null,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  const requestId = row?.request_id as string | null;
  const notifiedCount = Number(row?.notified_count ?? 0);
  const providerIds = (row?.providers_notified ?? []) as string[];

  if (notifiedCount > 0) {
    sendPushNotification(
      providerIds,
      `New ${input.serviceType} request nearby`,
      input.requestDetails ?? 'A customer has requested your service',
      { url: '/dashboard', requestId: String(requestId), serviceType: input.serviceType },
    ).catch((err) => console.error('[createServiceRequest] push failed', err));
  }

  return { requestId, providersNotified: notifiedCount, providerIds };
}

export async function getRequest(requestId: string) {
  const { data, error } = await supabase.from('service_requests').select('*').eq('id', requestId).single();
  if (error) throw error;
  return data as ServiceRequest;
}

export async function getActiveCustomerRequest(userId: string) {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('user_id', userId)
    .in('status', ACTIVE_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ServiceRequest | null;
}

export function subscribeToRequest(requestId: string, onChange: (request: ServiceRequest) => void): RealtimeChannel {
  return supabase
    .channel(`mobile-service-request:${requestId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `id=eq.${requestId}` }, (payload) => {
      if (payload.new) onChange(payload.new as ServiceRequest);
    })
    .subscribe();
}

export async function cancelRequest(requestId: string, userId: string, asProvider = false) {
  const { data, error } = await supabase.rpc('cancel_service_request', {
    p_request_id: requestId,
    p_user_id: asProvider ? null : userId,
    p_provider_id: asProvider ? userId : null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.success) throw new Error(row?.message ?? 'Could not cancel request.');
  return row.updated_request as ServiceRequest;
}

export async function getCustomerHistory() {
  const { data, error } = await supabase.rpc('get_customer_history');
  if (error) throw error;
  return (data ?? []) as HistoryRow[];
}

export async function fileWarrantyClaim(requestId: string, description?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Sign in required.');

  const { data: request, error: requestError } = await supabase
    .from('service_requests')
    .select('id, status, user_id, accepted_by_provider_id, updated_at')
    .eq('id', requestId)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .single();
  if (requestError || !request) throw new Error('Completed service request not found.');

  const completedAt = new Date(request.updated_at).getTime();
  if (Date.now() - completedAt > 3 * 24 * 60 * 60 * 1000) {
    throw new Error('Warranty period has expired.');
  }
  if (!request.accepted_by_provider_id) throw new Error('No provider assigned to this request.');

  const { data, error } = await supabase
    .from('warranty_claims')
    .insert({
      request_id: requestId,
      customer_id: user.id,
      provider_id: request.accepted_by_provider_id,
      description: description?.trim() || null,
    })
    .select('id')
    .single();
  if (error) throw error;

  sendPushNotification(
    [request.accepted_by_provider_id],
    'Warranty Claim Filed',
    'A customer has filed a warranty claim. Please return to fix the issue within the 3-day window.',
    { url: '/dashboard', claimId: data.id, type: 'warranty_claim' },
  ).catch(() => {});

  return data.id as string;
}

export async function getProviderPendingRequests(userId: string) {
  const wallet = await getWallet(userId).catch(() => null);
  if (Number(wallet?.balance ?? 0) < PROVIDER_MIN_WALLET_BALANCE) return [];

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, request_id, message, service_type, status, created_at')
    .eq('recipient_user_id', userId)
    .in('status', ['pending'])
    .order('created_at', { ascending: false });
  if (error) throw error;

  const requestIds = (notifications ?? [])
    .map((n: any) => n.request_id)
    .filter((id: string | null): id is string => !!id);

  if (requestIds.length === 0) return [];

  const { data: requests } = await supabase
    .from('service_requests')
    .select('id, user_id, service_type, request_latitude, request_longitude, request_details, status, created_at')
    .in('id', requestIds);

  const requestMap = new Map((requests ?? []).map((r: any) => [r.id, r]));

  return (notifications ?? [])
    .filter((n: any) => {
      const req = requestMap.get(n.request_id);
      return req && ['pending_notification', 'notified_multiple'].includes(req.status);
    })
    .map((n: any) => ({
      notificationId: n.id,
      requestId: n.request_id,
      message: n.message,
      serviceType: n.service_type,
      status: n.status,
      createdAt: n.created_at,
      requestDetails: requestMap.get(n.request_id) ?? null,
    })) as ProviderNotification[];
}

export async function getProviderActiveRequests(userId: string) {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('accepted_by_provider_id', userId)
    .in('status', ACTIVE_STATUSES)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ServiceRequest[];
}

export async function respondToServiceRequest(requestId: string, action: 'accept' | 'reject') {
  const rpc = action === 'accept' ? 'accept_service_request_authed' : 'reject_service_request_authed';
  const { data, error } = await supabase.rpc(rpc, { p_request_id: requestId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.success === false) throw new Error(row?.message ?? `Could not ${action} request.`);

  if (action === 'accept' && row.updated_request) {
    const updated = typeof row.updated_request === 'string'
      ? JSON.parse(row.updated_request)
      : row.updated_request;
    const customerId = updated?.user_id;
    if (customerId) {
      const { data: prov } = await supabase
        .from('ustaz_registrations')
        .select('"firstName","lastName","service_type"')
        .eq('userId', updated?.accepted_by_provider_id)
        .maybeSingle();
      const providerName = prov
        ? `${prov.firstName ?? ''} ${prov.lastName ?? ''}`.trim() || 'Your Ustaz'
        : 'Your Ustaz';
      const serviceType = prov?.service_type ?? updated?.service_type ?? 'service';
      sendPushNotification(
        [customerId],
        `${providerName} accepted your request`,
        `Your ${serviceType} provider is on the way`,
        { url: '/process', requestId: String(updated.id ?? requestId) },
      ).catch((err) => console.error('[respondToServiceRequest] push failed', err));
    }
  }

  return row.updated_request as ServiceRequest | undefined;
}

export async function updateRequestStatus(requestId: string, providerId: string, action: 'arriving' | 'arrived' | 'in_progress' | 'start_service' | 'completed') {
  const rpcMap = {
    arriving: 'update_request_to_arriving',
    arrived: 'update_request_to_arrived',
    in_progress: 'update_request_to_in_progress',
    start_service: 'start_service',
    completed: 'complete_service',
  } as const;

  async function callStatusRpc(rpcName: (typeof rpcMap)[keyof typeof rpcMap]) {
    const { data, error } = await supabase.rpc(rpcName, {
      p_request_id: requestId,
      p_provider_id: providerId,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || row.success === false) throw new Error(row?.message ?? `Could not update request.`);
    return row;
  }

  try {
    const row = await callStatusRpc(rpcMap[action]);
    return row.updated_request as ServiceRequest;
  } catch (error: any) {
    if (action !== 'completed' || !String(error?.message ?? '').includes('Cannot complete from arrived')) {
      throw error;
    }

    await callStatusRpc('start_service');
    const row = await callStatusRpc('complete_service');
    return row.updated_request as ServiceRequest;
  }
}

export async function setProviderOnlineStatus(providerId: string, online: boolean) {
  const { error } = await supabase.rpc('update_provider_online_status', {
    p_user_id: providerId,
    p_online: online,
  });
  if (error) throw error;
}

export async function setProviderAvailability(providerId: string, status: 'available' | 'busy' | 'offline') {
  const { error } = await supabase
    .from('ustaz_registrations')
    .update({
      provider_status: status,
      last_seen_at: new Date().toISOString(),
    })
    .eq('userId', providerId);
  if (error) throw error;
}

const ARRIVAL_RADIUS_M = 80;
const AUTO_ARRIVAL_STATUSES = ['accepted', 'provider_enroute', 'arriving'];

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function autoMarkArrivedIfNearby(requestId: string, providerId: string, latitude: number, longitude: number) {
  const { data: request, error } = await supabase
    .from('service_requests')
    .select('id, status, accepted_by_provider_id, request_latitude, request_longitude')
    .eq('id', requestId)
    .maybeSingle();

  if (error || !request) return { arrived: false };
  if (request.accepted_by_provider_id !== providerId) return { arrived: false };
  if (!AUTO_ARRIVAL_STATUSES.includes(request.status)) return { arrived: false };
  if (typeof request.request_latitude !== 'number' || typeof request.request_longitude !== 'number') return { arrived: false };

  const distance = distanceMeters(latitude, longitude, request.request_latitude, request.request_longitude);
  if (distance > ARRIVAL_RADIUS_M) return { arrived: false, distanceMeters: Math.round(distance) };

  try {
    const updated = await updateRequestStatus(requestId, providerId, 'arrived');
    return { arrived: true, distanceMeters: Math.round(distance), request: updated };
  } catch (firstError) {
    if (request.status !== 'accepted') throw firstError;
    await updateRequestStatus(requestId, providerId, 'arriving');
    const updated = await updateRequestStatus(requestId, providerId, 'arrived');
    return { arrived: true, distanceMeters: Math.round(distance), request: updated };
  }
}
export async function getProviderStats(providerId: string) {
  const { data, error } = await supabase.rpc('get_provider_stats', { p_provider_id: providerId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function getWallet(providerId: string): Promise<WalletData | null> {
  const { data, error } = await supabase.rpc('get_wallet', { p_provider_id: providerId });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as WalletData | null;
}

export async function uploadTopupReceipt(input: { providerId: string; uri: string; fileName?: string | null; mimeType?: string | null }) {
  const mimeType = input.mimeType || 'image/jpeg';
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const safeName = (input.fileName || `receipt.${ext}`).replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${input.providerId}/${Date.now()}-${safeName}`;

  const response = await fetch(input.uri);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { data, error } = await supabase.storage
    .from('topup-receipts')
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('topup-receipts')
    .getPublicUrl(data.path);

  return { path: data.path, url: publicUrlData.publicUrl };
}

export async function createTopupRequest(input: { providerId: string; amountSent: number; transactionId: string; receiptUrl: string }) {
  const { data, error } = await supabase.rpc('create_topup_request', {
    p_provider_id: input.providerId,
    p_amount_sent: input.amountSent,
    p_transaction_id: input.transactionId.trim(),
    p_receipt_url: input.receiptUrl.trim(),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.success) throw new Error(row?.message ?? 'Failed to create top-up request.');
  return row as { success: boolean; message: string; request_id: string };
}

export async function getWarrantyClaims(providerId: string) {
  const { data, error } = await supabase
    .from('warranty_claims')
    .select('id, request_id, customer_id, status, description, claimed_at, service_requests(service_type, address, service_completed_at)')
    .eq('provider_id', providerId)
    .eq('status', 'pending')
    .order('claimed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function respondToWarranty(claimId: string, response: 'accepted' | 'refused') {
  const { data, error } = await supabase.rpc('respond_to_warranty', { p_claim_id: claimId, p_response: response });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? 'Could not respond to warranty claim.');

  const { data: claim } = await supabase
    .from('warranty_claims')
    .select('customer_id, request_id')
    .eq('id', claimId)
    .single();

  if (claim) {
    const msg = response === 'accepted'
      ? 'Your provider accepted the warranty claim and will return to fix the issue.'
      : 'Your provider refused the warranty claim. USTAZ has penalized their account.';
    sendPushNotification(
      [claim.customer_id],
      response === 'accepted' ? 'Warranty Accepted' : 'Warranty Refused',
      msg,
      { url: '/process', requestId: claim.request_id, type: 'warranty_response' },
    ).catch(() => {});
  }

  return data;
}

export async function loadConversations(userId: string, asProvider: boolean): Promise<Conversation[]> {
  const conversations = new Map<string, Conversation>();

  // Step 1: Seed from recent service_requests
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const requests = asProvider
    ? await supabase
        .from('service_requests')
        .select('user_id, status, updated_at')
        .eq('accepted_by_provider_id', userId)
        .or(`status.in.(accepted,provider_enroute,arriving,arrived,in_progress),and(status.in.(completed,cancelled),updated_at.gte.${sevenDaysAgo})`)
        .order('updated_at', { ascending: false })
        .limit(20)
    : await supabase
        .from('service_requests')
        .select('accepted_by_provider_id, status, updated_at')
        .eq('user_id', userId)
        .not('accepted_by_provider_id', 'is', null)
        .or(`status.in.(accepted,provider_enroute,arriving,arrived,in_progress),and(status.in.(completed,cancelled),updated_at.gte.${sevenDaysAgo})`)
        .order('updated_at', { ascending: false })
        .limit(20);

  const peerIds = new Set<string>();
  for (const req of requests.data ?? []) {
    const peerId = asProvider ? (req as any).user_id : (req as any).accepted_by_provider_id;
    if (peerId && !peerIds.has(peerId)) {
      peerIds.add(peerId);
      conversations.set(peerId, {
        peerId,
        peerName: 'User',
        requestId: null,
        lastMessage: '',
        lastAt: (req as any).updated_at ?? '',
        unread: 0,
      });
    }
  }

  // Step 2: Resolve display names
  for (const peerId of peerIds) {
    const { data: displayName } = await supabase.rpc('get_user_display_name', { p_user_id: peerId });
    const conv = conversations.get(peerId);
    if (conv) conv.peerName = displayName || 'User';
  }

  // Step 3: Overlay with real message data (last message + timestamp)
  const { data: receivedMessages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: sentMessages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  for (const msg of [...(receivedMessages ?? []), ...(sentMessages ?? [])]) {
    const peerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
    if (!peerId) continue;

    const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!conversations.has(peerId)) {
      conversations.set(peerId, {
        peerId,
        peerName: 'User',
        requestId: null,
        lastMessage: msg.message,
        lastAt: msgTime,
        unread: msg.recipient_id === userId ? 1 : 0,
      });
    } else {
      const conv = conversations.get(peerId)!;
      if (!conv.lastMessage) {
        conv.lastMessage = msg.message;
        conv.lastAt = msgTime;
      }
      if (msg.recipient_id === userId) {
        conv.unread += 1;
      }
    }
  }

  return [...conversations.values()].sort((a, b) => {
    if (a.lastAt && b.lastAt) return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
    if (a.lastAt) return -1;
    if (b.lastAt) return 1;
    return 0;
  });
}

export async function loadMessages(peerId: string, userId: string, requestId?: string | null) {
  void requestId;
  const query = supabase
    .from('chat_messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`)
    .order('created_at', { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendChatMessage(input: { requestId?: string | null; senderId: string; recipientId: string; message: string }) {
  void input.requestId;
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      sender_id: input.senderId,
      recipient_id: input.recipientId,
      message: input.message.trim(),
    })
    .select()
    .single();
  if (error) throw error;

  let senderName = 'New message';
  const { data: prov } = await supabase
    .from('ustaz_registrations')
    .select('"firstName", "lastName"')
    .eq('userId', input.senderId)
    .maybeSingle();
  if (prov) {
    const composed = `${prov.firstName ?? ''} ${prov.lastName ?? ''}`.trim();
    if (composed) senderName = composed;
  } else {
    const { data: authUser } = await supabase.auth.getUser();
    const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, string | undefined>;
    senderName = meta.full_name || meta.name || meta.firstName || meta.phone || 'New message';
  }

  sendPushNotification(
    [input.recipientId],
    senderName,
    input.message.trim().slice(0, 140) || 'sent you a message',
    { senderId: input.senderId, type: 'chat' },
  ).catch(() => {});

  return data as ChatMessage;
}

export function subscribeToChat(userId: string, onMessage: (message: ChatMessage) => void): RealtimeChannel {
  return supabase
    .channel(`mobile-chat:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
      const msg = payload.new as ChatMessage;
      if (msg.sender_id === userId || msg.recipient_id === userId) onMessage(msg);
    })
    .subscribe();
}

export function statusLabel(status?: string | null) {
  switch (status) {
    case 'notified_multiple': return 'Finding provider';
    case 'accepted': return 'Accepted';
    case 'provider_enroute': return 'On the way';
    case 'arriving': return 'Arriving';
    case 'arrived': return 'Arrived';
    case 'in_progress': return 'Working';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status ?? 'Unknown';
  }
}

export function formatDistance(meters?: number | null) {
  if (meters == null || !Number.isFinite(meters) || meters === Number.MAX_SAFE_INTEGER) return 'Nearby';
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export async function getAssignedProvider(providerId: string) {
  const { data, error } = await supabase
    .from('ustaz_registrations')
    .select('userId, firstName, lastName, phoneNumber, service_type, city, rating_avg, rating_count, avatarUrl')
    .eq('userId', providerId)
    .single();
  if (error) throw error;
  return data;
}



