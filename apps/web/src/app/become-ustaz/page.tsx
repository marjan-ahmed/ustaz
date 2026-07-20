"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../../../client/supabaseClient"
import {
  ChevronRight,
  ChevronLeft,
  User,
  FileText,
  CheckCircle,
  Upload,
  Phone,
  Mail,
  MapPin,
  Edit3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ImageCropEditor } from "../components/image-crop-editor"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { useTranslations } from "next-intl"
import { useSupabaseUser } from "@/hooks/useSupabaseUser"
import PhoneOtpAuth from "../components/PhoneOtpAuth"
import { Loader2 } from "lucide-react"

// Define TypeScript Interfaces
interface IFormData {
  firstName: string
  lastName: string
  email: string
  cnic: string
  phoneNumber: string
  service_type: string
  serviceTypes: string[]
  hasActiveMobile: boolean | null
  avatar: File | null
  avatarUrl: string
  cnicFrontUrl: string
  cnicBackUrl: string
  agreedToTerms: boolean
  wantsUpdates: boolean
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments where crypto.randomUUID is not available
  // This is a simple UUID v4 approximation, not cryptographically strong
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function App() {
  const t = useTranslations("form")
  const { user, isLoaded, isSignedIn } = useSupabaseUser()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const router = useRouter()
  const [formData, setFormData] = useState<IFormData>({
    firstName: "",
    lastName: "",
    email: "",
    cnic: "",
    phoneNumber: "",
    service_type: "",
    serviceTypes: [],
    hasActiveMobile: null,
    avatar: null,
    avatarUrl: "",
    cnicFrontUrl: "",
    cnicBackUrl: "",
    agreedToTerms: false,
    wantsUpdates: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [userId, setUserId] = useState<string>("")

  // Bind provider profile to the authenticated user — never a random UUID.
  useEffect(() => {
    if (user?.id) setUserId(user.id)
  }, [user?.id])

  // If signed in and a provider profile already exists, route straight to dashboard.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return
    ;(async () => {
      const { data } = await supabase
        .from("ustaz_registrations")
        .select("userId")
        .eq("userId", user.id)
        .maybeSingle()
      if (data) router.replace("/dashboard")
    })()
  }, [isLoaded, isSignedIn, user?.id, router])
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const [slideDirection, setSlideDirection] = useState<"next" | "back" | null>(null)
  const [isRegisteredSuccessfully, setIsRegisteredSuccessfully] = useState<boolean>(false)

  // Image crop editor states
  const [showImageEditor, setShowImageEditor] = useState<boolean>(false)
  const [tempImageUrl, setTempImageUrl] = useState<string>("")

  // OTP States
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otpInput, setOtpInput] = useState<string>("")
  const [otpError, setOtpError] = useState<string>("")
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false)
  const [otpSentMessage, setOtpSentMessage] = useState<string>("")
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false)

  // Removed useEffect that called getCurrentLocation

  const service_types = ["Electrician", "Plumbing", "Carpentry", "AC Maintenance", "Solar Technician"]

  // Handle input changes for all form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    let newValue: string | boolean = value
    if (type === "radio") {
      newValue = (e.target as HTMLInputElement).value === "yes"
    } else if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Removed handleLocationSelect function
  // Removed getCurrentLocation function

  // Handle file uploads for avatar with image editor
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setTempImageUrl(reader.result as string)
        setShowImageEditor(true)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle saving cropped image
  const handleSaveCroppedImage = (croppedImageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      avatarUrl: croppedImageUrl,
    }))
    setShowImageEditor(false)
    setTempImageUrl("")
  }

  // Handle canceling image editor
  const handleCancelImageEditor = () => {
    setShowImageEditor(false)
    setTempImageUrl("")
  }

  // Handle CNIC photo uploads
  const handleCnicPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cnicFrontUrl' | 'cnicBackUrl') => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    try {
      const timestamp = Date.now()
      const path = `${userId}/cnic-${type === 'cnicFrontUrl' ? 'front' : 'back'}-${timestamp}.jpg`
      const { data, error } = await supabase.storage
        .from('provider-docs')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('provider-docs').getPublicUrl(data.path)
      setFormData(prev => ({ ...prev, [type]: urlData.publicUrl }))
      if (errors[type]) {
        setErrors(prev => { const n = { ...prev }; delete n[type]; return n })
      }
    } catch (err: any) {
      console.error('CNIC upload error:', err.message)
    }
  }

  // Toggle service type in multi-select
  const toggleServiceType = (service: string) => {
    setFormData(prev => {
      const types = prev.serviceTypes.includes(service)
        ? prev.serviceTypes.filter(s => s !== service)
        : [...prev.serviceTypes, service]
      return { ...prev, serviceTypes: types, service_type: types[0] || '' }
    })
    if (errors.serviceTypes) {
      setErrors(prev => { const n = { ...prev }; delete n.serviceTypes; return n })
    }
  }

  // Validation function for each step of the form
  const validateStep = (): boolean => {
  const newErrors: Record<string, string> = {}
  let isValid = true

  if (currentStep === 1) {
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("errors.firstNameRequired")
      isValid = false
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("errors.lastNameRequired")
      isValid = false
    }
    if (!formData.cnic.trim()) {
      newErrors.cnic = t("errors.cnicRequired")
      isValid = false
    } else if (!/^\d{13}$/.test(formData.cnic)) {
      newErrors.cnic = t("errors.cnicLength")
      isValid = false
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = t("errors.phoneRequired")
      isValid = false
    } else if (!/^\d{7,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = t("errors.phoneInvalid")
      isValid = false
    }
  } else if (currentStep === 2) {
    if (!formData.cnicFrontUrl) {
      newErrors.cnicFrontUrl = "Please upload CNIC front photo"
      isValid = false
    }
    if (!formData.cnicBackUrl) {
      newErrors.cnicBackUrl = "Please upload CNIC back photo"
      isValid = false
    }
  } else if (currentStep === 3) {
    if (formData.serviceTypes.length === 0) {
      newErrors.serviceTypes = t("errors.serviceTypeRequired")
      isValid = false
    }
    if (formData.hasActiveMobile === null) {
      newErrors.hasActiveMobile = t("errors.mobileOptionRequired")
      isValid = false
    }
  } else if (currentStep === 4) {
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = t("errors.mustAgree")
      isValid = false
    }
  }

  setErrors(newErrors)
  return isValid
}

  // Handle "Next" button click with animation
  const handleNext = () => {
    if (validateStep()) {
      setSlideDirection("next")
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
        setIsTransitioning(false)
        setSlideDirection(null)
      }, 300)
    }
  }

  // Handle "Back" button click with animation
  const handleBack = () => {
    setSlideDirection("back")
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1)
      setIsTransitioning(false)
      setSlideDirection(null)
    }, 300)
  }

  // Function to send OTP via Next.js API route
  const sendOtp = async () => {
    setOtpError("")
    setOtpSentMessage("")
    setIsSendingOtp(true)
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          phoneCountryCode: "+92",
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP.")
      }
      setOtpSent(true)
      setOtpSentMessage(
        `OTP has been sent to +92${formData.phoneNumber}. Please check your phone.`,
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

  // Function to verify OTP via Next.js API route
  const verifyOtp = async () => {
    setOtpError("")
    setOtpSentMessage("")
    setIsVerifyingOtp(true)
    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          phoneCountryCode: "+92",
          otp: otpInput,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP.")
      }
      setIsPhoneVerified(true)
      setOtpError("")
      setOtpSentMessage("Phone number verified successfully!")
      console.log("OTP verification successful:", data)
    } catch (error: any) {
      console.error("Error verifying OTP:", error.message)
      setIsPhoneVerified(false)
      setOtpError(`Invalid OTP: ${error.message}. Please try again.`)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Function to skip phone verification
  const skipVerification = () => {
    setIsPhoneVerified(false)
    setOtpError("")
    setOtpSentMessage("Phone verification skipped. Your request will be pending approval.")
  }

  // Function to send all form data to Supabase
  const sendToSupabase = async (data: IFormData) => {
    setIsLoading(true)
    console.log("Attempting to send data to Supabase:", data)
    try {
      const dataToSave = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        cnic: data.cnic,
        phoneCountryCode: "+92",
        phoneNumber: data.phoneNumber,
        service_type: data.service_type,
        service_types: data.serviceTypes.length > 0 ? data.serviceTypes : null,
        hasActiveMobile: data.hasActiveMobile,
        avatarUrl: data.avatarUrl || null,
        cnic_front_url: data.cnicFrontUrl || null,
        cnic_back_url: data.cnicBackUrl || null,
        registrationDate: new Date().toISOString(),
        userId: userId,
        phone_verified: true,
      }
      const { data: supabaseData, error } = await supabase.from("ustaz_registrations").insert([dataToSave])
      if (error) {
        throw error
      }
      console.log("Data successfully sent to Supabase:", supabaseData)
      setIsLoading(false)
      setIsRegisteredSuccessfully(true)
      localStorage.setItem("isRegisteredSuccessfully", "true")
      router.push(`/dashboard`)
    } catch (error: any) {
      console.error("Error sending data to Supabase:", error.message)
      setIsLoading(false)
      setIsRegisteredSuccessfully(false)
    }
  }

  // Handle "Submit" button click for the entire form
  const handleSubmit = async () => {
    if (validateStep()) {
      await sendToSupabase(formData)
    }
  }

  // Derive full name for greeting
  const userFullName = `${formData.firstName} ${formData.lastName}`.trim()

  // Configuration for progress bar steps
  const steps = [
   {
      number: 1,
      title: t("title1"),
      icon: User,
      description: t("description1"),
    },
    {
      number: 2,
      title: "CNIC Photos",
      icon: FileText,
      description: "Upload your identity documents",
    },
    {
      number: 3,
      title: t("title2"),
      icon: FileText,
      description: t("description2"),
    },
    {
      number: 4,
      title: t("title3"),
      icon: CheckCircle,
      description: t("description3"),
    },
  ]

  // CSS for step transition animations
  const getStepAnimation = () => {
    if (!isTransitioning) return "opacity-100 translate-x-0 scale-100"
    if (slideDirection === "next") return "opacity-0 translate-x-8 scale-95"
    return "opacity-0 -translate-x-8 scale-95"
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("registeredUserId")
    const storedSuccess = localStorage.getItem("isRegisteredSuccessfully")
    if (storedSuccess === "true") {
      setIsRegisteredSuccessfully(true)
    }
    // Ignore any legacy `registeredUserId` from localStorage — userId now
    // comes from the authenticated session only.
    void storedUserId
  }, [])


  // Auth gate: providers must verify phone (Supabase OTP) before completing the form.
  if (!isLoaded) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-10 h-10 animate-spin text-[#db4b0d]" />
        </div>
        <Footer />
      </>
    )
  }

  if (!isSignedIn) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 px-4 py-16">
          <PhoneOtpAuth
            title="Become a Ustaz"
            subtitle="Verify your phone to start your provider registration."
            onSuccess={() => { /* re-render once useSupabaseUser flips to signed-in */ }}
          />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
    <Header/>
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Enhanced Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 w-full h-1 bg-gray-200 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            {/* Step Indicators */}
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep >= step.number
              const isCurrent = currentStep === step.number
              return (
                <div key={step.number} className="relative flex flex-col items-center z-10">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-110"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                    } ${isCurrent ? "ring-4 ring-orange-200 animate-pulse" : ""}`}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <div className="mt-3 text-center">
                    <div
                      className={`text-sm font-semibold transition-colors duration-300 ${
                        isActive ? "text-orange-600" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Step Content */}
            <div className={`transition-all duration-300 ease-out ${getStepAnimation()}`}>
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                      {t('welcomeUstaz')}
                    </h2>
                    <p className="text-gray-600 text-lg">{t('personalInfoIntro')}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="group">
                      <Label htmlFor="firstName" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 mr-2 text-orange-500" />
                        {t('firstName')} <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`${
                          errors.firstName
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                        }`}
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.firstName}</p>
                      )}
                    </div>
                    {/* Last Name */}
                    <div className="group">
                      <Label htmlFor="lastName" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 mr-2 text-orange-500" />
                        {t('lastName')} <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`${
                          errors.lastName
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                        }`}
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  {/* Email */}
                  <div className="group">
                    <Label htmlFor="email" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="w-4 h-4 mr-2 text-orange-500" />
                      {t('email')} <span className="text-gray-400">{t('optional')}</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {/* CNIC */}
                  <div className="group">
                    <Label htmlFor="cnic" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FileText className="w-4 h-4 mr-2 text-orange-500" />
                      {t('cnic')} <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="cnic"
                      type="text"
                      name="cnic"
                      value={formData.cnic}
                      onChange={handleChange}
                      maxLength={13}
                      className={`${
                        errors.cnic
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                      }`}
                      placeholder="4220112345678"
                    />
                    {errors.cnic && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.cnic}</p>}
                  </div>
                  {/* Address Section */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 md:p-8 rounded-2xl border border-orange-100 shadow-sm">
                    <h3 className="flex items-center text-xl font-semibold text-gray-800 mb-6">
                      <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                      {t('address')}
                    </h3>
                    <p className="text-sm text-gray-500">Your location will be tracked from your device when you go online.</p>
                  </div>
                  {/* Phone Number */}
                  <div className="group">
                    <Label htmlFor="phoneNumber" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="w-4 h-4 mr-2 text-orange-500" />
                      {t('phoneNumber')} <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-gray-600 font-medium">
                        +92
                      </span>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`rounded-l-none ${
                          errors.phoneNumber
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                        }`}
                        placeholder="3001234567"
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.phoneNumber}</p>
                    )}
                  </div>

          
                  {/* Navigation */}
                  <div className="flex justify-end pt-6">
                    <Button
                      onClick={handleNext}
                      className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      {t('continue')}
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: CNIC Photos */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                      CNIC Photos
                    </h2>
                    <p className="text-gray-600 text-lg">Upload clear photos of your identity card</p>
                  </div>

                  {/* CNIC Front */}
                  <div className="group">
                    <Label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <FileText className="w-4 h-4 mr-2 text-orange-500" />
                      CNIC Front Side <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-48 h-32 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden hover:border-orange-400 transition-colors">
                        {formData.cnicFrontUrl ? (
                          <img src={formData.cnicFrontUrl} alt="CNIC Front" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Click to upload</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCnicPhotoChange(e, 'cnicFrontUrl')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>• Clear, readable photo</p>
                        <p>• All 4 corners visible</p>
                        <p>• No glare or blur</p>
                      </div>
                    </div>
                    {errors.cnicFrontUrl && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.cnicFrontUrl}</p>}
                  </div>

                  {/* CNIC Back */}
                  <div className="group">
                    <Label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <FileText className="w-4 h-4 mr-2 text-orange-500" />
                      CNIC Back Side <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-48 h-32 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden hover:border-orange-400 transition-colors">
                        {formData.cnicBackUrl ? (
                          <img src={formData.cnicBackUrl} alt="CNIC Back" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Click to upload</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCnicPhotoChange(e, 'cnicBackUrl')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>• Clear, readable photo</p>
                        <p>• All 4 corners visible</p>
                        <p>• No glare or blur</p>
                      </div>
                    </div>
                    {errors.cnicBackUrl && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.cnicBackUrl}</p>}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-6">
                    <Button
                      onClick={handleBack}
                      className="group bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                      {t('back')}
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      {t('continue')}
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Service Selection */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                      {t('experienceTitle')}
                    </h2>
                    <p className="text-gray-600 text-lg">{t('experienceHelpText')}</p>
                  </div>
                  {/* Select services (multi-select) */}
                  <div className="group">
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                      {t('selectService')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {service_types.map((service) => {
                        const isActive = formData.serviceTypes.includes(service)
                        return (
                          <button
                            key={service}
                            type="button"
                            onClick={() => toggleServiceType(service)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${
                              isActive
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {isActive ? (
                              <CheckCircle className="w-5 h-5 text-orange-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            )}
                            {service}
                          </button>
                        )
                      })}
                    </div>
                    {errors.serviceTypes && (
                      <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.serviceTypes}</p>
                    )}
                  </div>
                  {/* Active Mobile Question */}
                  <div className="group">
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                      {t('activeMobile')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="hasActiveMobile"
                          value="yes"
                          checked={formData.hasActiveMobile === true}
                          onChange={handleChange}
                          className="w-5 h-5 text-orange-500 border-2 border-gray-300 focus:ring-orange-500 focus:ring-2"
                        />
                        <span className="ml-3 text-gray-700 font-medium group-hover:text-orange-600 transition-colors duration-200">
                          {t('yes')}
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="hasActiveMobile"
                          value="no"
                          checked={formData.hasActiveMobile === false}
                          onChange={handleChange}
                          className="w-5 h-5 text-orange-500 border-2 border-gray-300 focus:ring-orange-500 focus:ring-2"
                        />
                        <span className="ml-3 text-gray-700 font-medium group-hover:text-orange-600 transition-colors duration-200">
                          {t('no')}
                        </span>
                      </label>
                    </div>
                    {errors.hasActiveMobile && (
                      <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.hasActiveMobile}</p>
                    )}
                  </div>
                  {/* Navigation */}
                  <div className="flex justify-between pt-6">
                    <Button
                      onClick={handleBack}
                      className="group bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                      {t('back')}
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      {t('continue')}
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Greeting and Finalize */}
              {currentStep === 4 && (
                <div className="space-y-8 text-center">
                  {isRegisteredSuccessfully ? (
                    // Success message and identifier component
                    <div
                      className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative"
                      role="alert"
                    >
                      <strong className="font-bold">{t('registrationSuccess')}</strong>
                      <span className="block sm:inline"> {t('thankYou')}, {userFullName}!</span>
                      <p className="text-sm mt-2">
                        {t('yourUniqueIdIs')} <span className="font-mono font-semibold break-all">{userId}</span>
                      </p>
                      <p className="text-sm mt-1">{t('keepIdSafe')}</p>
                      <Link href={`/dashboard?userId=${userId}`} passHref>
                        <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md">
                          {t('goToDashboardButton')}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
                        {t('greeting')}, {userFullName || "Future Ustaz"}!
                      </h2>
                      <p className="text-lg text-gray-600">
                        {t('welcomeServiceProvider')}
                      </p>

                      {/* Avatar Upload Section with Image Crop Editor */}
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shadow-lg border-4 border-orange-400">
                          {formData.avatarUrl ? (
                            <>
                              <img
                                src={formData.avatarUrl || "/placeholder.svg"}
                                alt="User Avatar"
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => {
                                  setTempImageUrl(formData.avatarUrl)
                                  setShowImageEditor(true)
                                }}
                                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
                              >
                                <Edit3 className="w-6 h-6 text-white" />
                              </button>
                            </>
                          ) : (
                            <Upload className="w-20 h-20 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="avatar" className="block text-sm font-semibold text-gray-700 mb-2">
                            {t('uploadAvatar')} {t('optional')}
                          </Label>
                          <input
                            type="file"
                            id="avatar"
                            name="avatar"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full max-w-xs px-4 py-2 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 focus:border-orange-400 bg-white hover:border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          />
                        </div>
                      </div>

                      {/* Phone Verification Section */}
                      <div className="space-y-4 mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200 text-left shadow-inner">
                        <h3 className="text-xl font-bold text-blue-800 flex items-center mb-4">
                          <Phone className="w-5 h-5 mr-2 text-blue-600" /> {t('verifyPhone')}
                        </h3>
                        <p className="text-base text-gray-700">
                          {t('registeredPhone')}:{" "}
                          <span className="font-bold text-blue-700">
                            +92
                            {formData.phoneNumber}
                          </span>
                          {isPhoneVerified && <span className="text-green-600 ml-2 font-semibold"> ({t('verified')})</span>}
                        </p>
                        {!isPhoneVerified && (
                          <>
                            <Button
                              onClick={sendOtp}
                              disabled={otpSent || isSendingOtp}
                              className={`w-full px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 mt-4 shadow-md hover:shadow-lg flex items-center justify-center
                                ${otpSent || isSendingOtp ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                              {isSendingOtp ? (
                                <div className="flex items-center">
                                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  {t('sendingOTP')}
                                </div>
                              ) : (
                                "Send OTP"
                              )}
                            </Button>
                            {otpSentMessage && (
                              <p className={`text-sm mt-3 ${isPhoneVerified ? "text-green-600" : "text-blue-600"}`}>
                                {otpSentMessage}
                              </p>
                            )}
                            {otpSent && (
                              <div className="flex flex-col items-start mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200 animate-fade-in">
                                <Label htmlFor="otpInput" className="text-sm font-semibold text-gray-700 mb-2">
                                  {t('enterOTP')}
                                </Label>
                                <Input
                                  id="otpInput"
                                  type="text"
                                  name="otpInput"
                                  value={otpInput}
                                  onChange={(e) => setOtpInput(e.target.value)}
                                  className={`${
                                    otpError
                                      ? "border-red-300 bg-red-50"
                                      : "border-gray-200 focus:border-blue-400 bg-white hover:border-gray-300"
                                  }`}
                                  placeholder="e.g., 123456"
                                  maxLength={6}
                                />
                                {otpError && <p className="text-red-500 text-sm mt-2 animate-fade-in">{otpError}</p>}
                                <div className="flex flex-col sm:flex-row gap-4 w-full mt-6">
                                  <Button
                                    onClick={verifyOtp}
                                    disabled={isVerifyingOtp}
                                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                                  >
                                    {isVerifyingOtp ? (
                                      <div className="flex items-center">
                                        <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          ></circle>
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          ></path>
                                        </svg>
                                        {t('verifying')}
                                      </div>
                                    ) : (
                                      "Verify OTP"
                                    )}
                                  </Button>
                                  <Button
                                    onClick={skipVerification}
                                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors duration-300 shadow-md hover:shadow-lg"
                                  >
                                    {t('skip')}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Checkboxes */}
                      <div className="space-y-4 mt-8 text-left">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="agreedToTerms"
                            name="agreedToTerms"
                            checked={formData.agreedToTerms}
                            onChange={handleChange}
                            className="h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <Label htmlFor="agreedToTerms" className="ml-3 text-base text-gray-700">
                            {t('agreeTerms')}
                            <span className="text-red-500">*</span>
                          </Label>
                        </div>
                        {errors.agreedToTerms && (
                          <p className="text-red-500 text-sm mt-2 animate-fade-in">{errors.agreedToTerms}</p>
                        )}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="wantsUpdates"
                            name="wantsUpdates"
                            checked={formData.wantsUpdates}
                            onChange={handleChange}
                            className="h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <Label htmlFor="wantsUpdates" className="ml-3 text-base text-gray-700">
                            {t('latestUpdates')}
                          </Label>
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-between pt-6">
                        <Button
                          onClick={handleBack}
                          className="group bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                        >
                          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                          {t('back')}
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={isLoading || !formData.agreedToTerms || isRegisteredSuccessfully}
                          className="group bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <svg
                                className="animate-spin h-5 w-5 mr-3 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              {t('submitting')}
                            </div>
                          ) : (
                            t("submit")
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                  {userId && !isRegisteredSuccessfully && (
                    <p className="text-sm text-gray-500 mt-4">
                      {t('yourUserId')}: <span className="font-mono text-gray-700 break-all">{userId}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Editor Modal */}      {showImageEditor && (
        <ImageCropEditor
          initialImage={tempImageUrl}
          onSave={handleSaveCroppedImage}
          onCancel={handleCancelImageEditor}
        />
      )}
    </div>
    <Footer/>
    </>
  )
}

export default App;