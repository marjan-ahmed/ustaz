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
  Calendar,
  Briefcase,
  Edit3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ImageCropEditor } from "../components/image-crop-editor"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { useTranslations } from "next-intl"
// Removed: dynamic import for LocationPickerMap

// Define TypeScript Interfaces
interface IFormData {
  firstName: string
  lastName: string
  email: string
  cnic: string
  country: string
  city: string
  phoneCountryCode: string
  phoneNumber: string
  heardFrom: string
  service_type: string
  hasExperience: boolean | null
  experienceYears: string
  experienceDetails: string
  hasActiveMobile: boolean | null
  avatar: File | null
  avatarUrl: string
  agreedToTerms: boolean
  wantsUpdates: boolean
  latitude: number | null;
  longitude: number | null;
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

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is not available
  // This is a simple UUID v4 approximation, not cryptographically strong
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function App() {
  const t = useTranslations("form")
  const [currentStep, setCurrentStep] = useState<number>(1)
  const router = useRouter()
  const [formData, setFormData] = useState<IFormData>({
    firstName: "",
    lastName: "",
    email: "",
    cnic: "",
    country: "Pakistan",
    city: "",
    phoneCountryCode: "+92",
    phoneNumber: "",
    heardFrom: "",
    service_type: "",
    hasExperience: null,
    experienceYears: "",
    experienceDetails: "",
    hasActiveMobile: null,
    avatar: null,
    avatarUrl: "",
    agreedToTerms: false,
    wantsUpdates: false,
    latitude: null,
    longitude: null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [userId, setUserId] = useState<string>(generateUUID())
  const [countries, setCountries] = useState<ICountry[]>([])
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

  // Fetch countries data from REST Countries API on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,idd,capital")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: ICountry[] = await response.json()
        data.sort((a, b) => a.name.common.localeCompare(b.name.common))
        setCountries(data)
        const pakistan = data.find((c) => c.name.common === "Pakistan")
        if (pakistan && pakistan.idd.root) {
          setFormData((prev) => ({
            ...prev,
            phoneCountryCode: `${pakistan.idd.root}${pakistan.idd.suffixes?.[0] || ""}`,
          }))
        }
      } catch (error) {
        console.error("Error fetching countries:", error)
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

  // Simulated city data
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

  const socialMediaPlatforms = [
    "Facebook",
    "Instagram",
    "Twitter (X)",
    "LinkedIn",
    "YouTube",
    "Referal/Friend",
    "Other",
  ]

  const service_types = ["Electrician Service", "Plumbing", "Carpentry", "AC Maintenance", "Solar Technician"]

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

  // Handle location selection (now also used by getCurrentLocation)
  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    // Clear location errors once selected
    if (errors.latitude || errors.longitude) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.latitude;
        delete newErrors.longitude;
        return newErrors;
      });
    }
  };

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
    } else if (!formData.cnic.startsWith("42201")) {
      newErrors.cnic = t("errors.cnicStart")
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
    if (!formData.country.trim()) {
      newErrors.country = t("errors.countryRequired")
      isValid = false
    }
    if (!formData.city.trim()) {
      newErrors.city = t("errors.cityRequired")
      isValid = false
    }
    // Validation for latitude and longitude
    if (formData.latitude === null || formData.longitude === null) {
      newErrors.latitude = t("errors.locationRequired");
      newErrors.longitude = t("errors.locationRequired");
      isValid = false;
    }
  } else if (currentStep === 2) {
    if (!formData.heardFrom.trim()) {
      newErrors.heardFrom = t("errors.heardFromRequired")
      isValid = false
    }
    if (!formData.service_type.trim()) {
      newErrors.service_type = t("errors.serviceTypeRequired")
      isValid = false
    }
    if (formData.hasExperience === null) {
      newErrors.hasExperience = t("errors.experienceOptionRequired")
      isValid = false
    } else if (formData.hasExperience) {
      if (!formData.experienceYears.trim()) {
        newErrors.experienceYears = t("errors.experienceYearsRequired")
        isValid = false
      } else if (isNaN(Number.parseInt(formData.experienceYears)) || Number.parseInt(formData.experienceYears) <= 0) {
        newErrors.experienceYears = t("errors.experienceYearsInvalid")
        isValid = false
      }
      if (!formData.experienceDetails.trim()) {
        newErrors.experienceDetails = t("errors.experienceDetailsRequired")
        isValid = false
      }
    }
    if (formData.hasActiveMobile === null) {
      newErrors.hasActiveMobile = t("errors.mobileOptionRequired")
      isValid = false
    }
  } else if (currentStep === 3) {
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
          phoneCountryCode: formData.phoneCountryCode,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP.")
      }
      setOtpSent(true)
      setOtpSentMessage(
        `OTP has been sent to ${formData.phoneCountryCode}${formData.phoneNumber}. Please check your phone.`,
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
          phoneCountryCode: formData.phoneCountryCode,
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
        country: data.country,
        city: data.city,
        phoneCountryCode: data.phoneCountryCode,
        phoneNumber: data.phoneNumber,
        heardFrom: data.heardFrom,
        service_type: data.service_type,
        hasExperience: data.hasExperience,
        experienceYears:
          data.hasExperience && data.experienceYears.trim() !== "" ? Number.parseInt(data.experienceYears) : null,
        experienceDetails: data.experienceDetails || null,
        hasActiveMobile: data.hasActiveMobile,
        avatarUrl: data.avatarUrl || null,
        registrationDate: new Date().toISOString(),
        userId: userId,
        phone_verified: isPhoneVerified,
        latitude: data.latitude,
        longitude: data.longitude,
      }
      const { data: supabaseData, error } = await supabase.from("ustaz_registrations").insert([dataToSave])
      if (error) {
        throw error
      }
      console.log("Data successfully sent to Supabase:", supabaseData)
      setIsLoading(false)
      setIsRegisteredSuccessfully(true)
      localStorage.setItem("registeredUserId", userId)
      localStorage.setItem("isRegisteredSuccessfully", "true")
      router.push(`/dashboard?userId=${userId}`) // Redirect on success
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
      title: t("title2"),
      icon: Briefcase,
      description: t("description2"),
    },
    {
      number: 3,
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
    if (storedUserId && storedSuccess === "true") {
      setUserId(storedUserId)
      setIsRegisteredSuccessfully(true)
    }
  }, [])


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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Country */}
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-semibold text-gray-700">
                          {t('country')} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) => {
                            const selectedCountry = countries.find((c) => c.name.common === value)
                            setFormData((prev) => ({
                              ...prev,
                              country: value,
                              phoneCountryCode:
                                selectedCountry?.idd?.root + (selectedCountry?.idd?.suffixes?.[0] || "") || "",
                              city: "",
                            }))
                          }}
                        >
                          <SelectTrigger
                            id="country"
                            className={`w-full px-4 py-3 rounded-lg border-2 text-sm transition focus:outline-none focus:ring-0 ${
                              errors.country
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                            }`}
                          >
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
                        {errors.country && (
                          <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.country}</p>
                        )}
                      </div>
                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                          {t('city')} <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.city}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, city: value }))}
                          disabled={!formData.country || !citiesByCountry[formData.country]}
                        >
                          <SelectTrigger
                            id="city"
                            className={`w-full px-4 py-3 rounded-lg border-2 text-sm transition focus:outline-none focus:ring-0 ${
                              errors.city
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                            } ${
                              !formData.country || !citiesByCountry[formData.country]
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.country &&
                              citiesByCountry[formData.country]?.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {errors.city && <p className="text-red-500 text-xs mt-1 animate-fade-in">{errors.city}</p>}
                      </div>
                    </div>
                  </div>
                  {/* Phone Number */}
                  <div className="group">
                    <Label htmlFor="phoneNumber" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="w-4 h-4 mr-2 text-orange-500" />
                      {t('phoneNumber')} <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-gray-600 font-medium">
                        {formData.phoneCountryCode}
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

              {/* Step 2: Experience Questions */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                      {t('experienceTitle')}
                    </h2>
                    <p className="text-gray-600 text-lg">{t('experienceHelpText')}</p>
                  </div>
                  {/* Where did you hear about us */}
                  <div className="group">
                    <Label htmlFor="heardFrom" className="text-sm font-semibold text-gray-700 mb-3 block">
                      {t('heardFrom')} <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="heardFrom"
                      name="heardFrom"
                      value={formData.heardFrom}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
                        errors.heardFrom
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                      }`}
                    >
                      <option value="">{t('selectOption')}</option>
                      {socialMediaPlatforms.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                    {errors.heardFrom && (
                      <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.heardFrom}</p>
                    )}
                  </div>
                  {/* Select a service */}
                  <div className="group">
                    <Label htmlFor="service_type" className="text-sm font-semibold text-gray-700 mb-3 block">
                      {t('selectService')} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="service_type"
                      value={formData.service_type}
                      onValueChange={(value) =>
                        handleChange({
                          target: { name: "service_type", value: value, type: "select-one" },
                        } as React.ChangeEvent<HTMLSelectElement>)
                      }
                    >
                      <SelectTrigger
                        id="service_type"
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
                          errors.service_type
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                        }`}
                      >
                        <SelectValue placeholder="Select a service type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                        {service_types.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.service_type && (
                      <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.service_type}</p>
                    )}
                  </div>
                  {/* Experience Question */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                    <Label className="text-sm font-semibold text-gray-700 mb-4 block">
                      {t('priorExperience')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="hasExperience"
                          value="yes"
                          checked={formData.hasExperience === true}
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
                          name="hasExperience"
                          value="no"
                          checked={formData.hasExperience === false}
                          onChange={handleChange}
                          className="w-5 h-5 text-orange-500 border-2 border-gray-300 focus:ring-orange-500 focus:ring-2"
                        />
                        <span className="ml-3 text-gray-700 font-medium group-hover:text-orange-600 transition-colors duration-200">
                          {t('no')}
                        </span>
                      </label>
                    </div>
                    {errors.hasExperience && (
                      <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.hasExperience}</p>
                    )}
                    {/* Experience Details */}
                    {formData.hasExperience && (
                      <div className="mt-6 space-y-4 p-4 bg-white rounded-xl border border-orange-200 animate-fade-in">
                        <div>
                          <Label
                            htmlFor="experienceYears"
                            className="flex items-center text-sm font-semibold text-gray-700 mb-2"
                          >
                            <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                            {t('yearsOfExperience')} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="experienceYears"
                            type="number"
                            name="experienceYears"
                            value={formData.experienceYears}
                            onChange={handleChange}
                            min="0"
                            className={`${
                              errors.experienceYears
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                            }`}
                            placeholder="e.g., 5"
                          />
                          {errors.experienceYears && (
                            <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.experienceYears}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="experienceDetails" className="text-sm font-semibold text-gray-700 mb-2 block">
                            {t('experienceDetails')} <span className="text-red-500">*</span>
                          </Label>
                          <textarea
                            id="experienceDetails"
                            name="experienceDetails"
                            rows={4}
                            value={formData.experienceDetails}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 resize-none ${
                              errors.experienceDetails
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                            }`}
                            placeholder="Describe your relevant experience, roles, and expertise."
                          ></textarea>
                          {errors.experienceDetails && (
                            <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.experienceDetails}</p>
                          )}
                        </div>
                      </div>
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

              {/* Step 3: Greeting and Finalize */}
              {currentStep === 3 && (
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
                            {formData.phoneCountryCode}
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