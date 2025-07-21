"use client"
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react"
import { supabase } from "../../../client/supabaseClient"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Define TypeScript Interfaces
interface IProviderData {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string | null
  cnic: string
  country: string
  city: string
  phoneCountryCode: string
  phoneNumber: string
  heardFrom: string
  service_type: string
  hasExperience: boolean | null
  experienceYears: number | null
  experienceDetails: string | null
  hasActiveMobile: boolean | null
  avatarUrl: string | null
  registrationDate: string
  phone_verified: boolean
}

interface ICountry {
  name: {
    common: string
  }
  idd: {
    root: string
    suffixes?: string[]
  }
  capital?: string[]
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
  )
}

import { Suspense } from "react"

function ProviderDashboardInner() {
  const [providerData, setProviderData] = useState<IProviderData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "phone-verification">("profile")

  // State for editing profile
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false)
  const [editableFormData, setEditableFormData] = useState<IProviderData | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false)

  // OTP States
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otpInput, setOtpInput] = useState<string>("")
  const [otpError, setOtpError] = useState<string>("")
  const [otpSentMessage, setOtpSentMessage] = useState<string>("")
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false)

  // Phone number change dialog states
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState<boolean>(false)
  const [newPhoneData, setNewPhoneData] = useState({
    phoneCountryCode: "",
    phoneNumber: "",
  })
  const [phoneChangeErrors, setPhoneChangeErrors] = useState<Record<string, string>>({})
  const [isSavingPhone, setIsSavingPhone] = useState<boolean>(false)

  const searchParams = useSearchParams()
  const userIdFromUrl = searchParams.get("userId")

  // Dashboard menu items
  const dashboardMenuItems = [
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
  ]

  // Countries and cities data
  const [countries, setCountries] = useState<ICountry[]>([])
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
  }

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,idd,capital")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: ICountry[] = await response.json()
        // Sort countries alphabetically for better UX
        data.sort((a, b) => a.name.common.localeCompare(b.name.common))
        setCountries(data)
      } catch (error) {
        console.error("Error fetching countries:", error)
        // Fallback to a predefined list if API fails
        setCountries([
          { name: { common: "Pakistan" }, idd: { root: "+92" } },
          { name: { common: "United States" }, idd: { root: "+1" } },
          { name: { common: "United Kingdom" }, idd: { root: "+44" } },
          { name: { common: "Canada" }, idd: { root: "+1" } },
          { name: { common: "Australia" }, idd: { root: "+61" } },
        ])
      }
    }
    fetchCountries()
  }, [])

  // Fetch provider data
  const fetchProviderData = useCallback(async (currentUserId: string | null) => {
    if (!currentUserId) {
      setLoading(false)
      setError("User ID not found in URL. Please ensure you are registered and navigated correctly.")
      setProviderData(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("ustaz_registrations")
        .select("*")
        .eq("userId", currentUserId)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (data) {
        setProviderData(data as IProviderData)
      } else {
        setProviderData(null)
      }
    } catch (err: any) {
      console.error("Error fetching provider data:", err.message)
      setError(`Failed to load data: ${err.message}. Please ensure you are registered with this User ID.`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviderData(userIdFromUrl)
  }, [fetchProviderData, userIdFromUrl])

  // Handler for form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editableFormData) return
    const { name, value, type } = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    let newValue: string | boolean | number = value

    if (type === "radio") {
      newValue = (e.target as HTMLInputElement).value === "true"
    } else if (name === "experienceYears") {
      newValue = value === "" ? "" : Number(value)
    }

    setEditableFormData((prev) => ({
      ...(prev as IProviderData),
      [name]: newValue,
    }))

    if (editErrors[name]) {
      setEditErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handler for select changes
  const handleSelectChange = (name: keyof IProviderData, value: string) => {
    if (!editableFormData) return
    setEditableFormData((prev) => ({
      ...(prev as IProviderData),
      [name]: value,
    }))

    if (editErrors[name]) {
      setEditErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle avatar file change
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditableFormData((prev) => ({
          ...(prev as IProviderData),
          avatarUrl: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    } else {
      setEditableFormData((prev) => ({
        ...(prev as IProviderData),
        avatarUrl: null,
      }))
    }
  }

  // Validation
  const validateEditableFields = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (!editableFormData) return false

    if (!(editableFormData.firstName || "").trim()) {
      newErrors.firstName = "First name is required."
      isValid = false
    }

    if (!(editableFormData.lastName || "").trim()) {
      newErrors.lastName = "Last name is required."
      isValid = false
    }

    if (!(editableFormData.cnic || "").trim()) {
      newErrors.cnic = "CNIC number is required."
      isValid = false
    } else if (!(editableFormData.cnic || "").startsWith("42201")) {
      newErrors.cnic = "CNIC must start with 42201."
      isValid = false
    } else if (!/^\d{13}$/.test(editableFormData.cnic || "")) {
      newErrors.cnic = "CNIC must be 13 digits (e.g., 4220112345678)."
      isValid = false
    }

    if (!(editableFormData.phoneNumber || "").trim()) {
      newErrors.phoneNumber = "Phone number is required."
      isValid = false
    } else if (!/^\d{7,}$/.test(editableFormData.phoneNumber || "")) {
      newErrors.phoneNumber = "Please enter a valid phone number (digits only, at least 7)."
      isValid = false
    }

    if (!(editableFormData.country || "").trim()) {
      newErrors.country = "Country is required."
      isValid = false
    }

    if (!(editableFormData.city || "").trim()) {
      newErrors.city = "City is required."
      isValid = false
    }

    if (!(editableFormData.service_type || "").trim()) {
      newErrors.service_type = "Service type is required."
      isValid = false
    }

    if (editableFormData.hasExperience === null) {
      newErrors.hasExperience = "Please select an option."
      isValid = false
    } else if (editableFormData.hasExperience) {
      if (editableFormData.experienceYears === null || editableFormData.experienceYears <= 0) {
        newErrors.experienceYears = "Years of experience is required and must be a positive number."
        isValid = false
      }
      if (!(editableFormData.experienceDetails || "").trim()) {
        newErrors.experienceDetails = "Experience details are required."
        isValid = false
      }
    }

    if (editableFormData.hasActiveMobile === null) {
      newErrors.hasActiveMobile = "Please select an option."
      isValid = false
    }

    setEditErrors(newErrors)
    return isValid
  }

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!editableFormData || !userIdFromUrl) return

    if (!validateEditableFields()) {
      return
    }

    setIsSavingProfile(true)
    setError(null)

    try {
      const phoneNumberChanged =
        providerData?.phoneNumber !== editableFormData.phoneNumber ||
        providerData?.phoneCountryCode !== editableFormData.phoneCountryCode

      const updatePayload = {
        firstName: (editableFormData.firstName || "").trim(),
        lastName: (editableFormData.lastName || "").trim(),
        email: (editableFormData.email || "").trim() || null,
        cnic: (editableFormData.cnic || "").trim(),
        country: (editableFormData.country || "").trim(),
        city: (editableFormData.city || "").trim(),
        phoneCountryCode: (editableFormData.phoneCountryCode || "").trim(),
        phoneNumber: (editableFormData.phoneNumber || "").trim(),
        heardFrom: (editableFormData.heardFrom || "").trim(),
        service_type: (editableFormData.service_type || "").trim(),
        hasExperience: editableFormData.hasExperience,
        experienceYears: editableFormData.hasExperience ? editableFormData.experienceYears || null : null,
        experienceDetails: editableFormData.hasExperience
          ? (editableFormData.experienceDetails || "").trim() || null
          : null,
        hasActiveMobile: editableFormData.hasActiveMobile,
        avatarUrl: (editableFormData.avatarUrl || "").trim() || null,
        phone_verified: phoneNumberChanged ? false : providerData?.phone_verified,
      }

      const { data, error: updateError } = await supabase
        .from("ustaz_registrations")
        .update(updatePayload)
        .eq("userId", userIdFromUrl)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      setProviderData(data as IProviderData)
      setIsEditingProfile(false)
      setEditErrors({})
      setEditableFormData(null)

      if (phoneNumberChanged) {
        setOtpSent(false)
        setOtpInput("")
        setOtpError("")
        setOtpSentMessage("Phone number updated. Please re-verify your phone number.")
        setActiveTab("phone-verification")
      }
    } catch (err: any) {
      console.error("Error saving profile:", err.message)
      setError(`Failed to save profile: ${err.message}`)
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setEditableFormData(null)
    setEditErrors({})
  }

  // Handle phone number change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewPhoneData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error for the field being edited
    if (phoneChangeErrors[name]) {
      setPhoneChangeErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle country code selection for phone change
  const handlePhoneCountryChange = (value: string) => {
    const selectedCountry = countries.find((country) => country.name.common === value)
    let countryCode = "+92" // Default fallback

    if (selectedCountry?.idd?.root) {
      countryCode = selectedCountry.idd.root
      // Add suffix if available (some countries have multiple suffixes, we'll use the first one)
      if (selectedCountry.idd.suffixes && selectedCountry.idd.suffixes.length > 0) {
        countryCode += selectedCountry.idd.suffixes[0]
      }
    }

    setNewPhoneData((prev) => ({
      ...prev,
      phoneCountryCode: countryCode,
    }))

    if (phoneChangeErrors.phoneCountryCode) {
      setPhoneChangeErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.phoneCountryCode
        return newErrors
      })
    }
  }

  // Validate phone number change
  const validatePhoneChange = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (!newPhoneData.phoneCountryCode.trim()) {
      newErrors.phoneCountryCode = "Country code is required."
      isValid = false
    }

    if (!newPhoneData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required."
      isValid = false
    } else if (!/^\d{7,}$/.test(newPhoneData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number (digits only, at least 7)."
      isValid = false
    }

    // Check if the new phone number is different from current
    if (
      newPhoneData.phoneCountryCode === providerData?.phoneCountryCode &&
      newPhoneData.phoneNumber === providerData?.phoneNumber
    ) {
      newErrors.phoneNumber = "Please enter a different phone number."
      isValid = false
    }

    setPhoneChangeErrors(newErrors)
    return isValid
  }

  // Save phone number change
  const handleSavePhoneChange = async () => {
    if (!userIdFromUrl || !validatePhoneChange()) return

    setIsSavingPhone(true)
    setError(null)

    try {
      const updatePayload = {
        phoneCountryCode: newPhoneData.phoneCountryCode.trim(),
        phoneNumber: newPhoneData.phoneNumber.trim(),
        phone_verified: false, // Reset verification status
      }

      const { data, error: updateError } = await supabase
        .from("ustaz_registrations")
        .update(updatePayload)
        .eq("userId", userIdFromUrl)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Update local state
      setProviderData(data as IProviderData)

      // Reset dialog state
      setIsPhoneDialogOpen(false)
      setNewPhoneData({ phoneCountryCode: "", phoneNumber: "" })
      setPhoneChangeErrors({})

      // Reset OTP states
      setOtpSent(false)
      setOtpInput("")
      setOtpError("")
      setOtpSentMessage("Phone number updated successfully. Please verify your new number.")
    } catch (err: any) {
      console.error("Error updating phone number:", err.message)
      setError(`Failed to update phone number: ${err.message}`)
    } finally {
      setIsSavingPhone(false)
    }
  }

  // Handle dialog open
  const handleOpenPhoneDialog = () => {
    setNewPhoneData({
      phoneCountryCode: providerData?.phoneCountryCode || "",
      phoneNumber: providerData?.phoneNumber || "",
    })
    setPhoneChangeErrors({})
    setIsPhoneDialogOpen(true)
  }

  // Send OTP
  const sendOtp = async () => {
    if (!providerData?.phoneNumber || !providerData?.phoneCountryCode) {
      setOtpError("Phone number not available for OTP. Please update your profile.")
      return
    }

    setOtpError("")
    setOtpSentMessage("")
    setIsSendingOtp(true)

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: providerData.phoneNumber,
          phoneCountryCode: providerData.phoneCountryCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP.")
      }

      setOtpSent(true)
      setOtpSentMessage(
        `OTP has been sent to ${providerData.phoneCountryCode}${providerData.phoneNumber}. Please check your phone.`,
      )
      console.log("OTP send request successful:", data)
    } catch (error: any) {
      console.error("Error sending OTP:", error.message)
      setOtpError(`Failed to send OTP: ${error.message}. Please check your phone number and try again.`)
      setOtpSent(false)
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Verify OTP
  const verifyOtp = async () => {
    if (!providerData?.phoneNumber || !providerData?.phoneCountryCode || !userIdFromUrl) {
      setOtpError("Phone number or User ID not available. Cannot verify.")
      return
    }

    setOtpError("")
    setOtpSentMessage("")
    setIsVerifyingOtp(true)

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: providerData.phoneNumber,
          phoneCountryCode: providerData.phoneCountryCode,
          otp: otpInput,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP.")
      }

      const { error: updateError } = await supabase
        .from("ustaz_registrations")
        .update({ phone_verified: true })
        .eq("userId", userIdFromUrl)

      if (updateError) {
        throw updateError
      }

      setProviderData((prev) => (prev ? { ...prev, phone_verified: true } : null))
      setOtpError("")
      setOtpSentMessage("Phone number verified successfully!")
      console.log("OTP verification successful:", data)
    } catch (error: any) {
      console.error("Error verifying OTP:", error.message)
      setOtpError(`Invalid OTP: ${error.message}. Please try again.`)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  if (loading) {
    return <DashboardSkeleton />
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
    )
  }

  if (!providerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Provider Data Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Could not retrieve your provider information. This might happen if you are not yet registered or if there
              was an issue fetching your specific user ID.
            </p>
            <Button onClick={() => fetchProviderData(userIdFromUrl)} className="w-full bg-[#db4b0d] hover:bg-[#c4420c]">
              Try Reloading
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
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

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {dashboardMenuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.tab}>
                        <SidebarMenuButton
                          onClick={() => setActiveTab(item.tab as "profile" | "settings" | "phone-verification")}
                          className={`w-full justify-start px-3 py-2 rounded-lg transition-colors ${
                            activeTab === item.tab
                              ? "bg-[#db4b0d] text-white hover:bg-[#c4420c]"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="mr-3 h-4 w-4" />
                          {item.title}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
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
                    {activeTab === "profile" && "Profile"}
                    {activeTab === "settings" && "Settings"}
                    {activeTab === "phone-verification" && "Phone Verification"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="flex-1 p-6">
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
                          setIsEditingProfile(true)
                          setEditableFormData(providerData)
                          setEditErrors({})
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
                              <Label htmlFor="editCountry" className="text-sm font-medium text-gray-700">
                                Country <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={editableFormData.country}
                                onValueChange={(value) => handleSelectChange("country", value)}
                              >
                                <SelectTrigger className={`mt-1 ${editErrors.country ? "border-red-500" : ""}`}>
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent>
                                  {countries.map((country) => (
                                    <SelectItem key={country.name.common} value={country.name.common}>
                                      {country.name.common}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {editErrors.country && <p className="text-red-500 text-sm mt-1">{editErrors.country}</p>}
                            </div>

                            <div>
                              <Label htmlFor="editCity" className="text-sm font-medium text-gray-700">
                                City <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={editableFormData.city}
                                onValueChange={(value) => handleSelectChange("city", value)}
                                disabled={!editableFormData.country || !citiesByCountry[editableFormData.country]}
                              >
                                <SelectTrigger className={`mt-1 ${editErrors.city ? "border-red-500" : ""}`}>
                                  <SelectValue placeholder="Select City" />
                                </SelectTrigger>
                                <SelectContent>
                                  {editableFormData.country &&
                                    citiesByCountry[editableFormData.country]?.map((city) => (
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
                                  {editableFormData.phoneCountryCode}
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

                        {/* Experience Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience Information</h3>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">
                                Do you have prior experience? <span className="text-red-500">*</span>
                              </Label>
                              <div className="flex gap-6 mt-2">
                                <Label className="flex items-center">
                                  <Input
                                    type="radio"
                                    name="hasExperience"
                                    value="true"
                                    checked={editableFormData.hasExperience === true}
                                    onChange={handleEditChange}
                                    className="mr-2 w-4 h-4"
                                  />
                                  Yes
                                </Label>
                                <Label className="flex items-center">
                                  <Input
                                    type="radio"
                                    name="hasExperience"
                                    value="false"
                                    checked={editableFormData.hasExperience === false}
                                    onChange={handleEditChange}
                                    className="mr-2 w-4 h-4"
                                  />
                                  No
                                </Label>
                              </div>
                              {editErrors.hasExperience && (
                                <p className="text-red-500 text-sm mt-1">{editErrors.hasExperience}</p>
                              )}
                            </div>

                            {editableFormData.hasExperience && (
                              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <div>
                                  <Label htmlFor="editExperienceYears" className="text-sm font-medium text-gray-700">
                                    Years of Experience <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id="editExperienceYears"
                                    name="experienceYears"
                                    type="number"
                                    value={editableFormData.experienceYears || ""}
                                    onChange={handleEditChange}
                                    className={`mt-1 ${editErrors.experienceYears ? "border-red-500" : ""}`}
                                    min="1"
                                  />
                                  {editErrors.experienceYears && (
                                    <p className="text-red-500 text-sm mt-1">{editErrors.experienceYears}</p>
                                  )}
                                </div>

                                <div>
                                  <Label htmlFor="editExperienceDetails" className="text-sm font-medium text-gray-700">
                                    Experience Details <span className="text-red-500">*</span>
                                  </Label>
                                  <Textarea
                                    id="editExperienceDetails"
                                    name="experienceDetails"
                                    value={editableFormData.experienceDetails || ""}
                                    onChange={handleEditChange}
                                    className={`mt-1 ${editErrors.experienceDetails ? "border-red-500" : ""}`}
                                    rows={3}
                                    placeholder="Describe your experience in detail..."
                                  />
                                  {editErrors.experienceDetails && (
                                    <p className="text-red-500 text-sm mt-1">{editErrors.experienceDetails}</p>
                                  )}
                                </div>
                              </div>
                            )}
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
                              <Label className="text-sm font-medium text-gray-500">Country</Label>
                              <p className="text-base text-gray-900">{providerData.country}</p>
                            </div>

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
                                {providerData.phoneCountryCode}
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
                              <Label className="text-sm font-medium text-gray-500">Experience</Label>
                              <p className="text-base text-gray-900">
                                {providerData.hasExperience
                                  ? `${providerData.experienceYears} Years`
                                  : "No prior experience"}
                              </p>
                            </div>

                            {providerData.hasExperience && providerData.experienceDetails && (
                              <div className="col-span-1 md:col-span-2 space-y-1">
                                <Label className="text-sm font-medium text-gray-500">Experience Details</Label>
                                <p className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                                  {providerData.experienceDetails}
                                </p>
                              </div>
                            )}

                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">Active Mobile</Label>
                              <p className="text-base text-gray-900">{providerData.hasActiveMobile ? "Yes" : "No"}</p>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-500">How did you hear about us?</Label>
                              <p className="text-base text-gray-900">{providerData.heardFrom}</p>
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
                          {providerData.phoneCountryCode}
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
                                <Label htmlFor="phoneCountry" className="text-sm font-medium text-gray-700">
                                  Country <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={
                                    countries.find((c) => c.idd?.root === newPhoneData.phoneCountryCode)?.name.common ||
                                    ""
                                  }
                                  onValueChange={handlePhoneCountryChange}
                                >
                                  <SelectTrigger
                                    className={`mt-1 ${phoneChangeErrors.phoneCountryCode ? "border-red-500" : ""}`}
                                  >
                                    <SelectValue placeholder="Select Country" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {countries.map((country) => {
                                      const countryCode = country.idd?.root + (country.idd?.suffixes?.[0] || "")
                                      return (
                                        <SelectItem key={country.name.common} value={country.name.common}>
                                          {country.name.common} ({countryCode})
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                                {phoneChangeErrors.phoneCountryCode && (
                                  <p className="text-red-500 text-sm mt-1">{phoneChangeErrors.phoneCountryCode}</p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor="newPhoneNumber" className="text-sm font-medium text-gray-700">
                                  Phone Number <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex mt-1">
                                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                    {newPhoneData.phoneCountryCode || "+92"}
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

                              {(newPhoneData.phoneCountryCode !== providerData?.phoneCountryCode ||
                                newPhoneData.phoneNumber !== providerData?.phoneNumber) && (
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
                                className="bg-[#db4b0d] hover:bg-[#c4420c]"
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
                                setOtpSent(false)
                                setOtpInput("")
                                setOtpError("")
                                setOtpSentMessage("")
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
  )
}

function ProviderDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ProviderDashboardInner />
    </Suspense>
  )
}

export default ProviderDashboard
