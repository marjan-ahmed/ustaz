"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "../../../client/supabaseClient" // Assuming this path is correct for your Supabase client
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
} from "lucide-react"
import { Button } from "@/components/ui/button" // Assuming this path is correct for your Button component
import Link from "next/link" // Assuming this is for Next.js Link component

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
  hasExperience: boolean | null
  experienceYears: string
  experienceDetails: string
  hasActiveMobile: boolean | null
  avatar: File | null
  avatarUrl: string
  agreedToTerms: boolean
  wantsUpdates: boolean
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


function App() {
  const [currentStep, setCurrentStep] = useState<number>(1)
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
    hasExperience: null,
    experienceYears: "",
    experienceDetails: "",
    hasActiveMobile: null,
    avatar: null,
    avatarUrl: "",
    agreedToTerms: false,
    wantsUpdates: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [userId, setUserId] = useState<string>(crypto.randomUUID()) // Unique ID for this registration session
  const [countries, setCountries] = useState<ICountry[]>([])
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const [slideDirection, setSlideDirection] = useState<"next" | "back" | null>(null)
  const [isRegisteredSuccessfully, setIsRegisteredSuccessfully] = useState<boolean>(false)

  // OTP States
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otpInput, setOtpInput] = useState<string>("")
  const [otpError, setOtpError] = useState<string>("")
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false)
  const [otpSentMessage, setOtpSentMessage] = useState<string>("")
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false)

  // Define primary color for consistent styling
  const primaryColor = "#db4b0d" // Orange/Red shade

  // Fetch countries data from REST Countries API on component mount
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

        // Set default phone country code if Pakistan is the default country
        const pakistan = data.find((c) => c.name.common === "Pakistan")
        if (pakistan && pakistan.idd.root) {
          setFormData((prev) => ({
            ...prev,
            phoneCountryCode: `${pakistan.idd.root}${pakistan.idd.suffixes?.[0] || ""}`,
          }))
        }
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

  // Simulated city data (as a comprehensive free API is difficult to integrate client-side)
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

  // Options for "Where did you hear about us?" dropdown
  const socialMediaPlatforms = [
    "Facebook",
    "Instagram",
    "Twitter (X)",
    "LinkedIn",
    "YouTube",
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "WhatsApp",
    "Other",
  ]

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
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle file uploads (currently only for avatar)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "avatar") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: file,
          [`${fieldName}Url`]: reader.result as string, // Store URL for preview
        }))
      }
      reader.readAsDataURL(file)
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: null,
        [`${fieldName}Url`]: "",
      }))
    }
    // Clear error for the field being edited
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  // Validation function for each step of the form
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (currentStep === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required."
        isValid = false
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required."
        isValid = false
      }
      if (!formData.cnic.trim()) {
        newErrors.cnic = "CNIC number is required."
        isValid = false
      } else if (!formData.cnic.startsWith("42201")) {
        newErrors.cnic = "CNIC must start with 42201."
        isValid = false
      } else if (!/^\d{13}$/.test(formData.cnic)) { // 13 digits, no dashes
        newErrors.cnic = "CNIC must be 13 digits (e.g., 4220112345678)."
        isValid = false
      }
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required."
        isValid = false
      } else if (!/^\d{7,}$/.test(formData.phoneNumber)) { // Simple digit check for phone number
        newErrors.phoneNumber = "Please enter a valid phone number (digits only, at least 7)."
        isValid = false
      }
      if (!formData.country.trim()) {
        newErrors.country = "Country is required."
        isValid = false
      }
      if (!formData.city.trim()) {
        newErrors.city = "City is required."
        isValid = false
      }
    } else if (currentStep === 2) {
      if (!formData.heardFrom.trim()) {
        newErrors.heardFrom = "This question is required."
        isValid = false
      }
      if (formData.hasExperience === null) {
        newErrors.hasExperience = "Please select an option."
        isValid = false
      } else if (formData.hasExperience) { // If user has experience, these fields are mandatory
        if (!formData.experienceYears.trim()) {
          newErrors.experienceYears = "Years of experience is required."
          isValid = false
        } else if (isNaN(Number.parseInt(formData.experienceYears)) || Number.parseInt(formData.experienceYears) <= 0) {
          newErrors.experienceYears = "Please enter a valid number of years."
          isValid = false
        }
        if (!formData.experienceDetails.trim()) {
          newErrors.experienceDetails = "Experience details are required."
          isValid = false
        }
      }
      if (formData.hasActiveMobile === null) {
        newErrors.hasActiveMobile = "Please select an option."
        isValid = false
      }
    } else if (currentStep === 3) {
        // For the final step, only agreement to terms is mandatory before submission
        if (!formData.agreedToTerms) {
            newErrors.agreedToTerms = "You must agree to the Terms & Conditions and Privacy Policy."
            isValid = false
        }
    }
    setErrors(newErrors)
    return isValid
  }

  // Handle "Next" button click with animation
  const handleNext = () => {
    if (validateStep()) {
      setSlideDirection("next") // Set slide direction for CSS transition
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1) // Move to next step
        setIsTransitioning(false) // End transition
        setSlideDirection(null) // Reset slide direction
      }, 300) // Animation duration
    }
  }

  // Handle "Back" button click with animation
  const handleBack = () => {
    setSlideDirection("back") // Set slide direction for CSS transition
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1) // Move to previous step
      setIsTransitioning(false) // End transition
      setSlideDirection(null) // Reset slide direction
    }, 300) // Animation duration
  }

  // Function to send OTP via Next.js API route
  const sendOtp = async () => {
    setOtpError("")
    setOtpSentMessage("")
    setIsSendingOtp(true) // Start loading state for OTP sending

    try {
      const response = await fetch('/api/send-otp', { // Call your Next.js API route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          phoneCountryCode: formData.phoneCountryCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // If response is not OK (e.g., status 400 or 500), throw an error
        throw new Error(data.error || 'Failed to send OTP.');
      }

      setOtpSent(true);
      setOtpSentMessage(`OTP has been sent to ${formData.phoneCountryCode}${formData.phoneNumber}. Please check your phone.`);
      console.log("OTP send request successful:", data);
    } catch (error: any) {
      console.error("Error sending OTP:", error.message);
      setOtpError(`Failed to send OTP: ${error.message}. Please check your phone number and try again.`);
      setOtpSent(false); // Reset otpSent if sending failed
    } finally {
      setIsSendingOtp(false); // End loading state for OTP sending
    }
  }

  // Function to verify OTP via Next.js API route
  const verifyOtp = async () => {
    setOtpError("")
    setOtpSentMessage("")
    setIsVerifyingOtp(true) // Start loading state for OTP verification

    try {
      const response = await fetch('/api/verify-otp', { // Call your Next.js API route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          phoneCountryCode: formData.phoneCountryCode,
          otp: otpInput
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // If response is not OK, throw an error
        throw new Error(data.error || 'Failed to verify OTP.');
      }

      setIsPhoneVerified(true); // Mark phone as verified
      setOtpError(""); // Clear any previous OTP errors
      setOtpSentMessage("Phone number verified successfully!");
      console.log("OTP verification successful:", data);

    } catch (error: any) {
      console.error("Error verifying OTP:", error.message);
      setIsPhoneVerified(false); // Keep phone as not verified on error
      setOtpError(`Invalid OTP: ${error.message}. Please try again.`);
    } finally {
      setIsVerifyingOtp(false); // End loading state for OTP verification
    }
  }

  // Function to skip phone verification
  const skipVerification = () => {
    setIsPhoneVerified(false) // Explicitly mark as not verified
    setOtpError("")
    setOtpSentMessage("Phone verification skipped. Your request will be pending approval.")
  }

  // Function to send all form data to Supabase
  const sendToSupabase = async (data: IFormData) => {
    setIsLoading(true) // Start loading state for form submission
    console.log("Attempting to send data to Supabase:", data)
    try {
      const dataToSave = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null, // Send null if email is empty
        cnic: data.cnic,
        country: data.country,
        city: data.city,
        phoneCountryCode: data.phoneCountryCode,
        phoneNumber: data.phoneNumber,
        heardFrom: data.heardFrom,
        hasExperience: data.hasExperience,
        // Convert experienceYears to number or null
        experienceYears:
          data.hasExperience && data.experienceYears.trim() !== "" ? Number.parseInt(data.experienceYears) : null,
        experienceDetails: data.experienceDetails || null, // Send null if empty
        hasActiveMobile: data.hasActiveMobile,
        avatarUrl: data.avatarUrl || null, // Send null if no avatar
        // agreedToTerms and wantsUpdates are intentionally NOT sent to DB as per previous user request
        registrationDate: new Date().toISOString(), // Timestamp for registration
        userId: userId, // Include the generated unique user ID
        phone_verified: isPhoneVerified, // Include phone verification status from Twilio Verify
      }

      // Insert data into the 'ustaz_registrations' table
      const { data: supabaseData, error } = await supabase.from("ustaz_registrations").insert([dataToSave])

      if (error) {
        throw error
      }
      console.log("Data successfully sent to Supabase:", supabaseData)
      setIsLoading(false)
      setIsRegisteredSuccessfully(true) // Set success state on successful registration
    } catch (error: any) {
      console.error("Error sending data to Supabase:", error.message)
      setIsLoading(false)
      setIsRegisteredSuccessfully(false) // Ensure success state is false on error
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
    { number: 1, title: "Personal Info", icon: User, description: "Basic details" },
    { number: 2, title: "Experience", icon: Briefcase, description: "Background info" },
    { number: 3, title: "Complete", icon: CheckCircle, description: "Final step" },
  ]

  // CSS for step transition animations
  const getStepAnimation = () => {
    if (!isTransitioning) return "opacity-100 translate-x-0 scale-100"
    if (slideDirection === "next") return "opacity-0 translate-x-8 scale-95"
    return "opacity-0 -translate-x-8 scale-95"
  }

  return (
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
                      Welcome to Ustaz
                    </h2>
                    <p className="text-gray-600 text-lg">Let's start with your personal information</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="group">
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 mr-2 text-orange-500" />
                        First Name <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
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
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 mr-2 text-orange-500" />
                        Last Name <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
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
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="w-4 h-4 mr-2 text-orange-500" />
                      Email Address <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 focus:border-orange-400 bg-white hover:border-gray-300"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  {/* CNIC */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FileText className="w-4 h-4 mr-2 text-orange-500" />
                      CNIC Number <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="cnic"
                      value={formData.cnic}
                      onChange={handleChange}
                      maxLength={13}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
                        errors.cnic
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                      }`}
                      placeholder="4220112345678"
                    />
                    {errors.cnic && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.cnic}</p>}
                  </div>

                  {/* Address Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                    <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
                      <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                      Address Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Country */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={(e) => {
                            handleChange(e)
                            const selectedCountry = countries.find((c) => c.name.common === e.target.value)
                            if (selectedCountry && selectedCountry.idd.root) {
                              setFormData((prev) => ({
                                ...prev,
                                phoneCountryCode: `${selectedCountry.idd.root}${selectedCountry.idd.suffixes?.[0] || ""}`,
                                city: "",
                              }))
                            } else {
                              setFormData((prev) => ({ ...prev, phoneCountryCode: "", city: "" }))
                            }
                          }}
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
                            errors.country
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                          }`}
                        >
                          <option value="">Select Country</option>
                          {countries.map((country) => (
                            <option key={country.name.common} value={country.name.common}>
                              {country.name.common}
                            </option>
                          ))}
                        </select>
                        {errors.country && (
                          <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.country}</p>
                        )}
                      </div>

                      {/* City */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          City <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          disabled={!formData.country || !citiesByCountry[formData.country]}
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
                            errors.city
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                          } ${!formData.country ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <option value="">Select City</option>
                          {formData.country &&
                            citiesByCountry[formData.country]?.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                        </select>
                        {errors.city && <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.city}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="w-4 h-4 mr-2 text-orange-500" />
                      Phone Number <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-gray-600 font-medium">
                        {formData.phoneCountryCode}
                      </span>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`flex-1 px-4 py-3 border-2 rounded-r-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
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
                    <button
                      onClick={handleNext}
                      className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      Continue
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Experience Questions */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                      Tell Us About Your Experience
                    </h2>
                    <p className="text-gray-600 text-lg">Help us understand your background better</p>
                  </div>

                  {/* Where did you hear about us */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Where did you hear about us? <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="heardFrom"
                      value={formData.heardFrom}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
                        errors.heardFrom
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 focus:border-orange-400 bg-white hover:border-gray-300"
                      }`}
                    >
                      <option value="">Select an option</option>
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

                  {/* Experience Question */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                    <label className="text-sm font-semibold text-gray-700 mb-4 block">
                      Do you have prior experience as an Ustaz/Service Provider? <span className="text-red-500">*</span>
                    </label>
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
                          Yes
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
                          No
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
                          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                            Years of Experience <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="experienceYears"
                            value={formData.experienceYears}
                            onChange={handleChange}
                            min="0"
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
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
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Experience Details <span className="text-red-500">*</span>
                          </label>
                          <textarea
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
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Do you have an active mobile for calling? <span className="text-red-500">*</span>
                    </label>
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
                          Yes
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
                          No
                        </span>
                      </label>
                    </div>
                    {errors.hasActiveMobile && (
                      <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.hasActiveMobile}</p>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-6">
                    <button
                      onClick={handleBack}
                      className="group bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                      Continue
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Greeting and Finalize */}
              {currentStep === 3 && (
                <div className="space-y-8 text-center">
                  {isRegisteredSuccessfully ? (
                    // Success message and identifier component
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative" role="alert">
                      <strong className="font-bold">Registration Successful!</strong>
                      <span className="block sm:inline"> Thank you, {userFullName}!</span>
                      <p className="text-sm mt-2">Your unique User ID is: <span className="font-mono font-semibold break-all">{userId}</span></p>
                      <p className="text-sm mt-1">Please keep this ID safe for future reference.</p>
                      <Button asChild>
                        <Link href={'/dashboard'}>
                        Dashboard 
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
                        Welcome, {userFullName || 'Future Ustaz'}!
                      </h2>
                      <p className="text-lg text-gray-600">
                        We're excited to have you join our community of service providers.
                      </p>

                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shadow-lg border-4 border-orange-400">
                          {formData.avatarUrl ? (
                            <img
                              src={formData.avatarUrl}
                              alt="User Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Upload className="w-20 h-20 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <label htmlFor="avatar" className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload Your Avatar (Optional)
                          </label>
                          <input
                            type="file"
                            id="avatar"
                            name="avatar"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'avatar')}
                            className="w-full max-w-xs px-4 py-2 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 focus:border-orange-400 bg-white hover:border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          />
                        </div>
                      </div>

                      {/* Phone Verification Section */}
                      <div className="space-y-4 mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200 text-left shadow-inner">
                        <h3 className="text-xl font-bold text-blue-800 flex items-center mb-4">
                          <Phone className="w-5 h-5 mr-2 text-blue-600" /> Verify Your Phone Number
                        </h3>
                        <p className="text-base text-gray-700">
                          Your registered phone number: <span className="font-bold text-blue-700">{formData.phoneCountryCode}{formData.phoneNumber}</span>
                          {isPhoneVerified && <span className="text-green-600 ml-2 font-semibold"> (Verified!)</span>}
                        </p>
                        {!isPhoneVerified && (
                          <>
                            <button
                              onClick={sendOtp}
                              disabled={otpSent || isSendingOtp}
                              className={`w-full px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 mt-4 shadow-md hover:shadow-lg flex items-center justify-center
                                ${otpSent || isSendingOtp ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                              {isSendingOtp ? (
                                <div className="flex items-center">
                                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Sending OTP...
                                </div>
                              ) : (
                                'Send OTP'
                              )}
                            </button>
                            {otpSentMessage && (
                              <p className={`text-sm mt-3 ${isPhoneVerified ? 'text-green-600' : 'text-blue-600'}`}>
                                {otpSentMessage}
                              </p>
                            )}
                            {otpSent && (
                              <div className="flex flex-col items-start mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200 animate-fade-in">
                                <label htmlFor="otpInput" className="text-sm font-semibold text-gray-700 mb-2">
                                  Enter OTP
                                </label>
                                <input
                                  type="text"
                                  id="otpInput"
                                  name="otpInput"
                                  value={otpInput}
                                  onChange={(e) => setOtpInput(e.target.value)}
                                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${
                                    otpError
                                      ? "border-red-300 bg-red-50"
                                      : "border-gray-200 focus:border-blue-400 bg-white hover:border-gray-300"
                                  }`}
                                  placeholder="e.g., 123456"
                                  maxLength={6}
                                />
                                {otpError && <p className="text-red-500 text-sm mt-2 animate-fade-in">{otpError}</p>}
                                <div className="flex flex-col sm:flex-row gap-4 w-full mt-6">
                                  <button
                                    onClick={verifyOtp}
                                    disabled={isVerifyingOtp}
                                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                                  >
                                    {isVerifyingOtp ? (
                                      <div className="flex items-center">
                                        <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                      </div>
                                    ) : (
                                      'Verify OTP'
                                    )}
                                  </button>
                                  <button
                                    onClick={skipVerification}
                                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors duration-300 shadow-md hover:shadow-lg"
                                  >
                                    Skip for now
                                  </button>
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
                          <label htmlFor="agreedToTerms" className="ml-3 text-base text-gray-700">
                            I agree to the <Link href="#" className="text-orange-600 hover:underline font-medium">Terms & Conditions</Link> and <Link href="#" className="text-orange-600 hover:underline font-medium">Privacy Policy</Link> <span className="text-red-500">*</span>
                          </label>
                        </div>
                        {errors.agreedToTerms && <p className="text-red-500 text-sm mt-2 animate-fade-in">{errors.agreedToTerms}</p>}

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="wantsUpdates"
                            name="wantsUpdates"
                            checked={formData.wantsUpdates}
                            onChange={handleChange}
                            className="h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <label htmlFor="wantsUpdates" className="ml-3 text-base text-gray-700">
                            I would like to receive the latest updates from Ustaz
                          </label>
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-between pt-6">
                        <button
                          onClick={handleBack}
                          className="group bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                        >
                          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                          Back
                        </button>
                        <button
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
                              Submitting...
                            </div>
                          ) : (
                            'Submit Registration'
                          )}
                        </button>
                      </div>
                    </>
                  )}
                  {userId && !isRegisteredSuccessfully && ( // Only show User ID if not yet successfully registered
                    <p className="text-sm text-gray-500 mt-4">
                      Your User ID: <span className="font-mono text-gray-700 break-all">{userId}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
