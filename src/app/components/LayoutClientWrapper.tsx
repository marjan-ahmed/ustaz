"use client"; // This directive makes it a Client Component

import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { CookieConsent } from './CookieConsent'; // Import the CookieConsent component

// Define the shape of cookie preferences
interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface LayoutClientWrapperProps {
  children: React.ReactNode;
}

export default function LayoutClientWrapper({ children }: LayoutClientWrapperProps) {
  // State to hold user's cookie preferences. This state is managed here.
  const [cookiePreferences, setCookiePreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  // Callback to update preferences when user makes a choice in the CookieConsent component.
  // This is where you'd conditionally load/initialize your analytics/marketing scripts.
  // Use useCallback to memoize this function, preventing unnecessary re-renders of CookieConsent
  // and breaking the infinite loop.
  const handleConsentChange = useCallback((preferences: CookiePreferences) => {
    setCookiePreferences(preferences);
    console.log("Cookie preferences updated:", preferences);

    // --- Conditional Script Loading Logic ---
    // This is a conceptual example. In a real app, you'd load external scripts here.

    // Example for Analytics:
    if (preferences.analytics) {
      // Load Google Analytics, Mixpanel, etc.
      console.log("Analytics cookies accepted. Initializing analytics scripts...");
      // Make sure this is only loaded once and correctly handles re-consent.
      // if (typeof window !== 'undefined' && !window.GA_INITIALIZED) {
      //   const script = document.createElement('script');
      //   script.src = `https://www.googletagmanager.com/gtag/js?id=YOUR_GA_MEASUREMENT_ID`;
      //   script.async = true;
      //   document.head.appendChild(script);
      //   script.onload = () => {
      //     window.dataLayer = window.dataLayer || [];
      //     function gtag(){dataLayer.push(arguments);}
      //     gtag('js', new Date());
      //     gtag('config', 'YOUR_GA_MEASUREMENT_ID');
      //     window.GA_INITIALIZED = true; // Prevent re-initialization
      //   };
      // }
    } else {
      console.log("Analytics cookies rejected. Ensuring analytics scripts are not loaded or disabled.");
      // If analytics was previously loaded, you might need to disable or clear its data.
      // E.g., for Google Analytics, you might send a 'consent' command to deny analytics storage.
    }

    // Example for Marketing:
    if (preferences.marketing) {
      // Load marketing scripts (e.g., Facebook Pixel, AdSense)
      console.log("Marketing cookies accepted. Initializing marketing scripts...");
    } else {
      console.log("Marketing cookies rejected. Ensuring marketing scripts are not loaded or disabled.");
    }
    // --- End Conditional Script Loading Logic ---
  }, [setCookiePreferences]); // setCookiePreferences is a stable reference from useState, but explicitly including it is good practice.

  return (
    <>
      {children}
      {/* Render the CookieConsent component here, it will manage its own state */}
      <CookieConsent onConsentChange={handleConsentChange} />
    </>
  );
}
