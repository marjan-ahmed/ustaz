'use client'
import React, { useState, useEffect, CSSProperties } from 'react';
import { supabase } from '../../../client/supabaseClient';

// Define TypeScript Interfaces
interface IFormData {
  firstName: string;
  lastName: string;
  email: string;
  cnic: string;
  cnicFrontImage: File | null;
  cnicFrontImageUrl: string;
  cnicBackImage: File | null;
  cnicBackImageUrl: string;
  country: string;
  city: string;
  phoneCountryCode: string;
  phoneNumber: string;
  heardFrom: string; // Now a dropdown value
  hasExperience: boolean | null;
  experienceYears: string;
  experienceDetails: string;
  hasActiveMobile: boolean | null;
  avatar: File | null;
  avatarUrl: string;
  // New fields for CNIC verification in Step 3
  verifiedFullName: string;
  verifiedCnic: string;
  verifiedDob: string; // Date of Birth for verification
}

interface ICountry {
  name: {
    common: string;
  };
  idd: {
    root: string;
    suffixes?: string[];
  };
  capital?: string[];
}

// Declare Tesseract.js worker creation (simulation)
// In a real app, you'd import it: import { createWorker } from 'tesseract.js';
declare const createWorker: any; // Still declared for conceptual understanding

function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<IFormData>({
    firstName: '',
    lastName: '',
    email: '',
    cnic: '',
    cnicFrontImage: null,
    cnicFrontImageUrl: '',
    cnicBackImage: null,
    cnicBackImageUrl: '',
    country: 'Pakistan', // Default country
    city: '',
    phoneCountryCode: '+92', // Default for Pakistan
    phoneNumber: '',
    heardFrom: '',
    hasExperience: null,
    experienceYears: '',
    experienceDetails: '',
    hasActiveMobile: null,
    avatar: null,
    avatarUrl: '',
    verifiedFullName: '', // New field
    verifiedCnic: '',     // New field
    verifiedDob: '',      // New field
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>(crypto.randomUUID());
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [slideDirection, setSlideDirection] = useState<'next' | 'back' | null>(null); // New state for slide direction
  const [cnicVerificationError, setCnicVerificationError] = useState<string | null>(null); // New state for CNIC verification error

  // Custom color for Tailwind CSS
  const primaryColor = '#db4b0d'; // Orange/Red shade

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,capital');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ICountry[] = await response.json();
        data.sort((a, b) => a.name.common.localeCompare(b.name.common));
        setCountries(data);

        const pakistan = data.find(c => c.name.common === 'Pakistan');
        if (pakistan && pakistan.idd.root) {
          setFormData(prev => ({
            ...prev,
            phoneCountryCode: `${pakistan.idd.root}${pakistan.idd.suffixes?.[0] || ''}`
          }));
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        setCountries([
          { name: { common: 'Pakistan' }, idd: { root: '+92' } },
          { name: { common: 'United States' }, idd: { root: '+1' } },
          { name: { common: 'United Kingdom' }, idd: { root: '+44' } },
          { name: { common: 'Canada' }, idd: { root: '+1' } },
          { name: { common: 'Australia' }, idd: { root: '+61' } },
        ]);
      }
    };
    fetchCountries();
  }, []);

  // Expanded simulated city data
  const citiesByCountry: Record<string, string[]> = {
    'Pakistan': ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Hyderabad'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
    'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Leeds', 'Edinburgh', 'Leicester'],
    'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Halifax'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Hobart'],
  };

  // Social media platforms for dropdown
  const socialMediaPlatforms = [
    'Facebook', 'Instagram', 'Twitter (X)', 'LinkedIn', 'YouTube',
    'TikTok', 'Snapchat', 'Pinterest', 'Reddit', 'WhatsApp', 'Other'
  ];

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;

    if (type === 'radio') {
      newValue = (e.target as HTMLInputElement).value === 'yes';
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Clear CNIC verification error if any related field changes
    if (['verifiedFullName', 'verifiedCnic', 'verifiedDob'].includes(name)) {
      setCnicVerificationError(null);
    }
  };

  // Handle file uploads (CNIC and Avatar)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'cnicFrontImage' | 'cnicBackImage' | 'avatar') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: file,
          [`${fieldName}Url`]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: null,
        [`${fieldName}Url`]: '',
      }));
    }
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Validation function for each step
  const validateStep = (): boolean => {
    let newErrors: Record<string, string> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required.';
        isValid = false;
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required.';
        isValid = false;
      }
      if (!formData.cnic.trim()) {
        newErrors.cnic = 'CNIC number is required.';
        isValid = false;
      } else if (!formData.cnic.startsWith('42201')) {
        newErrors.cnic = 'CNIC must start with 42201.';
        isValid = false;
      } else if (!/^\d{13}$/.test(formData.cnic)) {
        newErrors.cnic = 'CNIC must be 13 digits (e.g., 4220112345678).';
        isValid = false;
      }
      if (!formData.cnicFrontImage) {
        newErrors.cnicFrontImage = 'CNIC front side image is required.';
        isValid = false;
      }
      if (!formData.cnicBackImage) {
        newErrors.cnicBackImage = 'CNIC back side image is required.';
        isValid = false;
      }
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone number is required.';
        isValid = false;
      } else if (!/^\d{7,}$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number (digits only).';
        isValid = false;
      }
      if (!formData.country.trim()) {
        newErrors.country = 'Country is required.';
        isValid = false;
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required.';
        isValid = false;
      }
    } else if (currentStep === 2) {
      if (!formData.heardFrom.trim()) {
        newErrors.heardFrom = 'This question is required.';
        isValid = false;
      }
      if (formData.hasExperience === null) {
        newErrors.hasExperience = 'Please select an option.';
        isValid = false;
      } else if (formData.hasExperience) {
        if (!formData.experienceYears.trim()) {
          newErrors.experienceYears = 'Years of experience is required.';
          isValid = false;
        } else if (isNaN(parseInt(formData.experienceYears)) || parseInt(formData.experienceYears) <= 0) {
          newErrors.experienceYears = 'Please enter a valid number of years.';
          isValid = false;
        }
        if (!formData.experienceDetails.trim()) {
          newErrors.experienceDetails = 'Experience details are required.';
          isValid = false;
        }
      }
      if (formData.hasActiveMobile === null) {
        newErrors.hasActiveMobile = 'Please select an option.';
        isValid = false;
      }
    } else if (currentStep === 3) {
        // CNIC verification fields validation
        if (!formData.verifiedFullName.trim()) {
            newErrors.verifiedFullName = 'Full Name for verification is required.';
            isValid = false;
        }
        if (!formData.verifiedCnic.trim()) {
            newErrors.verifiedCnic = 'CNIC Number for verification is required.';
            isValid = false;
        } else if (!/^\d{13}$/.test(formData.verifiedCnic)) {
            newErrors.verifiedCnic = 'CNIC for verification must be 13 digits.';
            isValid = false;
        }
        if (!formData.verifiedDob.trim()) {
            newErrors.verifiedDob = 'Date of Birth for verification is required.';
            isValid = false;
        }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle "Next" button click with animation
  const handleNext = () => {
    if (validateStep()) {
      setSlideDirection('next'); // Set slide direction to 'next'
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTransitioning(false);
        setSlideDirection(null); // Reset slide direction after transition
        // Pre-fill verification fields in Step 3
        if (currentStep === 2) {
            setFormData(prev => ({
                ...prev,
                verifiedFullName: `${prev.firstName} ${prev.lastName}`.trim(),
                verifiedCnic: prev.cnic,
                // verifiedDob: '', // DOB is new, so leave it blank for user to input
            }));
        }
      }, 500); // Animation duration
    }
  };

  // Handle "Back" button click with animation
  const handleBack = () => {
    setSlideDirection('back'); // Set slide direction to 'back'
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setIsTransitioning(false);
      setSlideDirection(null); // Reset slide direction after transition
    }, 500); // Animation duration
  };

  // Simulate Tesseract.js OCR and CNIC verification
  const handleCnicVerification = async () => {
    setCnicVerificationError(null); // Clear previous errors
    if (!formData.cnicFrontImage || !formData.cnicBackImage) {
      setCnicVerificationError("Please upload both CNIC front and back images in Step 1 for verification.");
      return;
    }

    if (!validateStep()) { // Validate manually entered verification fields
        return;
    }

    setIsLoading(true);
    console.log("Simulating Tesseract.js OCR and CNIC verification...");

    // Simulate a delay for OCR processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock extracted data for demonstration.
    // This data would ideally come from actual OCR of uploaded images.
    // We'll introduce a slight discrepancy to show mismatch scenarios.
    const actualCnicFromImage = formData.cnic; // Assume this is extracted accurately
    const actualFullNameFromImage = `${formData.firstName} ${formData.lastName}`.trim().toLowerCase();
    const actualDobFromImage = "1990-01-15"; // Hardcoded for simulation, would be extracted

    // Introduce a potential mismatch for demonstration
    let mockExtractedCnic = actualCnicFromImage;
    let mockExtractedFullName = actualFullNameFromImage;
    let mockExtractedDob = actualDobFromImage;

    // Example of a simulated mismatch: if user's CNIC ends with '1', simulate a mismatch
    if (formData.cnic.endsWith('1')) {
      mockExtractedCnic = formData.cnic.slice(0, -1) + '0'; // Change last digit
      mockExtractedFullName = "mismatch name"; // Simulate name mismatch
    }

    // Compare user-entered verification data with mock extracted data
    const enteredFullName = formData.verifiedFullName.trim().toLowerCase();
    const enteredCnic = formData.verifiedCnic.trim();
    const enteredDob = formData.verifiedDob.trim();

    let matchError = false;
    if (enteredFullName !== mockExtractedFullName) {
      setCnicVerificationError("Full Name does not match the extracted details from CNIC.");
      matchError = true;
    } else if (enteredCnic !== mockExtractedCnic) {
      setCnicVerificationError("CNIC Number does not match the extracted details from CNIC.");
      matchError = true;
    } else if (enteredDob !== mockExtractedDob) { // Simple string comparison for DOB
      setCnicVerificationError("Date of Birth does not match the extracted details from CNIC.");
      matchError = true;
    }

    setIsLoading(false);

    if (!matchError) {
      console.log("CNIC details successfully verified (simulated).");
      setCnicVerificationError("CNIC details verified successfully!");
      // No automatic submission here, user clicks "Submit Registration"
    }
  };


  // Send data to Supabase
  const sendToSupabase = async (data: IFormData) => {
    setIsLoading(true);
    console.log("Attempting to send data to Supabase:", data);

    try {
      const dataToSave = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        cnic: data.cnic,
        cnicFrontImageUrl: data.cnicFrontImageUrl,
        cnicBackImageUrl: data.cnicBackImageUrl,
        country: data.country,
        city: data.city,
        phoneCountryCode: data.phoneCountryCode,
        phoneNumber: data.phoneNumber,
        heardFrom: data.heardFrom,
        hasExperience: data.hasExperience,
        experienceYears: data.hasExperience && data.experienceYears.trim() !== '' ? parseInt(data.experienceYears) : null,
        experienceDetails: data.experienceDetails || null,
        hasActiveMobile: data.hasActiveMobile,
        avatarUrl: data.avatarUrl || null,
        registrationDate: new Date().toISOString(),
        userId: userId,
        // Save verification details as well
        verifiedFullName: data.verifiedFullName,
        verifiedCnic: data.verifiedCnic,
        verifiedDob: data.verifiedDob,
      };

      const { data: supabaseData, error } = await supabase
        .from('ustaz_registrations')
        .insert([dataToSave]);

      if (error) {
        throw error;
      }

      console.log("Data successfully sent to Supabase:", supabaseData);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error sending data to Supabase:", error.message);
      setIsLoading(false);
    }
  };

  // Handle "Submit" button click
  const handleSubmit = async () => {
    // Before final submission, ensure CNIC verification is done and successful
    if (cnicVerificationError !== "CNIC details verified successfully!") {
        setCnicVerificationError("Please verify your CNIC details first.");
        return;
    }
    await sendToSupabase(formData);
  };

  const userFullName = `${formData.firstName} ${formData.lastName}`.trim();

  // Dynamic styles for the primary color
  const buttonStyle: CSSProperties = {
    backgroundColor: primaryColor,
    color: 'white', // Ensure text is white for contrast
  };
  const focusRingStyle: CSSProperties = {
    '--tw-ring-color': primaryColor,
  } as CSSProperties;

  // Determine the animation class based on transition state and direction
  const animationClass = isTransitioning
    ? slideDirection === 'next'
      ? 'opacity-0 translate-x-1/4' // Slide out to right and fade
      : 'opacity-0 -translate-x-1/4' // Slide out to left and fade (for 'back')
    : 'opacity-100 translate-x-0'; // Slide in and fully visible

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4 font-inter">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-2xl transform transition-all duration-500 ease-in-out scale-100 opacity-100 hover:shadow-3xl">
        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
                  currentStep >= step ? 'bg-[' + primaryColor + ']' : 'bg-gray-300'
                }`}
                style={currentStep >= step ? { backgroundColor: primaryColor } : {}}
              >
                {step}
              </div>
              <span
                className={`mt-2 text-sm font-medium ${
                  currentStep >= step ? 'text-[' + primaryColor + ']' : 'text-gray-500'
                }`}
                style={currentStep >= step ? { color: primaryColor } : {}}
              >
                {step === 1 && 'Personal'}
                {step === 2 && 'Questions'}
                {step === 3 && 'Greeting & Verify'}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content with Transition */}
        <div
          className={`transition-opacity transition-transform duration-500 ease-in-out ${animationClass}`}
        >
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
                Tell Us About Yourself
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                    style={errors.firstName ? {} : focusRingStyle}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                    style={errors.lastName ? {} : focusRingStyle}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out"
                  style={focusRingStyle}
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label htmlFor="cnic" className="block text-sm font-medium text-gray-700 mb-1">
                  CNIC Number <span className="text-red-500">*</span> (e.g., 4220112345678)
                </label>
                <input
                  type="text"
                  id="cnic"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.cnic ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                  style={errors.cnic ? {} : focusRingStyle}
                  placeholder="4220112345678"
                  maxLength={13}
                />
                {errors.cnic && <p className="text-red-500 text-xs mt-1">{errors.cnic}</p>}
              </div>

              <div>
                <label htmlFor="cnicFrontImage" className="block text-sm font-medium text-gray-700 mb-1">
                  CNIC Front Side <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="cnicFrontImage"
                  name="cnicFrontImage"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'cnicFrontImage')}
                  className={`w-full px-4 py-2 border ${errors.cnicFrontImage ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-['${primaryColor}'] file:bg-opacity-10 file:text-['${primaryColor}'] hover:file:bg-opacity-20`}
                  style={errors.cnicFrontImage ? {} : focusRingStyle}
                />
                {formData.cnicFrontImageUrl && (
                  <img
                    src={formData.cnicFrontImageUrl}
                    alt="CNIC Front Preview"
                    className="mt-4 rounded-lg shadow-md max-h-48 object-contain"
                  />
                )}
                {errors.cnicFrontImage && <p className="text-red-500 text-xs mt-1">{errors.cnicFrontImage}</p>}
              </div>

              <div>
                <label htmlFor="cnicBackImage" className="block text-sm font-medium text-gray-700 mb-1">
                  CNIC Back Side <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="cnicBackImage"
                  name="cnicBackImage"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'cnicBackImage')}
                  className={`w-full px-4 py-2 border ${errors.cnicBackImage ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-['${primaryColor}'] file:bg-opacity-10 file:text-['${primaryColor}'] hover:file:bg-opacity-20`}
                  style={errors.cnicBackImage ? {} : focusRingStyle}
                />
                {formData.cnicBackImageUrl && (
                  <img
                    src={formData.cnicBackImageUrl}
                    alt="CNIC Back Preview"
                    className="mt-4 rounded-lg shadow-md max-h-48 object-contain"
                  />
                )}
                {errors.cnicBackImage && <p className="text-red-500 text-xs mt-1">{errors.cnicBackImage}</p>}
              </div>

              {/* Address Section */}
              <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Address</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={(e) => {
                        handleChange(e);
                        const selectedCountry = countries.find(c => c.name.common === e.target.value);
                        if (selectedCountry && selectedCountry.idd.root) {
                          setFormData((prev) => ({
                            ...prev,
                            phoneCountryCode: `${selectedCountry.idd.root}${selectedCountry.idd.suffixes?.[0] || ''}`,
                            city: '',
                          }));
                        } else {
                          setFormData((prev) => ({ ...prev, phoneCountryCode: '', city: '' }));
                        }
                      }}
                      className={`w-full px-4 py-2 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                      style={errors.country ? {} : focusRingStyle}
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country.name.common} value={country.name.common}>
                          {country.name.common}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                      style={errors.city ? {} : focusRingStyle}
                      disabled={!formData.country || !citiesByCountry[formData.country]}
                    >
                      <option value="">Select City</option>
                      {formData.country &&
                        citiesByCountry[formData.country]?.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                    </select>
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    {formData.phoneCountryCode}
                  </span>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`flex-1 px-4 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-r-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                    style={errors.phoneNumber ? {} : focusRingStyle}
                    placeholder="3001234567"
                  />
                </div>
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleNext}
                  className="font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={buttonStyle}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Quick Questions */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
                A Few Quick Questions
              </h2>

              <div>
                <label htmlFor="heardFrom" className="block text-sm font-medium text-gray-700 mb-1">
                  Where did you hear about us? <span className="text-red-500">*</span>
                </label>
                {/* Styled Select (mimicking Shadcn/UI) */}
                <div className="relative">
                  <select
                    id="heardFrom"
                    name="heardFrom"
                    value={formData.heardFrom}
                    onChange={handleChange}
                    className={`block w-full px-4 py-2 border ${errors.heardFrom ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] sm:text-sm appearance-none pr-8`}
                    style={errors.heardFrom ? {} : focusRingStyle}
                  >
                    <option value="">Select an option</option>
                    {socialMediaPlatforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                {errors.heardFrom && <p className="text-red-500 text-xs mt-1">{errors.heardFrom}</p>}
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Do you have prior experience as an Ustaz/Service Provider?{' '}
                  <span className="text-red-500">*</span>
                </span>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="hasExperience"
                      value="yes"
                      checked={formData.hasExperience === true}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-['${primaryColor}'] focus:ring-['${primaryColor}']"
                      style={{ color: primaryColor }}
                    />
                    <span className="ml-2 text-gray-700">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="hasExperience"
                      value="no"
                      checked={formData.hasExperience === false}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-['${primaryColor}'] focus:ring-['${primaryColor}']"
                      style={{ color: primaryColor }}
                    />
                    <span className="ml-2 text-gray-700">No</span>
                  </label>
                </div>
                {errors.hasExperience && <p className="text-red-500 text-xs mt-1">{errors.hasExperience}</p>}

                {formData.hasExperience && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-1">
                        How many years of experience? <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="experienceYears"
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${errors.experienceYears ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                        style={errors.experienceYears ? {} : focusRingStyle}
                        placeholder="e.g., 5"
                        min="0"
                      />
                      {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears}</p>}
                    </div>
                    <div>
                      <label htmlFor="experienceDetails" className="block text-sm font-medium text-gray-700 mb-1">
                        Please provide details of your experience: <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="experienceDetails"
                        name="experienceDetails"
                        rows={4}
                        value={formData.experienceDetails}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${errors.experienceDetails ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                        style={errors.experienceDetails ? {} : focusRingStyle}
                        placeholder="Describe your relevant experience, roles, and expertise."
                      ></textarea>
                      {errors.experienceDetails && <p className="text-red-500 text-xs mt-1">{errors.experienceDetails}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Do you have an active mobile for calling? <span className="text-red-500">*</span>
                </span>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="hasActiveMobile"
                      value="yes"
                      checked={formData.hasActiveMobile === true}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-['${primaryColor}'] focus:ring-['${primaryColor}']"
                      style={{ color: primaryColor }}
                    />
                    <span className="ml-2 text-gray-700">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="hasActiveMobile"
                      value="no"
                      checked={formData.hasActiveMobile === false}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-['${primaryColor}'] focus:ring-['${primaryColor}']"
                      style={{ color: primaryColor }}
                    />
                    <span className="ml-2 text-gray-700">No</span>
                  </label>
                </div>
                {errors.hasActiveMobile && <p className="text-red-500 text-xs mt-1">{errors.hasActiveMobile}</p>}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={handleBack}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={buttonStyle}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Greeting and CNIC Verification */}
          {currentStep === 3 && (
            <div className="space-y-8 text-center">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                Welcome, {userFullName || 'Future Ustaz'}!
              </h2>
              <p className="text-lg text-gray-600">
                We're excited to have you join our community of service providers.
              </p>

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shadow-lg border-4 border-['${primaryColor}']" style={{ borderColor: primaryColor }}>
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-20 h-20 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Your Avatar (Optional)
                  </label>
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-['${primaryColor}'] file:bg-opacity-10 file:text-['${primaryColor}'] hover:file:bg-opacity-20"
                    style={focusRingStyle}
                  />
                </div>
              </div>

              {/* CNIC Verification Section */}
              <div className="space-y-4 border p-6 rounded-lg bg-red-50 border-red-200 text-left">
                <h3 className="text-xl font-bold text-red-800 text-center mb-4">
                  CNIC Details Verification
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Please confirm your details to match your CNIC pictures.
                </p>

                <div>
                  <label htmlFor="verifiedFullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (as on CNIC) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="verifiedFullName"
                    name="verifiedFullName"
                    value={formData.verifiedFullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.verifiedFullName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                    style={errors.verifiedFullName ? {} : focusRingStyle}
                    placeholder="John Doe"
                  />
                  {errors.verifiedFullName && <p className="text-red-500 text-xs mt-1">{errors.verifiedFullName}</p>}
                </div>

                <div>
                  <label htmlFor="verifiedCnic" className="block text-sm font-medium text-gray-700 mb-1">
                    CNIC Number (as on CNIC) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="verifiedCnic"
                    name="verifiedCnic"
                    value={formData.verifiedCnic}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.verifiedCnic ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                    style={errors.verifiedCnic ? {} : focusRingStyle}
                    placeholder="4220112345678"
                    maxLength={13}
                  />
                  {errors.verifiedCnic && <p className="text-red-500 text-xs mt-1">{errors.verifiedCnic}</p>}
                </div>

                <div>
                  <label htmlFor="verifiedDob" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth (YYYY-MM-DD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="verifiedDob"
                    name="verifiedDob"
                    value={formData.verifiedDob}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.verifiedDob ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-['${primaryColor}'] focus:border-['${primaryColor}'] transition duration-150 ease-in-out`}
                    style={errors.verifiedDob ? {} : focusRingStyle}
                  />
                  {errors.verifiedDob && <p className="text-red-500 text-xs mt-1">{errors.verifiedDob}</p>}
                </div>

                <button
                  onClick={handleCnicVerification}
                  disabled={isLoading}
                  className="w-full font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 mt-4"
                  style={buttonStyle}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      Verifying...
                    </div>
                  ) : (
                    'Verify CNIC Details'
                  )}
                </button>
                {cnicVerificationError && (
                  <p className={`text-sm mt-2 ${cnicVerificationError.includes("successfully") ? 'text-green-600' : 'text-red-500'}`}>
                    {cnicVerificationError}
                  </p>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={handleBack}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || cnicVerificationError !== "CNIC details verified successfully!"}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              {userId && (
                <p className="text-sm text-gray-500 mt-4">
                  Your User ID: <span className="font-mono text-gray-700 break-all">{userId}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
