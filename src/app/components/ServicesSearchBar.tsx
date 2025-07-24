'use client';

import { useEffect, useRef, useState } from 'react';
import { FaSearchLocation, FaMobileAlt } from 'react-icons/fa';
import { FaArrowRightLong } from 'react-icons/fa6';
import {
  MdElectricalServices,
  MdPlumbing,
  MdCarpenter,
  MdAcUnit,
  MdSolarPower,
} from 'react-icons/md';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const services = [
  { label: 'Electrician Service', value: 'electrician', icon: MdElectricalServices },
  { label: 'Plumbing Service', value: 'plumbing', icon: MdPlumbing },
  { label: 'Carpenter', value: 'carpenter', icon: MdCarpenter },
  { label: 'AC Maintenance', value: 'ac', icon: MdAcUnit },
  { label: 'Solar Technician', value: 'solar', icon: MdSolarPower },
];

declare global {
  interface Window {
    initMap: () => void;
  }
}

const ServiceSelector = () => {
  const [location, setLocation] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [mobileNotes, setMobileNotes] = useState('');
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadScript = () => {
      if (document.getElementById('google-maps')) return;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps';
      document.head.appendChild(script);
    };

    window.initMap = () => {
      if (
        window.google &&
        window.google.maps &&
        'PlaceAutocompleteElement' in window.google.maps.places &&
        autocompleteRef.current
      ) {
        const pac = new window.google.maps.places.PlaceAutocompleteElement({});

        pac.className = 'w-full border-0 bg-transparent outline-none text-sm text-black placeholder:text-gray-400';

        pac.addEventListener('gmp-placechange', (event: any) => {
          const place = event?.detail?.place;
          if (place && place.formattedAddress) {
            setLocation(place.formattedAddress);
          }
        });

        autocompleteRef.current.innerHTML = '';
        autocompleteRef.current.appendChild(pac);
      }
    };

    loadScript();
  }, []);

  const handleSubmit = () => {
    if (location && selectedService) {
      console.log(`Service: ${selectedService}, Location: ${location}, Notes: ${mobileNotes}`);
    } else {
      alert('Please enter your location and select a service.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-white text-black p-4 rounded-2xl shadow-md">
        {/* Location Input */}
          <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2 w-full border border-gray-200">
          <div
            ref={autocompleteRef}
            className="w-full  text-black [&>input]:bg-transparent [&>input]:outline-none [&>input]:text-sm [&>input]:w-full [&>input]:text-black [&>input]:placeholder:text-gray-400"
          />
        </div>

        {/* Service Select */}
        <div className="w-full">
          <Select onValueChange={setSelectedService}>
            <SelectTrigger className="w-full bg-gray-100 text-sm rounded-xl border border-gray-200">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.value} value={service.value}>
                  <div className="flex items-center gap-2">
                    <service.icon className="text-lg text-gray-700" />
                    {service.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button (Desktop Only) */}
        <button
          onClick={handleSubmit}
          className="hidden sm:flex items-center justify-center gap-2 bg-[#db541f] text-white px-5 py-2 text-sm rounded-xl hover:bg-[#db4b0de6] transition"
        >
          <span>Find</span>
          <FaArrowRightLong />
        </button>
      </div>

      {/* Mobile: Add Notes Button */}
      <div className="sm:hidden mt-4 text-right">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 text-[#db541f] border-[#db541f] w-full">
              <FaMobileAlt />
              Add Notes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Additional Notes</DialogTitle>
              <DialogDescription>
                Add any optional details for the technician.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="E.g. My AC is leaking water..."
              value={mobileNotes}
              onChange={(e) => setMobileNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleSubmit} className="bg-[#db541f] hover:bg-[#db4b0de6] text-white w-full">
              Submit
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ServiceSelector;
