'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  FunnelIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { db } from '@/lib/supabase';
import { ServiceCategory, ServiceProvider, Location } from '@/lib/types';

interface ServiceFinderProps {
  onProviderSelect?: (provider: ServiceProvider) => void;
}

export default function ServiceFinder({ onProviderSelect }: ServiceFinderProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    rating: 0,
    onlineOnly: false,
    verifiedOnly: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProviders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [providers, selectedCategory, searchQuery, filters, location]);

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

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const data = await db.getServiceProviders({
        isOnline: filters.onlineOnly,
        categoryId: selectedCategory
      });
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...providers];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(provider => 
        provider.categories.some(cat => cat.id === selectedCategory)
      );
    }

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(provider =>
        provider.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Price range filter
    filtered = filtered.filter(provider =>
      provider.hourlyRate >= filters.priceRange[0] && 
      provider.hourlyRate <= filters.priceRange[1]
    );

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(provider => provider.rating >= filters.rating);
    }

    // Online status filter
    if (filters.onlineOnly) {
      filtered = filtered.filter(provider => provider.isOnline);
    }

    // Verification filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter(provider => provider.verificationStatus === 'verified');
    }

    // Location-based sorting (if location is available)
    if (location) {
      filtered.sort((a, b) => {
        const distanceA = calculateDistance(location, a.location);
        const distanceB = calculateDistance(location, b.location);
        return distanceA - distanceB;
      });
    }

    setFilteredProviders(filtered);
  };

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLocationSelect = (selectedLocation: Location) => {
    setLocation(selectedLocation);
  };

  const handleProviderSelect = (provider: ServiceProvider) => {
    if (onProviderSelect) {
      onProviderSelect(provider);
    }
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setLocation(null);
    setFilters({
      priceRange: [0, 10000],
      rating: 0,
      onlineOnly: false,
      verifiedOnly: true
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Service Providers</h1>
        <p className="mt-2 text-gray-600">
          Connect with verified professionals in your area
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for services, skills, or providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Select */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filters Toggle */}
          <div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (₨/hr)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange[0]}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], parseInt(e.target.value) || 10000] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              {/* Online Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.onlineOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, onlineOnly: e.target.checked }))}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Online Only
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.verifiedOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Verified Only
                  </label>
                </div>
              </div>

              {/* Reset Filters */}
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProviders.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Found {filteredProviders.length} service providers
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select className="text-sm border border-gray-300 rounded px-2 py-1">
                  <option>Relevance</option>
                  <option>Rating</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Distance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onSelect={() => handleProviderSelect(provider)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No providers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProviderCardProps {
  provider: ServiceProvider;
  onSelect: () => void;
}

function ProviderCard({ provider, onSelect }: ProviderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {provider.businessName}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <StarIcon className="h-4 w-4 text-yellow-400" />
              <span>{provider.rating.toFixed(1)}</span>
              <span>•</span>
              <span>{provider.totalJobs} jobs</span>
              {provider.isOnline && (
                <>
                  <span>•</span>
                  <span className="text-green-600 font-medium">Online</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {provider.verificationStatus === 'verified' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {provider.description}
        </p>

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {provider.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {skill}
              </span>
            ))}
            {provider.skills.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{provider.skills.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Rate and Location */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            <span className="font-medium">₨{provider.hourlyRate}/hr</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>{provider.location?.city || 'Location not set'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={onSelect}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Book Now
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Expandable Details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 text-center"
        >
          {isExpanded ? 'Show less' : 'Show more details'}
        </button>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Experience:</span>
                <span className="ml-2 font-medium">{provider.totalJobs} completed jobs</span>
              </div>
              <div>
                <span className="text-gray-600">Total Earnings:</span>
                <span className="ml-2 font-medium">₨{provider.totalEarnings.toLocaleString()}</span>
              </div>
            </div>
            
            {provider.availability && (
              <div>
                <span className="text-gray-600 text-sm">Working Hours:</span>
                <div className="mt-1 text-sm">
                  {provider.availability.workingHours.start} - {provider.availability.workingHours.end}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}