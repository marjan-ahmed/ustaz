'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  WrenchScrewdriverIcon, 
  MapPinIcon, 
  CalendarIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { db } from '@/lib/supabase';
import { ServiceCategory, Location, ServiceRequest } from '@/lib/types';

const serviceRequestSchema = z.object({
  categoryId: z.string().min(1, 'Please select a service category'),
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  urgency: z.enum(['low', 'medium', 'high']),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 hour').max(24, 'Duration cannot exceed 24 hours'),
  budgetMin: z.number().min(100, 'Minimum budget must be at least ₨100'),
  budgetMax: z.number().min(100, 'Maximum budget must be at least ₨100'),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  address: z.string().min(1, 'Please enter your address'),
  city: z.string().min(1, 'Please enter your city'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contactPhone: z.string().min(1, 'Please enter your contact phone'),
  specialInstructions: z.string().optional()
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

interface ServiceRequestFormProps {
  selectedProvider?: any;
  onSuccess?: (request: ServiceRequest) => void;
  onCancel?: () => void;
}

export default function ServiceRequestForm({ selectedProvider, onSuccess, onCancel }: ServiceRequestFormProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      urgency: 'medium',
      estimatedDuration: 2,
      budgetMin: 500,
      budgetMax: 2000
    }
  });

  const watchedBudgetMin = watch('budgetMin');
  const watchedBudgetMax = watch('buddownMax');

  useEffect(() => {
    loadCategories();
    if (selectedProvider) {
      setValue('categoryId', selectedProvider.categories[0]?.id || '');
    }
  }, [selectedProvider]);

  const loadCategories = async () => {
    try {
      const { data, error } = await db.supabase
        .from('service_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setValue('address', location.address);
    setValue('city', location.city);
    setValue('latitude', location.latitude);
    setValue('longitude', location.longitude);
    setIsLocationPickerOpen(false);
  };

  const onSubmit = async (data: ServiceRequestFormData) => {
    setIsLoading(true);
    try {
      // Create service request
      const requestData = {
        ...data,
        customerId: '', // Will be set by the backend
        providerId: selectedProvider?.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const request = await db.createServiceRequest(requestData);
      
      // Show success message
      reset();
      if (onSuccess) {
        onSuccess(request);
      }
    } catch (error) {
      console.error('Error creating service request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Service Request Form</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedProvider 
              ? `Requesting service from ${selectedProvider.businessName}`
              : 'Submit a new service request'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Service Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Category *
            </label>
            <select
              {...register('categoryId')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.categoryId ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={!!selectedProvider}
            >
              <option value="">Select a service category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Title and Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Title *
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g., Fix leaking kitchen faucet"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <label
                    key={level}
                    className={`flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors ${
                      watch('urgency') === level
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('urgency')}
                      value={level}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Please describe the service you need in detail..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Duration and Budget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (hours) *
              </label>
              <input
                type="number"
                {...register('estimatedDuration', { valueAsNumber: true })}
                min="1"
                max="24"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.estimatedDuration ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.estimatedDuration && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedDuration.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range (₨) *
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  {...register('budgetMin', { valueAsNumber: true })}
                  placeholder="Min"
                  min="100"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.budgetMin ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <input
                  type="number"
                  {...register('buddownMax', { valueAsNumber: true })}
                  placeholder="Max"
                  min="100"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.budgetMax ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.budgetMin && (
                <p className="mt-1 text-sm text-red-600">{errors.budgetMin.message}</p>
              )}
              {errors.budgetMax && (
                <p className="mt-1 text-sm text-red-600">{errors.budgetMax.message}</p>
              )}
              {watchedBudgetMin && watchedBudgetMax && watchedBudgetMin > watchedBudgetMax && (
                <p className="mt-1 text-sm text-red-600">Maximum budget must be greater than minimum budget</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduling
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  {...register('scheduledDate')}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="time"
                  {...register('scheduledTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Location *
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <input
                  type="text"
                  {...register('address')}
                  placeholder="Street address"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <input
                  type="text"
                  {...register('city')}
                  placeholder="City"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              
              <button
                type="button"
                onClick={() => setIsLocationPickerOpen(true)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                Use Map to Set Location
              </button>

              {selectedLocation && (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800">
                    Location set: {selectedLocation.address}, {selectedLocation.city}
                  </span>
                </div>
              )}
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone *
            </label>
            <input
              type="tel"
              {...register('contactPhone')}
              placeholder="+92 300 1234567"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.contactPhone ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.contactPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>
            )}
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              {...register('specialInstructions')}
              rows={3}
              placeholder="Any additional information, preferences, or special requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Location Picker Modal */}
      {isLocationPickerOpen && (
        <LocationPickerModal
          onLocationSelect={handleLocationSelect}
          onClose={() => setIsLocationPickerOpen(false)}
        />
      )}
    </div>
  );
}

// Simple Location Picker Modal (you can enhance this with actual map integration)
function LocationPickerModal({ onLocationSelect, onClose }: { 
  onLocationSelect: (location: Location) => void; 
  onClose: () => void; 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);

  const handleSearch = async () => {
    // Mock search results - replace with actual geocoding API
    const mockResults: Location[] = [
      {
        latitude: 33.6844,
        longitude: 73.0479,
        address: "123 Main Street, Gulberg III",
        city: "Islamabad",
        country: "Pakistan"
      },
      {
        latitude: 33.6844,
        longitude: 73.0479,
        address: "456 Blue Area, Jinnah Avenue",
        city: "Islamabad",
        country: "Pakistan"
      }
    ];
    setSearchResults(mockResults);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Select Service Location
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Search for address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={handleSearch}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Search
                  </button>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => onLocationSelect(result)}
                          className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="font-medium">{result.address}</div>
                          <div className="text-sm text-gray-600">{result.city}, {result.country}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}