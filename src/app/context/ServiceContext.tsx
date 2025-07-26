  // context/ServiceContext.tsx
  'use client';

  import React, { createContext, useContext, useState } from 'react';

  interface ServiceContextType {
    address: string;
    service: string;
    lng: number;
    lat: number;
    setAddress: (value: string) => void;
    setService: (value: string) => void;
    setLat: (value: number) => void;
    setLng: (value: number) => void;
  }

  const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

  export const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
    const [address, setAddress] = useState('');
    const [service, setService] = useState('');
    const [lat, setLat] = useState<number>(0);
    const [lng, setLng] = useState<number>(0);

    return (
      <ServiceContext.Provider value={{ address, service, lat, lng, setAddress, setService, setLat, setLng }}>
        {children}
      </ServiceContext.Provider>
    );
  };

  export const useServiceContext = () => {
    const context = useContext(ServiceContext);
    if (!context) {
      throw new Error('useServiceContext must be used within a ServiceProvider');
    }
    return context;
  };
