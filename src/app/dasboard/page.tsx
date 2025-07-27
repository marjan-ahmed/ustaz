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
  LocateFixed,
  Loader2, // For sending location
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"; // Assuming these are your sidebar components
import { useTranslations } from "next-intl";

// Define interfaces for data structures
interface ProviderData {
  userid: string;
  firstname: string;
  lastname: string;
  email: string | null;
  cnic: string;
  country: string;
  city: string;
  phonecountrycode: string;
  phonenumber: string;
  heardfrom: string;
  service_type: string;
  hasexperience: boolean | null;
  experienceyears: number | null;
  experiencedetails: string | null;
  hasactivemobile: boolean | null;
  avatarurl: string | null;
  registrationdate: string;
  phone_verified: boolean;
  latitude: number | null; // Assuming location is stored as separate lat/long for simplicity
  longitude: number | null;
  location?: any; // PostGIS geography type might come as an object or string
}

interface ServiceRequest {
  id: string;
  userId: string; // User who made the request
  service_type: string;
  location: any; // PostGIS geography point for user's location
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  requested_at: string;
  provider_id: string; // This provider's ID
  user_address: string; // Added from ProcessPage
  user_postal_code: string | null; // Added from ProcessPage
}

// Global variable for Google Maps
declare global {
  interface Window {
    google: any
  }
}

// Dashboard Skeleton for Suspense
function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function ProviderDashboardInner() {
  const t = useTranslations("providerDashboard"); // Assuming translations for dashboard
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId"); // This is the provider's userId
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Removed isEditing, editedData, isSaving states as profile editing is moved
  const [isPhoneVerificationSectionOpen, setIsPhoneVerificationSectionOpen] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>("");
  const [otpError, setOtpError] = useState<string>("");
  const [otpSentMessage, setOtpSentMessage] = useState<string>("");
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // New state for service requests
  const [incomingRequests, setIncomingRequests] = useState<ServiceRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [isSendingLocation, setIsSendingLocation] = useState<boolean>(false);
  const locationWatcherId = useRef<number | null>(null); // To store watchPosition ID

  // Load Google Maps script for provider's map (if needed for showing current location)
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [providerCurrentMarker, setProviderCurrentMarker] = useState<google.maps.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current && window.google && !map) {
      const initialMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 30.3753, lng: 69.3451 }, // Default to Pakistan center
        zoom: 6,
      });
      setMap(initialMap);
      const marker = new window.google.maps.Marker({
        position: { lat: 30.3753, lng: 69.3451 },
        map: initialMap,
        title: "Your Current Location",
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      });
      setProviderCurrentMarker(marker);
    }
  }, [map]);


  // Fetch provider data
  useEffect(() => {
    const fetchProviderData = async () => {
      if (!userId) {
        setError("User ID not found.");
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("ustaz_registrations")
          .select("*")
          .eq("userid", userId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProviderData(data);
          // Removed initialization of editedData
        }
      } catch (err: any) {
        console.error("Error fetching provider data:", err.message);
        setError("Failed to load provider data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [userId]);

  // Real-time listener for service requests
  useEffect(() => {
    if (!userId) return;

    // Subscribe to new pending requests for this provider
    const requestsChannel = supabase
      .channel(`service_requests_for_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT and UPDATE
          schema: 'public',
          table: 'service_requests',
          filter: `provider_id=eq.${userId}`
        },
        (payload) => {
          const newRequest = payload.new as ServiceRequest;
          if (payload.eventType === 'INSERT' && newRequest.status === 'pending') {
            setIncomingRequests(prev => {
              // Avoid duplicates if real-time sends multiple times
              if (!prev.some(req => req.id === newRequest.id)) {
                return [newRequest, ...prev];
              }
              return prev;
            });
            // Play a notification sound or show a toast
            console.log("New service request received:", newRequest);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing request status in the list
            setIncomingRequests(prev =>
              prev.map(req => (req.id === newRequest.id ? newRequest : req))
            );
            // If this was the active request and status changed
            if (activeRequest && activeRequest.id === newRequest.id) {
              setActiveRequest(newRequest);
              if (newRequest.status === 'accepted') {
                startSendingProviderLocation();
              } else if (newRequest.status === 'rejected' || newRequest.status === 'completed') {
                stopSendingProviderLocation();
              }
            }
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      requestsChannel.unsubscribe();
      stopSendingProviderLocation(); // Ensure location sending stops
    };
  }, [userId, activeRequest]); // Depend on activeRequest to react to its changes

  // Removed handleEditChange and handleSelectChange as profile editing is moved
  // Removed handleSave as profile editing is moved

  // Send OTP
  const sendOtp = async () => {
    if (!providerData?.phonenumber || !providerData?.phonecountrycode) {
      setOtpError(t("phoneNotAvailableForOtp"));
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
          phoneNumber: providerData.phonenumber,
          phoneCountryCode: providerData.phonecountrycode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("failedToSendOtpGeneric"));
      }

      setOtpSent(true);
      setOtpSentMessage(
        t("otpSentSuccessfully", { phone: `${providerData.phonecountrycode}${providerData.phonenumber}` }),
      );
      console.log("OTP send request successful:", data);
    } catch (error: any) {
      console.error("Error sending OTP:", error.message);
      setOtpError(t("failedToSendOtp", { message: error.message }));
      setOtpSent(false);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!providerData?.phonenumber || !providerData?.phonecountrycode || !userId) {
      setOtpError(t("phoneOrUserIdNotAvailable"));
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
          phoneNumber: providerData.phonenumber,
          phoneCountryCode: providerData.phonecountrycode,
          otp: otpInput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("failedToVerifyOtpGeneric"));
      }

      const { error: updateError } = await supabase
        .from("ustaz_registrations")
        .update({ phone_verified: true })
        .eq("userid", userId);

      if (updateError) {
        throw updateError;
      }

      setProviderData((prev) => (prev ? { ...prev, phone_verified: true } : null));
      setOtpError("");
      setOtpSentMessage(t("phoneVerifiedSuccessfully"));
      console.log("OTP verification successful:", data);
    } catch (error: any) {
      console.error("Error verifying OTP:", error.message);
      setOtpError(t("invalidOtp", { message: error.message }));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle accepting a service request
  const handleAcceptRequest = async (requestId: string) => {
    // Re-using isSaving for request actions, but it's not defined anymore.
    // Let's define a local state for request processing or use isLoading.
    // For now, let's just use isLoading.
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('provider_id', userId) // Ensure only this provider can accept their request
        .select()
        .single();

      if (error) {
        throw error;
      }
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId)); // Remove from incoming
      setActiveRequest(data as ServiceRequest); // Set as active request
      startSendingProviderLocation(); // Start sending location updates
      // Use a custom modal in production instead of alert
      console.log(t("requestAccepted"));
    } catch (err: any) {
      console.error("Error accepting request:", err.message);
      setError("Failed to accept request: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle rejecting a service request
  const handleRejectRequest = async (requestId: string) => {
    setLoading(true); // Re-using loading
    setError(null);
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('provider_id', userId);

      if (error) {
        throw error;
      }
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId)); // Remove from incoming
      // Use a custom modal in production instead of alert
      console.log(t("requestRejected"));
    } catch (err: any) {
      console.error("Error rejecting request:", err.message);
      setError("Failed to reject request: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start sending provider's real-time location
  const startSendingProviderLocation = () => {
    if (!navigator.geolocation || !userId) {
      console.warn("Geolocation not supported or user ID missing.");
      return;
    }

    if (locationWatcherId.current !== null) {
      console.log("Location tracking already active.");
      return;
    }

    setIsSendingLocation(true);
    locationWatcherId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Sending location update:", latitude, longitude);
        try {
          // Update the provider's location in the ustaz_registrations table
          const { error } = await supabase
            .from('ustaz_registrations')
            .update({
              location: `POINT(${longitude} ${latitude})`, // PostGIS expects (longitude, latitude)
              latitude: latitude, // Also update separate lat/long columns for easier access
              longitude: longitude,
            })
            .eq('userid', userId);

          if (error) {
            console.error("Error updating provider location:", error.message);
          } else {
            // Update marker on provider's own map
            if (providerCurrentMarker) {
              providerCurrentMarker.setPosition({ lat: latitude, lng: longitude });
              map?.panTo({ lat: latitude, lng: longitude });
            }
          }
        } catch (err) {
          console.error("Supabase update error:", err);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsSendingLocation(false);
        // Use custom modal instead of alert
        console.error(t("locationTrackingError", { message: error.message }));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 } // Update every 5 seconds
    );
  };

  // Stop sending provider's real-time location
  const stopSendingProviderLocation = () => {
    if (locationWatcherId.current !== null) {
      navigator.geolocation.clearWatch(locationWatcherId.current);
      locationWatcherId.current = null;
      setIsSendingLocation(false);
      console.log("Location tracking stopped.");
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  if (!providerData) {
    return <div className="text-gray-500 text-center p-8">{t("noProviderData")}</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar>
          <SidebarHeader>
            <h1 className="text-2xl font-bold text-orange-600">Ustaz Dashboard</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <span className="text-gray-500">{t("navigation")}</span>
              </SidebarGroupContent>
              <SidebarGroupContent>
                {/* Only show Requests item */}
                <li className="sidebar-menu-item active flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <span>{t("requests")}</span>
                </li>
                {/* Removed Profile and Settings items */}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenuItem onClick={() => supabase.auth.signOut()}>
              <LogOut className="h-5 w-5 mr-2" />
              <span>{t("logout")}</span>
            </SidebarMenuItem>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main className="flex-1 p-8 overflow-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              {t("welcome")}, {providerData.firstname} {providerData.lastname}!
            </h2>

            {/* Incoming Service Requests Section */}
            <Card className="mb-8 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold text-gray-800">{t("incomingRequests")}</CardTitle>
                <Bell className="h-6 w-6 text-orange-500" />
              </CardHeader>
              <CardContent>
                {incomingRequests.length === 0 && !activeRequest ? (
                  <p className="text-gray-600">{t("noNewRequests")}</p>
                ) : (
                  <div className="space-y-4">
                    {activeRequest && (
                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                       <div className="flex items-center justify-between mb-2">
                         <h4 className="font-semibold text-blue-700 flex items-center">
                           <MailOpen className="h-5 w-5 mr-2" /> {t("activeRequest")}
                         </h4>
                         <Badge variant="default" className={`capitalize ${activeRequest.status === 'accepted' ? 'bg-green-500' : 'bg-blue-500'}`}>
                           {activeRequest.status}
                         </Badge>
                       </div>
                       <p className="text-sm text-gray-700">
                         <strong>{t("serviceType")}:</strong> {activeRequest.service_type}
                       </p>
                       <p className="text-sm text-gray-700">
                         <strong>{t("userAddress")}:</strong> {activeRequest.user_address}
                       </p>
                       <p className="text-sm text-gray-700 flex items-center">
                         <Clock className="h-4 w-4 mr-1 text-gray-500" />
                         {t("requestedAt")}: {new Date(activeRequest.requested_at).toLocaleString()}
                       </p>
                       {isSendingLocation && (
                         <p className="text-sm text-green-600 mt-2 flex items-center">
                           <LocateFixed className="h-4 w-4 mr-1 animate-pulse" /> {t("sendingLocationUpdates")}
                         </p>
                       )}
                       <div className="mt-4 flex gap-2">
                         <Button
                           onClick={stopSendingProviderLocation}
                           disabled={!isSendingLocation}
                           className="bg-red-500 hover:bg-red-600 text-white"
                         >
                           {t("stopTracking")}
                         </Button>
                         {/* Add a button to view user's location on map if needed */}
                       </div>
                     </div>
                    )}

                    {incomingRequests.map((request) => (
                      <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800 flex items-center">
                            <MailOpen className="h-5 w-5 mr-2" /> {t("newRequest")}
                          </h4>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">
                          <strong>{t("serviceType")}:</strong> {request.service_type}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>{t("userAddress")}:</strong> {request.user_address}
                        </p>
                        <p className="text-sm text-gray-700 flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-500" />
                          {t("requestedAt")}: {new Date(request.requested_at).toLocaleString()}
                        </p>
                        <div className="mt-4 flex gap-2">
                          <Button
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={loading} // Using loading here
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" /> {t("accept")}
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={loading} // Using loading here
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" /> {t("reject")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider's current location map (optional, for self-view) */}
            <Card className="mb-8 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold text-gray-800">{t("myCurrentLocation")}</CardTitle>
                <MapPin className="h-6 w-6 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div ref={mapRef} className="w-full h-64 rounded-lg shadow-md border border-gray-200">
                  {/* Google Map will render here */}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    {t('currentLat')}: {providerData.latitude?.toFixed(4) || 'N/A'}, {t('currentLong')}: {providerData.longitude?.toFixed(4) || 'N/A'}
                  </p>
                  <Button
                    onClick={isSendingLocation ? stopSendingProviderLocation : startSendingProviderLocation}
                    disabled={!userId}
                    className={`mt-4 ${isSendingLocation ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                  >
                    {isSendingLocation ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" /> {t("stopSharingLocation")}
                      </>
                    ) : (
                      <>
                        <LocateFixed className="h-4 w-4 mr-2" /> {t("startSharingLocation")}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>


            {/* Phone Verification Section */}
            {!providerData.phone_verified && (
              <div className="mt-8">
                <Button
                  onClick={() => setIsPhoneVerificationSectionOpen(!isPhoneVerificationSectionOpen)}
                  variant="outline"
                  className="w-full"
                >
                  {isPhoneVerificationSectionOpen ? t("hidePhoneVerification") : t("verifyPhoneNumber")}
                </Button>
                {isPhoneVerificationSectionOpen && (
                  <Card className="mt-4 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Phone className="mr-3 h-6 w-6 text-[#db4b0d]" />
                        {t("phoneVerification")}
                      </CardTitle>
                      <CardDescription>
                        {t("phoneVerificationDesc", {
                          phone: `${providerData.phonecountrycode}${providerData.phonenumber}`,
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!otpSent ? (
                        <Button
                          onClick={sendOtp}
                          disabled={isSendingOtp}
                          className="w-full bg-[#db4b0d] hover:bg-[#c4420c] py-3"
                        >
                          {isSendingOtp ? (
                            <div className="flex items-center">
                              <Loader2 className="animate-spin h-4 w-4 mr-2" />
                              {t("sendingOTP")}
                            </div>
                          ) : (
                            <>
                              <Phone className="mr-2 h-4 w-4" />
                              {t("sendVerificationCode")}
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
                              {t("enterVerificationCode")}
                            </Label>
                            <Input
                              id="otpInput"
                              type="text"
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value)}
                              placeholder={t("enter6DigitCode")}
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
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                {t("verifying")}
                              </div>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t("verifyCode")}
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
                            {t("sendNewCode")}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {providerData.phone_verified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">{t("phoneNumberVerified")}</h3>
                    <p className="text-sm text-green-700 mt-1">
                      {t("phoneVerifiedSuccessMessage")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
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
