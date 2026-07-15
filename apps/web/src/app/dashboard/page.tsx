// This file has been restored to its original state before the redesign
// We'll put back the original implementation

"use client"
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { supabase } from "../../../client/supabaseClient";
import {
  User,
  Settings,
  Phone,
  CheckCircle,
  XCircle,
  Briefcase,
  MapPin,
  ChevronRight,
  CircleDashed,
  Save,
  Edit,
  X,
  Bell,
  LogOut,
  MailOpen, // Added for request details
  Clock, // Added for request timestamp
  MessageSquare,
  Info, // Added for chat/message icon
  Wallet as WalletIcon,
  ShieldCheck,
  CheckCheck,
  ArrowLeft,
  Send,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProviderRequestNotification from "../components/ProviderRequestNotification";
import ReactConfetti from "react-confetti";
import ProviderLocationTracker from "../components/ProviderLocationTracker";
import ArrivalWorkflow from "../components/ArrivalWorkflow";
import WalletPanel from "../components/WalletPanel";
import { toast } from "sonner";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useFcmToken } from "@/hooks/useFcmToken";

// Define TypeScript Interfaces
interface IProviderData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  cnic: string;
  city: string;
  phoneNumber: string;
  service_type: string;
  hasActiveMobile: boolean | null;
  avatarUrl: string | null;
  registrationDate: string;
  phone_verified: boolean;
  verification_status: string | null;
  verification_expires_at: string | null;
}

// New interface for Service Request
interface IServiceRequest {
  id: string;
  user_id: string; // The user who made the request
  service_type: string;
  request_latitude: number;
  request_longitude: number;
  request_details: string | null;
  status: 'pending_notification' | 'notified_multiple' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'error' | 'no_ustaz_found';
  created_at: string;
  notified_providers?: string[]; // Array of provider IDs who were notified
  accepted_by_provider_id?: string | null; // The provider who accepted
}

interface Notification {
  id: string;
  message: string;
  service_type: string;
  address: string;
  created_at: string;
  sender_user_id: string;
}

// Loading skeleton components
function DashboardSkeleton() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        {/* Sidebar Skeleton */}
        <div className="w-64 border-r border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <div className="space-y-1">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-6">
            <Skeleton className="h-6 w-6" />
            <div className="h-4 w-px bg-gray-200 mx-2" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Personal Information Skeleton */}
                  <div>
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location Information Skeleton */}
                  <div>
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Information Skeleton */}
                  <div>
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Service Information Skeleton */}
                  <div>
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProviderDashboardInner() {
  const [providerData, setProviderData] = useState<IProviderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Added 'request' and 'chat' tabs
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "phone-verification" | "request" | "chat" | "wallet" | "warranty">("profile");

  // Welcome confetti ??? shown once per provider on first dashboard visit
  const [showDashWelcome, setShowDashWelcome] = useState(false);
  const [runConfetti, setRunConfetti]         = useState(false);

  // State for editing profile
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editableFormData, setEditableFormData] = useState<IProviderData | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // OTP States
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [otpSentMessage, setOtpSentMessage] = useState<string>("");
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Phone number change dialog states
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState<boolean>(false);
  const [newPhoneData, setNewPhoneData] = useState({
    phoneNumber: "",
  });
  const [phoneChangeErrors, setPhoneChangeErrors] = useState<Record<string, string>>({});
  const [isSavingPhone, setIsSavingPhone] = useState<boolean>(false);

  // Rating state is now only on the process page (customer rates provider)

  // Warranty claims state
  const [warrantyClaims, setWarrantyClaims]   = useState<any[]>([]);
  const [warrantyResponding, setWarrantyResponding] = useState<string | null>(null);

  // Provider stats (avg rating, completed jobs)
  const [providerStats, setProviderStats] = useState<{ avg_rating: number; total_ratings: number; completed_jobs: number } | null>(null);

  // Provider standing (tier + performance)
  const [providerStanding, setProviderStanding] = useState<any>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealType, setAppealType] = useState<'rating' | 'incident' | 'verification' | 'general'>('general');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  // New state for service requests
  const [serviceRequests, setServiceRequests] = useState<IServiceRequest[]>([]);
  const [unreadRequestCount, setUnreadRequestCount] = useState<number>(0); // For notification badge
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0); // Chat tab notifier (parity with requests)

  // Ref to keep track of current service requests to avoid stale closures in useEffect
  const serviceRequestsRef = useRef<IServiceRequest[]>([]);
  useEffect(() => {
    serviceRequestsRef.current = serviceRequests;
  }, [serviceRequests]);

  // New state for chat functionality
  const [conversations, setConversations] = useState<Array<{userId: string, userName: string, lastMessage: string, lastMessageTime: string, unread: number}>>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Provider identity comes from the authenticated session ??? NEVER from the URL.
  // A URL `?userId=` param is ignored and stripped on first render.
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useSupabaseUser();
  const userIdFromUrl = user?.id ?? null;

  // Optimistic chat sender ??? shared by Enter key + Send button.
  const sendChatMessage = useCallback(async () => {
    const text = chatDraft.trim();
    if (!text || chatSending || !selectedConversation || !userIdFromUrl) return;
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = {
      id: tempId,
      sender_id: userIdFromUrl,
      recipient_id: selectedConversation,
      message: text,
      created_at: new Date().toISOString(),
      _pending: true,
      _tempId: tempId,
    };
    setChatMessages((prev) => [...prev, optimistic]);
    setChatDraft('');
    setChatSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      sender_id: userIdFromUrl,
      recipient_id: selectedConversation,
      message: text,
    });
    setChatSending(false);

    if (!error) {
      // Fire-and-forget push notification to the customer
      fetch('/api/chat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: selectedConversation, preview: text }),
      }).catch(() => {});
    }

    if (error) {
      setChatMessages((prev) => prev.filter((m: any) => m._tempId !== tempId));
      setChatDraft((d) => d || text);
      if (error.code === '42501') {
        toast.error("You can only chat with someone you're actively engaged with.");
      } else {
        toast.error('Failed to send message');
      }
    }
  }, [chatDraft, chatSending, selectedConversation, userIdFromUrl]);

  // Auto-scroll on new chat messages
  useEffect(() => {
    if (activeTab === 'chat' && selectedConversation) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatMessages.length, activeTab, selectedConversation]);

  // Unread-chat badge: increments when an incoming message arrives while the
  // provider is NOT looking at that conversation. Clears when the Chat tab
  // is opened (matching how mobile chat apps mark a thread as read).
  useEffect(() => {
    if (!userIdFromUrl) return;
    const channel = supabase
      .channel(`unread-chat:${userIdFromUrl}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as { sender_id: string; recipient_id: string };
          if (row.recipient_id !== userIdFromUrl) return;       // not for us
          if (row.sender_id === userIdFromUrl) return;          // our own echo
          // If user is currently viewing this exact conversation, don't bump
          if (activeTab === 'chat' && selectedConversation === row.sender_id) return;
          setUnreadChatCount((n) => n + 1);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userIdFromUrl, activeTab, selectedConversation]);

  // Clear the badge as soon as the provider opens the Chat tab.
  useEffect(() => {
    if (activeTab === 'chat') setUnreadChatCount(0);
  }, [activeTab]);

  // Register this device for FCM push so the provider receives new-request
  // notifications even when the dashboard tab is closed.
  const { status: fcmStatus, retry: retryFcm } = useFcmToken(Boolean(isLoaded && isSignedIn && user?.id));

  // Debug: log FCM token registration status
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id && fcmStatus !== 'loading') {
      console.log('[dashboard] FCM token status:', fcmStatus);
    }
  }, [isLoaded, isSignedIn, user?.id, fcmStatus]);

  // Dashboard menu items - Added "Request" and "Chat"
  const dashboardMenuItems = [
    {
      title: "Requests", // Changed to plural for multiple requests
      tab: "request",
      icon: Bell, // Using Bell icon for requests/notifications
    },
    {
      title: "Chat",
      tab: "chat",
      icon: MessageSquare, // Using MessageSquare icon for chat
    },
    {
      title: "Profile",
      tab: "profile",
      icon: User,
    },
    {
      title: "Settings",
      tab: "settings",
      icon: Settings,
    },
    {
      title: "Phone Verification",
      tab: "phone-verification",
      icon: Phone,
    },
    {
      title: "Wallet",
      tab: "wallet",
      icon: WalletIcon,
    },
    {
      title: "Warranty",
      tab: "warranty",
      icon: ShieldCheck,
    },
  ];

  // Cities data
  const citiesByCountry: Record<string, string[]> = {
    Pakistan: [
      "Karachi",
      "Lahore",
      "Islamabad",
      "Rawalpindi",
      "Faisalabad",
      "Multan",
      "Peshawar",
      "Quetta",
      "Sialkot",
      "Hyderabad",
    ],
    "United States": [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose",
    ],
    "United Kingdom": [
      "London",
      "Birmingham",
      "Manchester",
      "Glasgow",
      "Liverpool",
      "Bristol",
      "Sheffield",
      "Leeds",
      "Edinburgh",
      "Leicester",
    ],
    Canada: [
      "Toronto",
      "Montreal",
      "Vancouver",
      "Calgary",
      "Edmonton",
      "Ottawa",
      "Winnipeg",
      "Quebec City",
      "Hamilton",
      "Halifax",
    ],
    Australia: [
      "Sydney",
      "Melbourne",
      "Brisbane",
      "Perth",
      "Adelaide",
      "Gold Coast",
      "Canberra",
      "Newcastle",
      "Wollongong",
      "Hobart",
    ],
  };


  useEffect(() => {
    const loadInitial = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setNotifications(data as Notification[]);
      if (error) console.error(error);
    };
    loadInitial();

    // realtime subscription
    const channel = supabase
      .channel("provider_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const notif = payload.new as Notification;
          setNotifications((prev) => [notif, ...prev]);

          // ??? optional toast popup
          toast.success(notif.message, {
            description: `Address: ${notif.address}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleAcceptRequest(requestId: string) {
    try {
      const response = await fetch('/api/handle-service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // providerId is derived server-side from auth.uid(); never trust client value.
          requestId: requestId,
          action: 'accept'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept request');
      }

      // Update provider status to busy since they accepted a request
      if (userIdFromUrl) {
        updateProviderAvailability(userIdFromUrl, 'busy');
      }

      // The notification status will be updated via real-time subscription
      toast.success('Service request accepted successfully!');
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast.error(error.message || 'Failed to accept request');
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      const response = await fetch('/api/handle-service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // providerId is derived server-side from auth.uid(); never trust client value.
          requestId: requestId,
          action: 'reject'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      // The notification status will be updated via real-time subscription
      toast.success('Service request rejected');
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    }
  }


  // Fetch provider data
  const fetchProviderData = useCallback(async (currentUserId: string | null) => {
    if (!currentUserId) {
      setLoading(false);
      setError("User ID not found in URL. Please ensure you are registered and navigated correctly.");
      setProviderData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("ustaz_registrations")
        .select("*")
        .eq("userId", currentUserId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setProviderData(data as IProviderData);
      } else {
        setProviderData(null);
      }
    } catch (err: any) {
      console.error("Error fetching provider data:", err.message);
      setError(`Failed to load data: ${err.message}. Please ensure you are registered with this User ID.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Callback for ArrivalWorkflow status changes
  const handleRequestStatusChange = useCallback((newStatus: string, requestId: string) => {
    setServiceRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: newStatus as IServiceRequest['status'] } : req
      )
    );
  }, []);

  const ACTIVE_REQUEST_STATUSES = [
    'notified_multiple', 'accepted', 'provider_enroute',
    'arriving', 'arrived', 'in_progress', 'work_in_progress',
  ] as const;

  // New: Fetch service requests for this provider ??? only active ones
  const fetchServiceRequests = useCallback(async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .or(`notified_providers.cs.{${providerId}},accepted_by_provider_id.eq.${providerId}`)
        .in('status', ACTIVE_REQUEST_STATUSES)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as IServiceRequest[];
      setServiceRequests(rows);
      const unread = rows.filter(req =>
        req.status === 'notified_multiple' &&
        req.notified_providers?.includes(providerId) &&
        req.accepted_by_provider_id !== providerId
      ).length;
      setUnreadRequestCount(unread);
    } catch (err: any) {
      console.error("Error fetching service requests:", err.message);
    }
  }, []);

  // Auth gate: send unauthenticated visitors to provider login. After auth,
  // if no provider profile exists for this user, send them to /become-ustaz.
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/auth/provider-login');
      return;
    }
  }, [isLoaded, isSignedIn, router]);

  // Show welcome confetti once per provider (keyed in localStorage)
  useEffect(() => {
    if (!userIdFromUrl) return;
    const key = `ustaz_dash_welcomed_${userIdFromUrl}`;
    if (!localStorage.getItem(key)) {
      setShowDashWelcome(true);
      setRunConfetti(true);
    }
  }, [userIdFromUrl]);

  // Fetch pending warranty claims for this provider (enriched w/ customer name + service)
  const fetchWarrantyClaims = useCallback(async () => {
    if (!userIdFromUrl) return;
    const { data } = await supabase
      .from('warranty_claims')
      .select('id, request_id, customer_id, status, description, claimed_at, service_requests(service_type, address, service_completed_at)')
      .eq('provider_id', userIdFromUrl)
      .eq('status', 'pending')
      .order('claimed_at', { ascending: false });
    if (!data) return;
    // Resolve customer display names in parallel
    const enriched = await Promise.all(data.map(async (c: any) => {
      const { data: name } = await supabase.rpc('get_user_display_name', { p_user_id: c.customer_id });
      return {
        ...c,
        customer_name: (name as string) || 'Customer',
        service_type: c.service_requests?.service_type ?? null,
        address: c.service_requests?.address ?? null,
        completed_at: c.service_requests?.service_completed_at ?? null,
      };
    }));
    setWarrantyClaims(enriched);
  }, [userIdFromUrl]);

  useEffect(() => { fetchWarrantyClaims(); }, [fetchWarrantyClaims]);

  // Fetch provider stats (avg rating + completed jobs)
  useEffect(() => {
    if (!userIdFromUrl) return;
    supabase
      .rpc('get_provider_stats', { p_provider_id: userIdFromUrl })
      .then(({ data }) => {
        if (data) {
          const row = Array.isArray(data) ? data[0] : data;
          if (row) setProviderStats({ avg_rating: row.avg_rating ?? 0, total_ratings: row.total_ratings ?? 0, completed_jobs: row.completed_jobs ?? 0 });
        }
      });
  }, [userIdFromUrl]);

  // Fetch provider standing (tier + verification)
  useEffect(() => {
    if (!userIdFromUrl) return;
    supabase
      .from('provider_standing')
      .select('*')
      .eq('provider_id', userIdFromUrl)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProviderStanding(data);
      });
  }, [userIdFromUrl]);

  // Submit appeal handler
  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) return;
    setSubmittingAppeal(true);
    try {
      const res = await fetch('/api/provider/submit-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appeal_type: appealType, reason: appealReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Appeal submitted successfully');
      setShowAppealModal(false);
      setAppealReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit appeal');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userIdFromUrl) return;
    fetchProviderData(userIdFromUrl);

    // Update provider status to online and available when dashboard loads
    if (userIdFromUrl) {
      updateProviderStatus(userIdFromUrl, true);
      updateProviderAvailability(userIdFromUrl, 'available');
    }

    // Clean up: set provider status to offline when leaving the page
    return () => {
      if (userIdFromUrl) {
        updateProviderAvailability(userIdFromUrl, 'offline');
      }
    };
  }, [userIdFromUrl]);

  // Function to update provider online status
  const updateProviderStatus = async (providerId: string, online: boolean) => {
    try {
      const response = await fetch('/api/provider-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          online
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Show specific error from server (e.g. insufficient balance)
        toast.error(data.details || data.error || 'Failed to update provider status');
        throw new Error(data.error || 'Failed to update provider status');
      }
    } catch (error: any) {
      console.error('Error updating provider status:', error);
    }
  };

  // Function to update provider availability status (available, busy, offline)
  const updateProviderAvailability = async (providerId: string, status: 'available' | 'busy' | 'offline') => {
    try {
      const { error } = await supabase
        .from('ustaz_registrations')
        .update({
          provider_status: status,
          last_seen_at: new Date().toISOString()
        })
        .eq('userId', providerId);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error updating provider availability:', error);
    }
  };

  // Effect to load conversations for the chat tab
  useEffect(() => {
    if (activeTab !== 'chat' || !userIdFromUrl) return;

    const fetchConversations = async () => {
      try {
        const uniqueConversations = new Map<string, { userId: string; userName: string; lastMessage: string; lastMessageTime: string; unread: number }>();

        // ?????? Step 1: seed from recent service_requests (accepted/completed/cancelled ???7d)
        // This allows the provider to initiate chat even when no messages exist yet.
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentRequests } = await supabase
          .from('service_requests')
          .select('user_id, status, updated_at')
          .eq('accepted_by_provider_id', userIdFromUrl)
          .or(`status.in.(accepted,provider_enroute,arriving,arrived,in_progress,work_in_progress),and(status.in.(completed,cancelled),updated_at.gte.${sevenDaysAgo})`)
          .order('updated_at', { ascending: false })
          .limit(20);

        // Resolve display names for all unique customer IDs in one pass
        const customerIds = [...new Set((recentRequests ?? []).map(r => r.user_id))];
        const nameMap = new Map<string, string>();
        await Promise.all(customerIds.map(async (uid) => {
          const { data } = await supabase.rpc('get_user_display_name', { p_user_id: uid });
          nameMap.set(uid, (data as string) || 'Customer');
        }));

        for (const req of recentRequests ?? []) {
          if (!uniqueConversations.has(req.user_id)) {
            uniqueConversations.set(req.user_id, {
              userId: req.user_id,
              userName: nameMap.get(req.user_id) ?? 'Customer',
              lastMessage: '',
              lastMessageTime: '',
              unread: 0,
            });
          }
        }

        // ?????? Step 2: overlay with real message data (last message + timestamp)
        const { data: receivedMessages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('recipient_id', userIdFromUrl)
          .order('created_at', { ascending: false })
          .limit(50);

        const { data: sentMessages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('sender_id', userIdFromUrl)
          .order('created_at', { ascending: false })
          .limit(50);

        for (const msg of [...(receivedMessages ?? []), ...(sentMessages ?? [])]) {
          const otherUserId = msg.sender_id === userIdFromUrl ? msg.recipient_id : msg.sender_id;
          const existing = uniqueConversations.get(otherUserId);
          const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          if (!existing) {
            uniqueConversations.set(otherUserId, {
              userId: otherUserId,
              userName: 'Customer',
              lastMessage: msg.message,
              lastMessageTime: msgTime,
              unread: 0,
            });
          } else if (!existing.lastMessage) {
            // enrich the seed entry with real message preview
            existing.lastMessage = msg.message;
            existing.lastMessageTime = msgTime;
          }
        }

        setConversations(Array.from(uniqueConversations.values()));
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();

    // Set up real-time subscription for new messages to update conversations list
    const channel = supabase
      .channel(`conversations-${userIdFromUrl}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `or(sender_id.eq.${userIdFromUrl},recipient_id.eq.${userIdFromUrl})`, // Listen for messages where this user is involved
        },
        (payload) => {
          // Update the conversations list with the new message
          const newMessage = payload.new;
          const otherUserId = newMessage.sender_id === userIdFromUrl ? newMessage.recipient_id : newMessage.sender_id;
          const isCurrentUserSender = newMessage.sender_id === userIdFromUrl;

          setConversations(prevConversations => {
            // Check if this conversation already exists
            const existingConvIndex = prevConversations.findIndex(conv => conv.userId === otherUserId);

            if (existingConvIndex >= 0) {
              // Update existing conversation
              const updatedConversations = [...prevConversations];

              // Only update the last message if this is a received message (for the conversation list)
              if (!isCurrentUserSender) {
                updatedConversations[existingConvIndex] = {
                  ...updatedConversations[existingConvIndex],
                  lastMessage: newMessage.message,
                  lastMessageTime: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  // Increment unread count for received messages
                  unread: updatedConversations[existingConvIndex].unread + 1
                };
              } else {
                // If current user sent the message, update the last message but don't increment unread
                updatedConversations[existingConvIndex] = {
                  ...updatedConversations[existingConvIndex],
                  lastMessage: newMessage.message,
                  lastMessageTime: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
              }

              return updatedConversations;
            } else {
              // Add new conversation if it doesn't exist
              // In this case, we need to fetch user info for the new participant
              return prevConversations; // For now, just return existing conversations
            }
          });
        }
      )
      .subscribe();

    // Cleanup function to unsubscribe from real-time updates
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, userIdFromUrl]);

  // Effect to load messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation || !userIdFromUrl) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(
            `and(sender_id.eq.${selectedConversation},recipient_id.eq.${userIdFromUrl}),` +
            `and(sender_id.eq.${userIdFromUrl},recipient_id.eq.${selectedConversation})`
          )
          .order('created_at', { ascending: true });

        if (error) throw error;
        setChatMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Realtime ??? postgres_changes doesn't support compound filters; subscribe
    // broadly, then client-filter to this conversation. RLS already prevents
    // us receiving anyone else's chats.
    const channel = supabase
      .channel(`chat-${[selectedConversation, userIdFromUrl].sort().join(':')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const row = payload.new as any;
          const inThisConvo =
            (row.sender_id === userIdFromUrl && row.recipient_id === selectedConversation) ||
            (row.sender_id === selectedConversation && row.recipient_id === userIdFromUrl);
          if (!inThisConvo) return;
          setChatMessages((prev: any[]) => {
            // Reconcile our own optimistic message
            if (row.sender_id === userIdFromUrl) {
              const i = prev.findIndex(
                (m) => m._pending && m.message === row.message && m.recipient_id === row.recipient_id,
              );
              if (i >= 0) {
                const next = prev.slice();
                next[i] = row;
                return next;
              }
            }
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, userIdFromUrl]);

  // New: Realtime subscription for service requests for this provider
  useEffect(() => {
    // Supabase Auth is now the source of truth for phone verification;
    // `phone_verified` column kept for legacy UI but no longer gates realtime.
    if (!userIdFromUrl) return;

    // Initial fetch
    fetchServiceRequests(userIdFromUrl);

    // Set up Realtime listener.
    // NOTE: postgres_changes filters only support eq/neq/lt/lte/gt/gte/in ???
    // `cs` (array contains) is silently dropped. So we subscribe broadly and
    // filter client-side; RLS still ensures we only RECEIVE rows we can read.
    const channel = supabase
      .channel(`provider_requests:${userIdFromUrl}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
        },
        (payload) => {
          const newRequest = payload.new as IServiceRequest;
          const oldRequest = payload.old as IServiceRequest | undefined;

          const isMine =
            newRequest?.accepted_by_provider_id === userIdFromUrl ||
            newRequest?.notified_providers?.includes(userIdFromUrl) ||
            oldRequest?.accepted_by_provider_id === userIdFromUrl ||
            oldRequest?.notified_providers?.includes(userIdFromUrl);

          if (!isMine) return;
          console.log('Realtime service_requests change:', payload);

          setServiceRequests((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((req) => req.id !== (oldRequest?.id ?? newRequest.id));
            }
            // Remove from list when it leaves active statuses (cancelled/completed/etc.)
            const stillActive = (ACTIVE_REQUEST_STATUSES as readonly string[]).includes(newRequest.status);
            if (!stillActive) {
              return prev.filter((req) => req.id !== newRequest.id);
            }
            const existingIndex = prev.findIndex((req) => req.id === newRequest.id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = newRequest;
              return updated;
            }
            return [newRequest, ...prev];
          });

          // Recalculate unread count based on the current requests list using ref to avoid stale closure
          setUnreadRequestCount(currentRequests => {
            const currentRequestsSnapshot = serviceRequestsRef.current;
            const newUnreadCount = currentRequestsSnapshot.filter((req: IServiceRequest) =>
              req.status === 'notified_multiple' &&
              req.notified_providers?.includes(userIdFromUrl) &&
              req.accepted_by_provider_id !== userIdFromUrl
            ).length;
            return newUnreadCount;
          });
        }
      )
      // Piggyback on the notifications realtime (proven reliable ??? it powers the
      // popup toast). The service_requests no-filter subscription above can miss
      // the very first INSERT; a notification INSERT for us means a brand-new
      // request exists, so re-fetch the list to guarantee the request tab fills.
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${userIdFromUrl}`,
        },
        () => {
          fetchServiceRequests(userIdFromUrl);
        }
      )
      .subscribe();

    // Safety-net poll: every 8s reconcile the request list with the DB so a
    // dropped realtime frame never leaves the tab permanently stale.
    const pollId = setInterval(() => fetchServiceRequests(userIdFromUrl), 8000);

    return () => {
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [userIdFromUrl, fetchServiceRequests]); // phone_verified gate removed ??? auth is the verification

  // Handler for form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editableFormData) return;
    const { name, value, type } = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    let newValue: string | boolean | number = value;

    if (type === "radio") {
      newValue = (e.target as HTMLInputElement).value === "true";
    }

    setEditableFormData((prev) => ({
      ...(prev as IProviderData),
      [name]: newValue,
    }));

    if (editErrors[name]) {
      setEditErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handler for select changes
  const handleSelectChange = (name: keyof IProviderData, value: string) => {
    if (!editableFormData) return;
    setEditableFormData((prev) => ({
      ...(prev as IProviderData),
      [name]: value,
    }));

    if (editErrors[name]) {
      setEditErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle avatar file change
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableFormData((prev) => ({
          ...(prev as IProviderData),
          avatarUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setEditableFormData((prev) => ({
        ...(prev as IProviderData),
        avatarUrl: null,
      }));
    }
  };


  // Validation
  const validateEditableFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!editableFormData) return false;

    if (!(editableFormData.firstName || "").trim()) {
      newErrors.firstName = "First name is required.";
      isValid = false;
    }

    if (!(editableFormData.lastName || "").trim()) {
      newErrors.lastName = "Last name is required.";
      isValid = false;
    }

    if (!(editableFormData.cnic || "").trim()) {
      newErrors.cnic = "CNIC number is required.";
      isValid = false;
    } else if (!(editableFormData.cnic || "").startsWith("42201")) {
      newErrors.cnic = "CNIC must start with 42201.";
      isValid = false;
    } else if (!/^\d{13}$/.test(editableFormData.cnic || "")) {
      newErrors.cnic = "CNIC must be 13 digits (e.g., 4220112345678).";
      isValid = false;
    }

    if (!(editableFormData.phoneNumber || "").trim()) {
      newErrors.phoneNumber = "Phone number is required.";
      isValid = false;
    } else if (!/^\d{7,}$/.test(editableFormData.phoneNumber || "")) {
      newErrors.phoneNumber = "Please enter a valid phone number (digits only, at least 7).";
      isValid = false;
    }

    if (!(editableFormData.city || "").trim()) {
      newErrors.city = "City is required.";
      isValid = false;
    }

    if (!(editableFormData.service_type || "").trim()) {
      newErrors.service_type = "Service type is required.";
      isValid = false;
    }

    if (editableFormData.hasActiveMobile === null) {
      newErrors.hasActiveMobile = "Please select an option.";
      isValid = false;
    }

    setEditErrors(newErrors);
    return isValid;
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!editableFormData || !userIdFromUrl) return;

    if (!validateEditableFields()) {
      return;
    }

    setIsSavingProfile(true);
    setError(null);

    try {
      const phoneNumberChanged =
        providerData?.phoneNumber !== editableFormData.phoneNumber;

      const updatePayload = {
        firstName: (editableFormData.firstName || "").trim(),
        lastName: (editableFormData.lastName || "").trim(),
        email: (editableFormData.email || "").trim() || null,
        cnic: (editableFormData.cnic || "").trim(),
        city: (editableFormData.city || "").trim(),
        phoneNumber: (editableFormData.phoneNumber || "").trim(),
        service_type: (editableFormData.service_type || "").trim(),
        hasActiveMobile: editableFormData.hasActiveMobile,
        avatarUrl: (editableFormData.avatarUrl || "").trim() || null,
        phone_verified: phoneNumberChanged ? false : providerData?.phone_verified,
      };

      const { data, error: updateError } = await supabase
        .from("ustaz_registrations")
        .update(updatePayload)
        .eq("userId", userIdFromUrl)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProviderData(data as IProviderData);
      setIsEditingProfile(false);
      setEditErrors({});
      setEditableFormData(null);

      if (phoneNumberChanged) {
        setOtpSent(false);
        setOtpInput("");
        setOtpError("");
        setOtpSentMessage("Phone number updated. Please re-verify your phone number.");
        setActiveTab("phone-verification");
      }
    } catch (err: any) {
      console.error("Error saving profile:", err.message);
      setError(`Failed to save profile: ${err.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditableFormData(null);
    setEditErrors({});
  };

  // Handle phone number change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPhoneData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for the field being edited
    if (phoneChangeErrors[name]) {
      setPhoneChangeErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle country code selection for phone change
  const handlePhoneCountryChange = (value: string) => {
    // Phone country code is now hardcoded to +92
  };

  // Validate phone number change
  const validatePhoneChange = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!newPhoneData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
      isValid = false;
    } else if (!/^\d{7,}$/.test(newPhoneData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number (digits only, at least 7).";
      isValid = false;
    }

    // Check if the new phone number is different from current
    if (newPhoneData.phoneNumber === providerData?.phoneNumber) {
      newErrors.phoneNumber = "Please enter a different phone number.";
      isValid = false;
    }

    setPhoneChangeErrors(newErrors);
    return isValid;
  };

  // Save phone number change
  const handleSavePhoneChange = async () => {
    if (!userIdFromUrl || !validatePhoneChange()) return;

    setIsSavingPhone(true);
    setError(null);

    try {
      const updatePayload = {
        phoneNumber: newPhoneData.phoneNumber.trim(),
        phone_verified: false, // Reset verification status
      };

      const { data, error: updateError } = await supabase
        .from("ustaz_registrations")
        .update(updatePayload)
        .eq("userId", userIdFromUrl)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProviderData(data as IProviderData);

      // Reset dialog state
      setIsPhoneDialogOpen(false);
      setNewPhoneData({ phoneNumber: "" });
      setPhoneChangeErrors({});

      // Reset OTP states
      setOtpSent(false);
      setOtpInput("");
      setOtpError("");
      setOtpSentMessage("Phone number updated successfully. Please verify your new number.");
    } catch (err: any) {
      console.error("Error updating phone number:", err.message);
      setError(`Failed to update phone number: ${err.message}`);
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Handle dialog open
  const handleOpenPhoneDialog = () => {
    setNewPhoneData({
      phoneNumber: providerData?.phoneNumber || "",
    });
    setPhoneChangeErrors({});
    setIsPhoneDialogOpen(true);
  };

  // Send OTP
  const sendOtp = async () => {
    if (!providerData?.phoneNumber) {
      setOtpError("Phone number not available for OTP. Please update your profile.");
      return;
    }

    setOtpError("");
    setOtpSentMessage("");
    setIsSendingOtp(true);

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: providerData.phoneNumber,
          phoneCountryCode: "+92",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP.");
      }

      setOtpSent(true);
      setOtpSentMessage(
        `OTP has been sent to +92${providerData.phoneNumber}. Please check your phone.`,
      );
      console.log("OTP send request successful:", data);
    } catch (error: any) {
      console.error("Error sending OTP:", error.message);
      setOtpError(`Failed to send OTP: ${error.message}. Please check your phone number and try again.`);
      setOtpSent(false);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!providerData?.phoneNumber || !userIdFromUrl) {
      setOtpError("Phone number or User ID not available. Cannot verify.");
      return;
    }

    setOtpError("");
    setOtpSentMessage("");
    setIsVerifyingOtp(true);

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: providerData.phoneNumber,
          phoneCountryCode: "+92",
          otp: otpInput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP.");
      }

      const { error: updateError } = await supabase
        .from("ustaz_registrations")
        .update({ phone_verified: true })
        .eq("userId", userIdFromUrl);

      if (updateError) {
        throw updateError;
      }

      setProviderData((prev) => (prev ? { ...prev, phone_verified: true } : null));
      setOtpError("");
      setOtpSentMessage("Phone number verified successfully!");
      console.log("OTP verification successful:", data);
    } catch (error: any) {
      console.error("Error verifying OTP:", error.message);
      setOtpError(`Invalid OTP: ${error.message}. Please try again.`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <XCircle className="mr-2 h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">{error}</p>
            <Button onClick={() => fetchProviderData(userIdFromUrl)} className="w-full bg-[#db4b0d] hover:bg-[#c4420c]">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!providerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete your provider profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              You're signed in but haven't registered as a Ustaz provider yet.
              Fill out your profile to start receiving service requests.
            </p>
            <Button onClick={() => router.push('/become-ustaz')} className="w-full bg-[#db4b0d] hover:bg-[#c4420c]">
              Register as a Provider
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dismissWelcome = (goToWallet = false) => {
    localStorage.setItem(`ustaz_dash_welcomed_${userIdFromUrl}`, "1");
    setShowDashWelcome(false);
    setRunConfetti(false);
    if (goToWallet) setActiveTab("wallet");
  };

  return (
    <>
    {/* ?????? Welcome confetti overlay (profile tab, first visit only) ?????? */}
    {showDashWelcome && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        {runConfetti && (
          <ReactConfetti
            width={typeof window !== "undefined" ? window.innerWidth : 800}
            height={typeof window !== "undefined" ? window.innerHeight : 600}
            numberOfPieces={320} recycle={false} tweenDuration={6000}
            colors={["#db4b0d","#f59e0b","#25d366","#3b82f6","#8b5cf6","#ec4899","#ffffff"]}
          />
        )}
        <div className="relative z-10 w-full max-w-sm">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#db4b0d] via-[#f59e0b] to-[#db4b0d] opacity-60 blur-xl animate-pulse" />
          <div className="relative bg-[#111828] rounded-3xl p-8 text-center border border-white/10 shadow-2xl">
            <div className="relative mx-auto mb-5 w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#db4b0d] opacity-20 animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#db4b0d] flex items-center justify-center shadow-lg">
                <span className="text-4xl select-none">????</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> Welcome Bonus
            </span>
            <h2 className="mt-4 text-2xl font-extrabold text-white leading-snug" style={{ fontFamily: "Clash Grotesk, sans-serif" }}>
              Congrats! You received<br />
              <span className="text-[#f59e0b]">Rs. 500</span> in your wallet!
            </h2>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Start earning immediately. A <strong className="text-white/80">15% platform commission</strong> is
              auto-deducted from your wallet per completed job.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
              <span className="text-[#f59e0b]">????</span>
              <span className="text-white font-bold text-lg" style={{ fontFamily: "Clash Grotesk, sans-serif" }}>Rs. 500</span>
              <span className="text-white/50 text-xs">available now</span>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => dismissWelcome(false)}
                className="flex-1 h-12 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-sm font-semibold transition-all"
                style={{ fontFamily: "Clash Grotesk, sans-serif" }}
              >
                Close
              </button>
              <button
                onClick={() => dismissWelcome(true)}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#db4b0d] to-[#f59e0b] hover:opacity-90 text-white text-sm font-bold shadow-lg active:scale-95 transition-all"
                style={{ fontFamily: "Clash Grotesk, sans-serif" }}
              >
                See It ????
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#db4b0d] rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ustaz Dashboard</h1>
                <p className="text-sm text-gray-500">Service Provider Portal</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-6">
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-[#db4b0d]">
                  <AvatarImage src={providerData.avatarUrl || undefined} />
                  <AvatarFallback className="bg-[#db4b0d] text-white text-lg font-semibold">
                    {providerData.firstName.charAt(0)}
                    {providerData.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {providerData.firstName} {providerData.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{providerData.service_type}</p>
                  <div className="mt-1">
                    {providerData.phone_verified ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        <CircleDashed className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {!providerData.phone_verified && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-700">Complete phone verification to receive service requests</p>
                </div>
              )}
            </div>

              {/* Push notification status ??? visible in sidebar at all times */}
              <div className="mb-4">
                <div
                  className={`rounded-lg border p-3 transition-colors ${
                    fcmStatus === 'registered'
                      ? 'bg-green-50 border-green-200'
                      : fcmStatus === 'denied' || fcmStatus === 'error'
                      ? 'bg-amber-50 border-amber-200'
                      : fcmStatus === 'unsupported'
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {fcmStatus === 'denied' || fcmStatus === 'error' ? (
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                    ) : fcmStatus === 'registered' ? (
                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                    ) : (
                      <Bell className={`h-4 w-4 mt-0.5 shrink-0 ${
                        fcmStatus === 'unsupported' ? 'text-gray-400' : 'text-blue-600'
                      }`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium ${
                          fcmStatus === 'registered'
                            ? 'text-green-800'
                            : fcmStatus === 'denied' || fcmStatus === 'error'
                            ? 'text-amber-800'
                            : fcmStatus === 'unsupported'
                            ? 'text-gray-600'
                            : 'text-blue-800'
                        }`}
                      >
                        {fcmStatus === 'registered' && 'Push notifications active'}
                        {fcmStatus === 'loading' && 'Setting up notifications???'}
                        {fcmStatus === 'denied' && 'Notifications blocked'}
                        {fcmStatus === 'unsupported' && 'Push not supported'}
                        {fcmStatus === 'error' && 'Notification setup failed'}
                        {fcmStatus === 'granted' && 'Registering device???'}
                      </p>
                      {fcmStatus === 'denied' && (
                        <>
                          <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                            Click <strong>???? Site Info</strong> in address bar ??? <strong>Site Settings</strong> ??? set Notifications to <strong>Allow</strong>, then tap below.
                          </p>
                          <button
                            onClick={retryFcm}
                            className="text-xs mt-1.5 font-medium text-amber-700 underline underline-offset-2 transition-colors hover:text-amber-800"
                          >
                            Try again after allowing
                          </button>
                        </>
                      )}
                      {fcmStatus === 'error' && (
                        <button
                          onClick={retryFcm}
                          className="text-xs mt-1.5 font-medium text-amber-700 underline underline-offset-2 transition-colors hover:text-amber-800"
                        >
                          Retry setup
                        </button>
                      )}
                    </div>
                    {fcmStatus === 'loading' && (
                      <div className="h-3 w-3 mt-0.5 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    )}
                  </div>
                </div>
              </div>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {dashboardMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.tab}>
                        <SidebarMenuButton
                          onClick={() => setActiveTab(item.tab as "request" | "chat" | "settings" | "phone-verification" | "profile" | "wallet")}
                          className={`w-full justify-start px-3 py-2 rounded-lg transition-colors relative ${
                            activeTab === item.tab
                              ? "bg-[#db4b0d] text-white hover:bg-[#c4420c]"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.title}
                          {item.tab === "request" && unreadRequestCount > 0 && (
                            <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                              {unreadRequestCount}
                            </Badge>
                          )}
                          {item.tab === "chat" && unreadChatCount > 0 && (
                            <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold animate-pulse">
                              {unreadChatCount > 99 ? '99+' : unreadChatCount}
                            </Badge>
                          )}
                          {item.tab === "warranty" && warrantyClaims.length > 0 && (
                            <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold animate-pulse">
                              {warrantyClaims.length}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-3 py-2">
                  <Settings className="mr-3 h-4 w-4" />
                  Account
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" className="text-gray-500">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium">
                    {activeTab === "request" && "Service Requests"}
                    {activeTab === "chat" && "Chat Messages"}
                    {activeTab === "profile" && "Profile"}
                    {activeTab === "settings" && "Settings"}
                    {activeTab === "phone-verification" && "Phone Verification"}
                    {activeTab === "wallet" && "Wallet"}
                    {activeTab === "warranty" && "Warranty Claims"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="flex-1 p-6">
            {/*
              Always-mounted: location tracker + new-request popup.
              These run regardless of which tab the provider is on, so:
                - accepting a request immediately starts broadcasting GPS
                - a new request popup appears even while on Profile/Chat/etc.
              Tracker UI is only visible on the Profile tab; the popup is
              `position: fixed` so it floats above the content on every tab.
            */}
            {userIdFromUrl && (
              <ProviderRequestNotification
                providerId={userIdFromUrl!}
                onAccept={async (requestId) => { await handleAcceptRequest(requestId); }}
                onReject={async (requestId) => { await handleRejectRequest(requestId); }}
                onOpenChat={(userId, requestId) => {
                  setActiveTab('chat');
                  window.open(`/chat?with=${userId}&request=${requestId}`, '_blank');
                }}
              />
            )}
            {/* ?????? Provider Stats (profile tab) ?????? */}
            {providerData && activeTab === 'profile' && providerStats && (
              <div className="max-w-4xl mx-auto mb-6">
                <div className="grid grid-cols-3 gap-3">
                  {/* Avg Rating */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className={`w-4 h-4 ${s <= Math.round(providerStats.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      ))}
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">{providerStats.avg_rating > 0 ? providerStats.avg_rating.toFixed(1) : '???'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Avg Rating</p>
                  </div>
                  {/* Total Ratings */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
                    <p className="text-2xl font-extrabold text-gray-900">{providerStats.total_ratings}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Reviews</p>
                  </div>
                  {/* Completed Jobs */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
                    <p className="text-2xl font-extrabold text-[#db4b0d]">{providerStats.completed_jobs}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Jobs Done</p>
                  </div>
                </div>
              </div>
            )}

            {/* Provider Tier & Verification Status */}
            {providerData && activeTab === 'profile' && (
              <div className="max-w-4xl mx-auto mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {/* Tier Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Provider Tier</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        providerStanding?.tier === 'elite' ? 'bg-purple-100 text-purple-800' :
                        providerStanding?.tier === 'trusted' ? 'bg-green-100 text-green-800' :
                        providerStanding?.tier === 'probation' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {providerStanding?.tier || 'standard'}
                      </span>
                    </div>
                    {providerStanding?.reliability_score != null && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Reliability</span>
                          <span>{Math.round(providerStanding.reliability_score * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              providerStanding.reliability_score >= 0.8 ? 'bg-green-500' :
                              providerStanding.reliability_score >= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${providerStanding.reliability_score * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {providerStanding?.tier == null && (
                      <p className="text-xs text-gray-400 mt-2">Complete jobs to unlock tier status</p>
                    )}
                  </div>

                  {/* Verification Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Verification</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        providerData.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                        providerData.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        providerData.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {providerData.verification_status || 'not_submitted'}
                      </span>
                    </div>
                    {providerData.verification_status === 'approved' && providerData.verification_expires_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(providerData.verification_expires_at).toLocaleDateString()}
                      </p>
                    )}
                    {(!providerData.verification_status || providerData.verification_status === 'not_submitted') && (
                      <button
                        onClick={() => fetch('/api/provider/submit-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
                          .then(r => r.json())
                          .then(d => { if (d.success) toast.success('Verification submitted'); else toast.error(d.error); })
                          .catch(() => toast.error('Failed to submit'))
                      }
                        className="mt-2 text-xs text-[#db4b0d] hover:text-[#c4420b] font-medium"
                      >
                        Submit for verification →
                      </button>
                    )}
                  </div>
                </div>

                {/* Appeal Button */}
                {providerStanding?.tier === 'probation' && (
                  <button
                    onClick={() => setShowAppealModal(true)}
                    className="mt-3 w-full bg-white border border-amber-300 text-amber-700 rounded-xl py-2.5 text-sm font-medium hover:bg-amber-50 transition-colors"
                  >
                    Submit an Appeal
                  </button>
                )}
              </div>
            )}

            {/* Appeal Modal */}
            {showAppealModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Submit an Appeal</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={appealType}
                    onChange={(e) => setAppealType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                  >
                    <option value="general">General</option>
                    <option value="rating">Rating Dispute</option>
                    <option value="incident">Incident Appeal</option>
                    <option value="verification">Verification Issue</option>
                  </select>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
                    placeholder="Explain why you believe this should be reviewed..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowAppealModal(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitAppeal}
                      disabled={submittingAppeal || !appealReason.trim()}
                      className="px-4 py-2 bg-[#db4b0d] text-white rounded-lg text-sm font-medium hover:bg-[#c4420b] disabled:opacity-50"
                    >
                      {submittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {providerData && (
              <div className={activeTab === 'profile' ? 'mb-6 max-w-4xl mx-auto' : 'hidden'}>
                <ProviderLocationTracker
                  providerId={providerData.userId}
                  requestId={serviceRequests.find(req => req.status === 'accepted' && req.accepted_by_provider_id === providerData.userId)?.id || null}
                  isActive={serviceRequests.some(req => req.status === 'accepted' && req.accepted_by_provider_id === providerData.userId)}
                  onLocationUpdate={(location) => {
                    console.log('Provider location received in dashboard:', location);
                  }}
                />
              </div>
            )}

            {activeTab === "request" && (
  <div className="max-w-4xl mx-auto">
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <Bell className="mr-3 h-6 w-6 text-[#db4b0d]" />
          Incoming Service Requests
        </CardTitle>
        <CardDescription className="text-gray-600">
          View and manage service requests from users.
        </CardDescription>
      </CardHeader>
      {/* ProviderRequestNotification lifted to top of <main> so the
          floating popup persists across every tab. See above. */}

      <CardContent className="space-y-4">

        {serviceRequests.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No New Requests</h3>
            <p className="text-gray-600">
              You currently have no pending service requests. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {serviceRequests.map((request) => (
              <Card key={request.id} className="border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                      {request.service_type}
                    </h4>
                    <Badge
                      className={`${
                        request.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : request.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : request.status === "pending_notification" || request.status === "notified_multiple"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 flex items-start mb-3">
                    <MailOpen className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                    {/* Using request_details instead of message */}
                    {request.request_details || "No details provided"}
                  </p>

                  <p className="text-sm text-gray-600 flex items-center mb-1">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    Requested At: {new Date(request.created_at).toLocaleString()}
                  </p>

                  {/* ??? Buttons and States */}
                  {/* {(request.status === "pending_notification" || request.status === "notified_multiple") &&
                   providerData.phone_verified &&
                   // request.notified_providers?.includes(userIdFromUrl) &&
                   request.accepted_by_provider_id !== userIdFromUrl && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(request.id)}
                        variant="outline"
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )} */}

                  {userIdFromUrl &&
 (request.status === "pending_notification" ||
  request.status === "notified_multiple") &&
 providerData.phone_verified &&
 request.notified_providers?.includes(userIdFromUrl) &&
 request.accepted_by_provider_id !== userIdFromUrl && (
  <div className="flex gap-2 mt-4">
    <Button
      onClick={() => handleAcceptRequest(request.id)}
      className="flex-1 bg-green-600 hover:bg-green-700"
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      Accept
    </Button>
    <Button
      onClick={() => handleRejectRequest(request.id)}
      variant="outline"
      className="flex-1 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
    >
      <XCircle className="mr-2 h-4 w-4" />
      Reject
    </Button>
  </div>
)}


                  {request.accepted_by_provider_id === userIdFromUrl && ["accepted", "provider_enroute", "arriving", "arrived", "in_progress", "work_in_progress", "completed"].includes(request.status) && (
                    <div className="mt-4 space-y-2">
                      <ArrivalWorkflow
                        requestId={request.id}
                        providerId={userIdFromUrl!}
                        serviceStartedAt={(request as any).service_started_at}
                        currentStatus={request.status}
                        onStatusChange={(newStatus) => handleRequestStatusChange(newStatus, request.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-[#db4b0d] text-[#db4b0d] hover:bg-orange-50"
                        onClick={() => {
                          setSelectedConversation(request.user_id);
                          setActiveTab('chat');
                        }}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Chat with Customer
                      </Button>
                    </div>
                  )}

                  {request.status === "accepted" && request.accepted_by_provider_id !== userIdFromUrl && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-center">
                      <p className="text-sm font-medium text-blue-800 flex items-center justify-center">
                        <Info className="h-4 w-4 mr-2" />
                        This request was accepted by another provider.
                      </p>
                    </div>
                  )}

                  {request.status === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4 text-center">
                      <p className="text-sm font-medium text-red-800 flex items-center justify-center">
                        <XCircle className="h-4 w-4 mr-2" />
                        You rejected this request.
                      </p>
                    </div>
                  )}

               {userIdFromUrl &&
 !providerData.phone_verified &&
 (request.status === "pending_notification" ||
  request.status === "notified_multiple") &&
 request.notified_providers?.includes(userIdFromUrl) &&
 request.accepted_by_provider_id !== userIdFromUrl && (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
    <p className="text-sm text-orange-700">
      Verify your phone number to accept this request.
    </p>
  </div>
)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}

            {activeTab === "profile" && (
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-sm border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                        <User className="mr-3 h-6 w-6 text-[#db4b0d]" />
                        Profile Information
                      </CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        {isEditingProfile
                          ? "Update your personal and service details"
                          : "View your personal and service details"}
                      </CardDescription>
                    </div>
                    {!isEditingProfile ? (
                      <Button
                        onClick={() => {
                          setIsEditingProfile(true);
                          setEditableFormData(providerData);
                          setEditErrors({});
                        }}
                        className="bg-[#db4b0d] hover:bg-[#c4420c]"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSavingProfile ? <Skeleton className="h-4 w-4 mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                          Save Changes
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline">
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-8">
                    {isEditingProfile && editableFormData ? (
                      <div className="space-y-8">
                        {/* Personal Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="editFirstName" className="text-sm font-medium text-gray-700">
                                First Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="editFirstName"
                                name="firstName"
                                value={editableFormData.firstName}
                                onChange={handleEditChange}
                                className={`mt-1 ${editErrors.firstName ? "border-red-500" : ""}`}
                              />
                              {editErrors.firstName && (
                                <p className="text-red-500 text-sm mt-1">{editErrors.firstName}</p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="editLastName" className="text-sm font-medium text-gray-700">
                                Last Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="editLastName"
                                name="lastName"
                                value={editableFormData.lastName}
                                onChange={handleEditChange}
                                className={`mt-1 ${editErrors.lastName ? "border-red-500" : ""}`}
                              />
                              {editErrors.lastName && (
                                <p className="text-red-500 text-sm mt-1">{editErrors.lastName}</p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="editEmail" className="text-sm font-medium text-gray-700">
                                Email Address
                              </Label>
                              <Input
                                id="editEmail"
                                name="email"
                                type="email"
                                value={editableFormData.email || ""}
                                onChange={handleEditChange}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label htmlFor="editCnic" className="text-sm font-medium text-gray-700">
                                CNIC Number <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="editCnic"
                                name="cnic"
                                value={editableFormData.cnic}
                                onChange={handleEditChange}
                                maxLength={13}
                                className={`mt-1 ${editErrors.cnic ? "border-red-500" : ""}`}
                                placeholder="4220112345678"
                              />
                              {editErrors.cnic && <p className="text-red-500 text-sm mt-1">{editErrors.cnic}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Location Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="editCity" className="text-sm font-medium text-gray-700">
                                City <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={editableFormData.city}
                                onValueChange={(value) => handleSelectChange("city", value)}
                              >
                                <SelectTrigger className={`mt-1 ${editErrors.city ? "border-red-500" : ""}`}>
                                  <SelectValue placeholder="Select City" />
                                </SelectTrigger>
                                <SelectContent>
                                  {citiesByCountry["Pakistan"]?.map((city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {editErrors.city && <p className="text-red-500 text-sm mt-1">{editErrors.city}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label htmlFor="editPhoneNumber" className="text-sm font-medium text-gray-700">
                                Phone Number <span className="text-red-500">*</span>
                              </Label>
                              <div className="flex mt-1">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                  +92
                                </span>
                                <Input
                                  id="editPhoneNumber"
                                  name="phoneNumber"
                                  type="tel"
                                  value={editableFormData.phoneNumber}
                                  onChange={handleEditChange}
                                  className={`rounded-l-none ${editErrors.phoneNumber ? "border-red-500" : ""}`}
                                />
                              </div>
                              {editErrors.phoneNumber && (
                                <p className="text-red-500 text-sm mt-1">{editErrors.phoneNumber}</p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="editServiceType" className="text-sm font-medium text-gray-700">
                                Service Type <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={editableFormData.service_type}
                                onValueChange={(value) => handleSelectChange("service_type", value)}
                              >
                                <SelectTrigger className={`mt-1 ${editErrors.service_type ? "border-red-500" : ""}`}>
                                  <SelectValue placeholder="Select Service Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[
                                    "Electrician Service",
                                    "Plumbing",
                                    "Carpentry",
                                    "AC Maintenance",
                                    "Solar Technician",
                                  ].map((service) => (
                                    <SelectItem key={service} value={service}>
                                      {service}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {editErrors.service_type && (
                                <p className="text-red-500 text-sm mt-1">{editErrors.service_type}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Additional Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Do you have an active mobile for calling? <span className="text-red-500">*</span>
                              </Label>
                              <div className="flex gap-6 mt-2">
                                <Label className="flex items-center">
                                  <Input
                                    type="radio"
                                    name="hasActiveMobile"
                                    value="true"
                                    checked={editableFormData.hasActiveMobile === true}
                                    onChange={handleEditChange}
                                    className="mr-2 w-4 h-4"
                                  />
                                  Yes
                                </Label>
                                <Label className="flex items-center">
                                  <Input
                                    type="radio"
                                    name="hasActiveMobile"
                                    value="false"
                                    checked={editableFormData.hasActiveMobile === false}
                                    onChange={handleEditChange}
                                    className="mr-2 w-4 h-4"
                                  />
                                  No
                                </Label>
                              </div>
                              {editErrors.hasActiveMobile && (
                                <p className="text-red-500 text-sm mt-1">{editErrors.hasActiveMobile}</p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="editAvatar" className="text-sm font-medium text-gray-700">
                                Profile Picture
                              </Label>
                              <Input
                                id="editAvatar"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarFileChange}
                                className="mt-1"
                              />
                              {editableFormData.avatarUrl && (
                                <div className="mt-2">
                                  <img
                                    src={editableFormData.avatarUrl || "/placeholder.svg"}
                                    alt="Profile Preview"
                                    className="h-20 w-20 object-cover rounded-full border-2 border-gray-200"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-8">
                        {/* Personal Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <User className="mr-2 h-5 w-5 text-[#db4b0d]" />
                            Personal Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                              <p className="text-base font-medium text-gray-900">
                                {providerData.firstName} {providerData.lastName}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">Email Address</Label>
                              <p className="text-base text-gray-900">{providerData.email || "Not provided"}</p>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">CNIC Number</Label>
                              <p className="text-base text-gray-900">{providerData.cnic}</p>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">Registration Date</Label>
                              <p className="text-base text-gray-900">
                                {new Date(providerData.registrationDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Location Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <MapPin className="mr-2 h-5 w-5 text-[#db4b0d]" />
                            Location Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">City</Label>
                              <p className="text-base text-gray-900">{providerData.city}</p>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Phone className="mr-2 h-5 w-5 text-[#db4b0d]" />
                            Contact Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                              <p className="text-base text-gray-900">
                                +92
                                {providerData.phoneNumber}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">Phone Status</Label>
                              <div>
                                {providerData.phone_verified ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    <CircleDashed className="w-3 h-3 mr-1" />
                                    Pending Verification
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Location Tracking card is rendered at top level (always mounted) ??? see <main> */}

                        {/* Service Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Briefcase className="mr-2 h-5 w-5 text-[#db4b0d]" />
                            Service Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">Service Type</Label>
                              <p className="text-base font-semibold text-[#db4b0d]">{providerData.service_type}</p>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">Active Mobile</Label>
                              <p className="text-base text-gray-900">{providerData.hasActiveMobile ? "Yes" : "No"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                      <Settings className="mr-3 h-6 w-6 text-[#db4b0d]" />
                      Account Settings
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage your account preferences and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center py-12">
                      <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Coming Soon</h3>
                      <p className="text-gray-600">
                        Additional settings and preferences will be available here in future updates.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "warranty" && (
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                      <ShieldCheck className="mr-3 h-6 w-6 text-[#db4b0d]" />
                      Warranty Claims
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Customers who claimed the 3-day free warranty. You must return and fix the issue, or refuse and accept a penalty.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {warrantyClaims.length === 0 ? (
                      <div className="text-center py-12">
                        <ShieldCheck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Warranty Claims</h3>
                        <p className="text-gray-600">When a customer claims a warranty within 3 days, it will appear here.</p>
                      </div>
                    ) : (
                      warrantyClaims.map((claim: any) => (
                        <div key={claim.id} className="rounded-2xl border-2 border-amber-300 bg-amber-50 overflow-hidden">
                          <div className="bg-gradient-to-r from-amber-500 to-[#db4b0d] px-4 py-3 flex items-center gap-2">
                            <span className="text-lg">???????</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-bold text-sm truncate">
                                {claim.service_type || 'Service'} ?? {claim.customer_name}
                              </p>
                              <p className="text-white/80 text-xs">
                                Claimed {new Date(claim.claimed_at).toLocaleString('en-PK', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="p-4 space-y-3">
                            {claim.address && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> {claim.address}
                              </p>
                            )}
                            {claim.completed_at && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Originally completed {new Date(claim.completed_at).toLocaleString('en-PK', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                              </p>
                            )}
                            {claim.description && (
                              <div className="bg-white rounded-xl p-3 border border-amber-200">
                                <p className="text-xs text-gray-500 mb-1">Customer reported:</p>
                                <p className="text-sm text-gray-800">{claim.description}</p>
                              </div>
                            )}
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                              <p className="text-xs text-red-700 font-semibold">
                                ?????? Refusing deducts a Rs. 200 penalty from your wallet and adds a strike to your account.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                disabled={warrantyResponding === claim.id}
                                onClick={async () => {
                                  setWarrantyResponding(claim.id);
                                  try {
                                    const res = await fetch('/api/warranty/respond', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ claimId: claim.id, response: 'accepted' }),
                                    });
                                    const d = await res.json();
                                    if (!res.ok) { toast.error(d.error || 'Failed'); return; }
                                    setWarrantyClaims(prev => prev.filter((c: any) => c.id !== claim.id));
                                    toast.success('Warranty accepted. Please return to fix the issue.');
                                  } catch { toast.error('Failed to respond'); }
                                  finally { setWarrantyResponding(null); }
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-10"
                              >
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                I'll Return &amp; Fix It
                              </Button>
                              <Button
                                disabled={warrantyResponding === claim.id}
                                variant="outline"
                                onClick={async () => {
                                  setWarrantyResponding(claim.id);
                                  try {
                                    const res = await fetch('/api/warranty/respond', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ claimId: claim.id, response: 'refused' }),
                                    });
                                    const d = await res.json();
                                    if (!res.ok) { toast.error(d.error || 'Failed'); return; }
                                    setWarrantyClaims(prev => prev.filter((c: any) => c.id !== claim.id));
                                    toast.warning(
                                      d.penaltyApplied > 0
                                        ? `Claim refused. Rs. ${d.penaltyApplied} penalty applied and strike recorded.`
                                        : 'Claim refused. Wallet was empty (no deduction) ??? strike recorded.'
                                    );
                                  } catch { toast.error('Failed to respond'); }
                                  finally { setWarrantyResponding(null); }
                                }}
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl h-10"
                              >
                                <XCircle className="w-4 h-4 mr-1.5" />
                                Refuse
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "wallet" && userIdFromUrl && (
              <WalletPanel providerId={userIdFromUrl} />
            )}

            {activeTab === "chat" && (
            <div className="max-w-5xl mx-auto">
              <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardHeader className="hidden sm:block">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                    <MessageSquare className="mr-3 h-6 w-6 text-[#db4b0d]" />
                    Chat Messages
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Communicate with users who have requested your services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  {/*
                    Mobile-first layout:
                    - On mobile (<sm): show LIST or CHAT (not both). Header + back button.
                    - On desktop (???sm): show side-by-side panes.
                  */}
                  <div className="flex h-[calc(100dvh-220px)] sm:h-[600px] border-y sm:border sm:rounded-lg border-gray-200 overflow-hidden">

                    {/* Conversations List */}
                    <div
                      className={`${
                        selectedConversation ? 'hidden sm:flex' : 'flex'
                      } w-full sm:w-[320px] sm:border-r border-gray-200 flex-col bg-white`}
                    >
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search conversations"
                            className="pl-9 h-10 bg-gray-50 border-gray-200"
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center">
                            <MessageSquare className="w-10 h-10 mb-3 text-gray-300" />
                            <p className="text-sm">No conversations yet.</p>
                            <p className="text-xs mt-1">They'll appear once a customer messages you.</p>
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-100">
                            {conversations.map((conv) => {
                              const active = selectedConversation === conv.userId;
                              return (
                                <li key={conv.userId}>
                                  <button
                                    onClick={() => setSelectedConversation(conv.userId)}
                                    className={`w-full text-left px-3 py-3 flex items-start gap-3 transition ${
                                      active ? 'bg-orange-50' : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <Avatar className="h-11 w-11 shrink-0">
                                      <AvatarFallback className="bg-gradient-to-br from-[#db4b0d] to-orange-500 text-white font-semibold">
                                        {conv.userName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-baseline justify-between gap-2">
                                        <h4 className={`font-semibold truncate text-[15px] ${active ? 'text-[#db4b0d]' : 'text-gray-900'}`}>
                                          {conv.userName}
                                        </h4>
                                        <span className="text-[11px] text-gray-400 shrink-0">{conv.lastMessageTime}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                                        {conv.unread > 0 && (
                                          <span className="shrink-0 bg-[#db4b0d] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                                            {conv.unread}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Chat pane */}
                    <div
                      className={`${
                        selectedConversation ? 'flex' : 'hidden sm:flex'
                      } flex-1 flex-col min-w-0`}
                    >
                      {selectedConversation ? (
                        <>
                          {/* Header */}
                          <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-gray-100 bg-white">
                            <button
                              onClick={() => setSelectedConversation(null)}
                              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0"
                              aria-label="Back to conversations"
                            >
                              <ArrowLeft className="w-5 h-5" />
                            </button>
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-[#db4b0d] to-orange-500 text-white font-semibold">
                                {(conversations.find(c => c.userId === selectedConversation)?.userName.charAt(0) || 'U').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 truncate leading-tight">
                                {conversations.find(c => c.userId === selectedConversation)?.userName || 'User'}
                              </h3>
                              <p className="text-[11px] text-gray-500 flex items-center gap-1 leading-tight">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                In active service
                              </p>
                            </div>
                          </div>

                          {/* Messages */}
                          <div
                            className="flex-1 overflow-y-auto px-3 sm:px-4 py-3"
                            style={{ background: '#efeae2' }}
                          >
                            {chatMessages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                <div className="bg-white/80 rounded-2xl px-5 py-4 shadow-sm max-w-[220px]">
                                  <p className="text-[13px] text-gray-500 leading-relaxed">
                                    No messages yet.<br />Say hi ????
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="pb-1">
                                {chatMessages.map((msg: any, i: number) => {
                                  const mine = msg.sender_id === userIdFromUrl;
                                  const prev = chatMessages[i - 1];
                                  const stacked = Boolean(prev && prev.sender_id === msg.sender_id);
                                  const radius = stacked
                                    ? 'rounded-2xl'
                                    : mine
                                    ? 'rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl rounded-br-[5px]'
                                    : 'rounded-tr-2xl rounded-br-2xl rounded-tl-2xl rounded-bl-[5px]';
                                  return (
                                    <div
                                      key={msg.id}
                                      className={`flex ${mine ? 'justify-end' : 'justify-start'} ${stacked ? 'mt-0.5' : 'mt-2'}`}
                                    >
                                      <div
                                        className={[
                                          'max-w-[78%] px-3.5 pt-2 pb-1.5 shadow-sm',
                                          radius,
                                          mine
                                            ? 'bg-[#db4b0d] text-white'
                                            : 'bg-white text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
                                        ].join(' ')}
                                      >
                                        <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">
                                          {msg.message}
                                        </p>
                                        <div className={`flex items-center gap-1 mt-0.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                                          <span className={`text-[11px] leading-none ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], {
                                              hour: '2-digit', minute: '2-digit',
                                            })}
                                          </span>
                                          {mine && (
                                            msg._pending
                                              ? <Clock className="w-3 h-3 text-white/60" />
                                              : <CheckCheck className="w-3 h-3 text-white/80" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                <div ref={chatEndRef} />
                              </div>
                            )}
                          </div>

                          {/* Composer */}
                          <form
                            className="border-t border-gray-200 bg-[#f0f2f5] px-3 py-2.5 flex items-center gap-2 shrink-0"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void sendChatMessage();
                            }}
                          >
                            <Input
                              value={chatDraft}
                              onChange={(e) => setChatDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  void sendChatMessage();
                                }
                              }}
                              placeholder="Type a message???"
                              className="flex-1 h-11 rounded-full px-4 bg-white border-transparent shadow-sm focus-visible:ring-0 text-[15px]"
                            />
                            <Button
                              type="submit"
                              disabled={!chatDraft.trim() || chatSending}
                              className="h-11 w-11 p-0 rounded-full bg-[#25d366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:bg-gray-300 shrink-0 transition-colors"
                              aria-label="Send message"
                            >
                              {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                            </Button>
                          </form>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-[#db4b0d]" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                          <p className="text-gray-600 max-w-sm text-sm">
                            Pick a customer from the list to start chatting.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

            {activeTab === "phone-verification" && (
              <div className="max-w-2xl mx-auto">
                <Card className="shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                      <Phone className="mr-3 h-6 w-6 text-[#db4b0d]" />
                      Phone Verification
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Verify your phone number to start receiving service requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Registered Phone Number</p>
                        <p className="text-lg font-semibold text-gray-900">
                          +92
                          {providerData.phoneNumber}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {providerData.phone_verified ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <CircleDashed className="w-4 h-4 mr-1" />
                            Pending
                          </Badge>
                        )}

                        <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleOpenPhoneDialog}
                              className="text-[#db4b0d] border-[#db4b0d] hover:bg-[#db4b0d] hover:text-white bg-transparent"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Change
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center">
                                <Phone className="mr-2 h-5 w-5 text-[#db4b0d]" />
                                Change Phone Number
                              </DialogTitle>
                              <DialogDescription>
                                Update your phone number. You will need to verify the new number before receiving
                                service requests.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="newPhoneNumber" className="text-sm font-medium text-gray-700">
                                  Phone Number <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex mt-1">
                                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                    +92
                                  </span>
                                  <Input
                                    id="newPhoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    value={newPhoneData.phoneNumber}
                                    onChange={handlePhoneChange}
                                    className={`rounded-l-none ${phoneChangeErrors.phoneNumber ? "border-red-500" : ""}`}
                                    placeholder="Enter phone number"
                                  />
                                </div>
                                {phoneChangeErrors.phoneNumber && (
                                  <p className="text-red-500 text-sm mt-1">{phoneChangeErrors.phoneNumber}</p>
                                )}
                              </div>

                              {(newPhoneData.phoneNumber !== providerData?.phoneNumber) && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                  <div className="flex">
                                    <XCircle className="h-4 w-4 text-orange-400 mt-0.5 mr-2" />
                                    <p className="text-sm text-orange-700">
                                      Changing your phone number will reset your verification status. You'll need to
                                      verify the new number.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <DialogFooter className="flex space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsPhoneDialogOpen(false)}
                                disabled={isSavingPhone}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSavePhoneChange}
                                disabled={isSavingPhone}
                                className="bg-[#db4b0d] hover:bg-[#c4420c] text-white"
                              >
                                {isSavingPhone ? (
                                  <div className="flex items-center">
                                    <Skeleton className="h-4 w-4 mr-2" />
                                    Saving...
                                  </div>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {!providerData.phone_verified && (
                      <div className="space-y-4">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex">
                            <XCircle className="h-5 w-5 text-orange-400 mt-0.5 mr-3" />
                            <div>
                              <h3 className="text-sm font-medium text-orange-800">Phone Verification Required</h3>
                              <p className="text-sm text-orange-700 mt-1">
                                You will not receive service requests until your phone number is verified.
                              </p>
                            </div>
                          </div>
                        </div>

                        {!otpSent ? (
                          <Button
                            onClick={sendOtp}
                            disabled={isSendingOtp}
                            className="w-full bg-[#db4b0d] hover:bg-[#c4420c] py-3"
                          >
                            {isSendingOtp ? (
                              <div className="flex items-center">
                                <Skeleton className="h-4 w-4 mr-2" />
                                Sending OTP...
                              </div>
                            ) : (
                              <>
                                <Phone className="mr-2 h-4 w-4" />
                                Send Verification Code
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            {otpSentMessage && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex">
                                  <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                                  <p className="text-sm text-blue-700">{otpSentMessage}</p>
                                </div>
                              </div>
                            )}

                            <div>
                              <Label htmlFor="otpInput" className="text-sm font-medium text-gray-700">
                                Enter Verification Code
                              </Label>
                              <Input
                                id="otpInput"
                                type="text"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                                className={`mt-1 text-center text-lg tracking-widest ${
                                  otpError ? "border-red-500" : ""
                                }`}
                              />
                              {otpError && <p className="text-red-500 text-sm mt-1">{otpError}</p>}
                            </div>

                            <Button
                              onClick={verifyOtp}
                              disabled={isVerifyingOtp || otpInput.length !== 6}
                              className="w-full bg-green-600 hover:bg-green-700 py-3"
                            >
                              {isVerifyingOtp ? (
                                <div className="flex items-center">
                                  <Skeleton className="h-4 w-4 mr-2" />
                                  Verifying...
                                </div>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify Code
                                </>
                              )}
                            </Button>

                            <Button
                              onClick={() => {
                                setOtpSent(false);
                                setOtpInput("");
                                setOtpError("");
                                setOtpSentMessage("");
                              }}
                              variant="outline"
                              className="w-full"
                            >
                              Send New Code
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {providerData.phone_verified && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex">
                          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                          <div>
                            <h3 className="text-sm font-medium text-green-800">Phone Number Verified</h3>
                            <p className="text-sm text-green-700 mt-1">
                              Your phone number has been successfully verified. You can now receive service requests.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </>
  );
}

function ProviderDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ProviderDashboardInner />
    </Suspense>
  );
}

export default ProviderDashboard;
