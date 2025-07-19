"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Define TypeScript Interfaces (keeping original)
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
  const [userId, setUserId] = useState<string>(crypto.randomUUID())
  const [countries, setCountries] = useState<ICountry[]>([])
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const [slideDirection, setSlideDirection] = useState<"next" | "back" | null>(null)
  const [isRegisteredSuccessfully, setIsRegisteredSuccessfully] = useState<boolean>(false)

  const primaryColor = "#db4b0d"

  // Fetch countries on component mount (keeping original logic)
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

  // Cities data (keeping original)
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
    "TikTok",
    "Snapchat",
    "Pinterest",
    "Reddit",
    "WhatsApp",
    "Other",
  ]

  // Handle input changes (keeping original logic)
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

  // Handle file uploads (keeping original logic)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "avatar") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: file,
          [`${fieldName}Url`]: reader.result as string,
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
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  // Validation function (keeping original logic)
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
      } else if (!/^\d{13}$/.test(formData.cnic)) {
        newErrors.cnic = "CNIC must be 13 digits (e.g., 4220112345678)."
        isValid = false
      }
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required."
        isValid = false
      } else if (!/^\d{7,}$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Please enter a valid phone number (digits only)."
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
      } else if (formData.hasExperience) {
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
      if (!formData.agreedToTerms) {
        newErrors.agreedToTerms = "You must agree to the Terms & Conditions and Privacy Policy."
        isValid = false
      }
    }
    setErrors(newErrors)
    return isValid
  }

  // Handle navigation with enhanced animations
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

  const handleBack = () => {
    setSlideDirection("back")
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1)
      setIsTransitioning(false)
      setSlideDirection(null)
    }, 300)
  }

  // Send data to Supabase (keeping original logic)
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
        hasExperience: data.hasExperience,
        experienceYears:
          data.hasExperience && data.experienceYears.trim() !== "" ? Number.parseInt(data.experienceYears) : null,
        experienceDetails: data.experienceDetails || null,
        hasActiveMobile: data.hasActiveMobile,
        avatarUrl: data.avatarUrl || null,
        registrationDate: new Date().toISOString(),
        userId: userId,
      }

      const { data: supabaseData, error } = await supabase.from("ustaz_registrations").insert([dataToSave])

      if (error) {
        throw error
      }
      console.log("Data successfully sent to Supabase:", supabaseData)
      setIsLoading(false)
      setIsRegisteredSuccessfully(true)
    } catch (error: any) {
      console.error("Error sending data to Supabase:", error.message)
      setIsLoading(false)
      setIsRegisteredSuccessfully(false)
    }
  }

  const handleSubmit = async () => {
    if (validateStep()) {
      await sendToSupabase(formData)
    }
  }

  const userFullName = `${formData.firstName} ${formData.lastName}`.trim()

  // Step configuration for wizard
  const steps = [
    { number: 1, title: "Personal Info", icon: User, description: "Basic details" },
    { number: 2, title: "Experience", icon: Briefcase, description: "Background info" },
    { number: 3, title: "Complete", icon: CheckCircle, description: "Final step" },
  ]

  // Animation classes
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
                            placeholder="Describe your relevant experience, roles, and expertise..."
                          />
                          {errors.experienceDetails && (
                            <p className="text-red-500 text-sm mt-1 animate-fade-in">{errors.experienceDetails}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Question */}
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-700 mb-4 block">
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
                      className="group bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
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

              {/* Step 3: Complete Registration */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  {isRegisteredSuccessfully ? (
                    <div className="text-center space-y-6 animate-fade-in">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                      </div>
                      <h2 className="text-4xl font-bold text-green-600 mb-4">Registration Successful!</h2>
                      <p className="text-xl text-gray-600 mb-6">Welcome to the Ustaz community, {userFullName}!</p>
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                        <p className="text-green-800 font-semibold mb-2">Your Registration Details:</p>
                        <p className="text-sm text-green-700">
                          User ID: <span className="font-mono bg-green-100 px-2 py-1 rounded">{userId}</span>
                        </p>
                        <p className="text-xs text-green-600 mt-2">Please save this ID for future reference.</p>
                      </div>
                      <Button><Link href={'/dashboard'}>Go to Dasboard</Link></Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3">
                          Almost Done!
                        </h2>
                        <p className="text-gray-600 text-lg">Complete your profile and finalize registration</p>
                      </div>

                      {/* Avatar Upload */}
                      <div className="flex flex-col items-center space-y-6">
                        <div className="relative group">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center overflow-hidden shadow-lg border-4 border-white">
                            {formData.avatarUrl ? (
                              <img
                                src={formData.avatarUrl || "/placeholder.svg"}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-16 h-16 text-orange-400" />
                            )}
                          </div>
                          <label className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full cursor-pointer shadow-lg transform hover:scale-110 transition-all duration-300">
                            <Upload className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, "avatar")}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-sm text-gray-500">Upload your profile picture (optional)</p>
                      </div>

                      {/* Terms and Conditions */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="agreedToTerms"
                            name="agreedToTerms"
                            checked={formData.agreedToTerms}
                            onChange={handleChange}
                            className="w-5 h-5 text-orange-500 border-2 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 mt-0.5"
                          />
                          <label htmlFor="agreedToTerms" className="text-sm text-gray-700 leading-relaxed">
                            I agree to the{" "}
                            <a href="#" className="text-orange-500 hover:text-orange-600 font-semibold hover:underline">
                              Terms & Conditions
                            </a>{" "}
                            and{" "}
                            <a href="#" className="text-orange-500 hover:text-orange-600 font-semibold hover:underline">
                              Privacy Policy
                            </a>{" "}
                            <span className="text-red-500">*</span>
                          </label>
                        </div>
                        {errors.agreedToTerms && (
                          <p className="text-red-500 text-sm animate-fade-in">{errors.agreedToTerms}</p>
                        )}

                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="wantsUpdates"
                            name="wantsUpdates"
                            checked={formData.wantsUpdates}
                            onChange={handleChange}
                            className="w-5 h-5 text-orange-500 border-2 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 mt-0.5"
                          />
                          <label htmlFor="wantsUpdates" className="text-sm text-gray-700 leading-relaxed">
                            I would like to receive updates and news from Ustaz{" "}
                            <span className="text-gray-400 font-medium">(Optional)</span>
                          </label>
                        </div>
                      </div>

                      {/* User ID Display */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">
                          Your User ID:{" "}
                          <span className="font-mono text-gray-800 bg-white px-2 py-1 rounded border">{userId}</span>
                        </p>
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-between pt-6">
                        <button
                          onClick={handleBack}
                          className="group bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center"
                        >
                          <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                          Back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={isLoading || !formData.agreedToTerms}
                          className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed transition-all duration-300 flex items-center"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              Complete Registration
                              <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform duration-300" />
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default App
