"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button'; // Assuming you have this component
import { X, Cookie, Settings, Check, Ban } from 'lucide-react'; // Icons for UI
// Removed: import { useTranslations } from 'next-intl'; // Removed next-intl import

// Define types for cookie preferences
interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean; // For tracking user behavior (e.g., Google Analytics)
  marketing: boolean; // For personalized ads, social media pixels
}

// Default preferences: Essential are always on, others are off by default
const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

// Key for localStorage to store user's consent preferences
const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

interface CookieConsentProps {
  // Callback function to inform parent component (e.g., RootLayout) about consent changes
  onConsentChange: (preferences: CookiePreferences) => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onConsentChange }) => {
  // Removed: const t = useTranslations('cookieConsent');
  const [showBanner, setShowBanner] = useState(false); // Controls visibility of the main banner
  const [showPreferences, setShowPreferences] = useState(false); // Controls visibility of the preferences modal
  const [currentPreferences, setCurrentPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // On component mount, check localStorage for existing preferences
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent) {
      try {
        const preferences: CookiePreferences = JSON.parse(storedConsent);
        // Ensure essential is always true, even if somehow stored as false
        preferences.essential = true;
        setCurrentPreferences(preferences);
        onConsentChange(preferences); // Inform parent about existing consent
      } catch (e) {
        console.error("Error parsing stored cookie consent, resetting.", e);
        // If parsing fails, treat as no consent and show banner
        setShowBanner(true);
        onConsentChange(defaultPreferences);
      }
    } else {
      // If no consent found, show the banner after a short delay
      // to ensure all other components have rendered and avoid hydration issues.
      setTimeout(() => {
        setShowBanner(true);
      }, 500);
    }
  }, [onConsentChange]); // Dependency array includes onConsentChange to avoid lint warnings

  /**
   * Saves the provided preferences to localStorage and updates component state.
   * Calls the onConsentChange prop to inform the parent.
   * @param preferences The CookiePreferences object to save.
   */
  const savePreferences = (preferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    setCurrentPreferences(preferences);
    onConsentChange(preferences); // Inform parent component about the new preferences
    setShowBanner(false); // Hide the main banner
    setShowPreferences(false); // Hide the preferences modal
  };

  /**
   * Handles the "Accept All" button click.
   * Sets all non-essential categories to true and saves.
   */
  const handleAcceptAll = () => {
    const newPreferences = { ...defaultPreferences, analytics: true, marketing: true };
    savePreferences(newPreferences);
  };

  /**
   * Handles the "Reject All" button click.
   * Sets all non-essential categories to false and saves.
   */
  const handleRejectAll = () => {
    const newPreferences = { ...defaultPreferences, analytics: false, marketing: false };
    savePreferences(newPreferences);
  };

  /**
   * Handles the "Save Preferences" button click within the modal.
   * Saves the currently selected preferences.
   */
  const handleSavePreferences = () => {
    savePreferences(currentPreferences);
  };

  /**
   * Toggles the state of a specific cookie category (except essential).
   * @param category The category to toggle ('analytics' or 'marketing').
   */
  const togglePreference = (category: keyof CookiePreferences) => {
    if (category === 'essential') return; // Essential cookies cannot be toggled off
    setCurrentPreferences(prev => ({
      ...prev,
      [category]: !prev[category], // Toggle the boolean value
    }));
  };

  // If the banner should not be shown, return null to render nothing
  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl flex flex-col md:flex-row items-center justify-between p-6 space-y-4 md:space-y-0 md:space-x-6 border border-gray-200">
        <div className="flex items-center space-x-3">
          <Cookie className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">We value your privacy</h3>
            <p className="text-sm text-gray-600">
              We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
          <Button
            onClick={handleAcceptAll}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
          >
            Accept All
          </Button>
          <Button
            onClick={handleRejectAll}
            variant="outline"
            className="w-full sm:w-auto border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Reject All
          </Button>
          <Button
            onClick={() => setShowPreferences(true)}
            variant="ghost"
            className="w-full sm:w-auto text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Preferences
          </Button>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowPreferences(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Cookie Preferences</h3>

            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <h4 className="font-semibold text-gray-800">Essential Cookies</h4>
                  <p className="text-sm text-gray-600">Required for the website to function properly (e.g., login, security).</p>
                </div>
                <span className="text-green-600 font-semibold text-sm flex items-center">
                  <Check className="w-4 h-4 mr-1" /> Always Active
                </span>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <h4 className="font-semibold text-gray-800">Analytics Cookies</h4>
                  <p className="text-sm text-gray-600">Help us understand how visitors interact with the website (e.g., page views, traffic sources).</p>
                </div>
                <Button
                  onClick={() => togglePreference('analytics')}
                  variant={currentPreferences.analytics ? 'default' : 'outline'}
                  className={`px-4 py-2 rounded-lg font-semibold ${currentPreferences.analytics ? 'bg-green-500 hover:bg-green-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  {currentPreferences.analytics ? <Check className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                  {currentPreferences.analytics ? 'Active' : 'Inactive'}
                </Button>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <h4 className="font-semibold text-gray-800">Marketing Cookies</h4>
                  <p className="text-sm text-gray-600">Used to track visitors across websites to display relevant ads.</p>
                </div>
                <Button
                  onClick={() => togglePreference('marketing')}
                  variant={currentPreferences.marketing ? 'default' : 'outline'}
                  className={`px-4 py-2 rounded-lg font-semibold ${currentPreferences.marketing ? 'bg-green-500 hover:bg-green-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  {currentPreferences.marketing ? <Check className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                  {currentPreferences.marketing ? 'Active' : 'Inactive'}
                </Button>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <Button
                onClick={() => setShowPreferences(false)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePreferences}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
