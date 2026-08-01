'use client'
import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useServiceContext } from '../context/ServiceContext';

function Services() {
  const locale = useLocale()
  const t = useTranslations("section");
  const router = useRouter();
  const { setService } = useServiceContext();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const services = [
    {
      title: t('elecTitle'),
      description: t('electDesc'),
      image: 'https://plus.unsplash.com/premium_photo-1661911309991-cc81afcce97d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZWxlY3RyaWNpYW58ZW58MHx8MHx8fDA%3D',
      serviceValue: 'Electrician',
    },
    {
      title: t('plumbTitle'),
      description: t('plumbDesc'),
      image: 'https://plus.unsplash.com/premium_photo-1664298589198-b15ff5382648?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGx1bWJlcnxlbnwwfHwwfHx8MA%3D%3D',
      serviceValue: 'Plumbing',
    },
    {
      title: t('carpTitle'),
      description: t('carpDesc'),
      image: 'https://images.unsplash.com/photo-1595844730289-b248c919d6f9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FycGVudGVyfGVufDB8fDB8fHww',
      serviceValue: 'Carpentry',
    },
    {
      title: t('acTitle'),
      description: t('acDesc'),
      image: 'https://plus.unsplash.com/premium_photo-1682126009570-3fe2399162f7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YWMlMjByZXBhaXJ8ZW58MHx8MHx8fDA%3D',
      serviceValue: 'AC Maintenance',
    },
    {
      title: t('solarTitle'),
      description: t('solarDesc'),
      image: 'https://plus.unsplash.com/premium_photo-1671808063421-697d6de53c2e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8c29sYXIlMjBpbnN0YWxsYXRpb258ZW58MHx8MHx8fDA%3D',
      serviceValue: 'Solar Technician',
    },
    {
      title: t('cctvTitle'),
      description: t('cctvDesc'),
      image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0',
      serviceValue: 'CCTV Technician',
    },
    {
      title: t('coolerTitle'),
      description: t('coolerDesc'),
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0',
      serviceValue: 'Room Cooler',
    },
    {
      title: t('fridgeTitle'),
      description: t('fridgeDesc'),
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0',
      serviceValue: 'Refrigerator Technician',
    },
    {
      title: t('applianceTitle'),
      description: t('applianceDesc'),
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0',
      serviceValue: 'Home Appliances',
    },
    {
      title: t('washingMachineTitle'),
      description: t('washingMachineDesc'),
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0',
      serviceValue: 'Automatic Washing Machine Repair',
    },
  ];

  const handleServiceClick = (serviceValue: string) => {
    setService(serviceValue);
    router.push('/process');
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
            {t('ourservices')}
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            Professional services delivered by verified experts
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4
                        [&>*:nth-child(4)]:lg:col-start-1 [&>*:nth-child(4)]:lg:col-end-2
                        [&>*:nth-child(5)]:lg:col-start-2 [&>*:nth-child(5)]:lg:col-end-3
                        justify-items-center">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative rounded-xl bg-white overflow-hidden transition-all duration-300 w-full h-[320px] sm:h-[380px] md:h-[420px] max-w-full sm:max-w-sm cursor-pointer"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleServiceClick(service.serviceValue)}
              style={{
                boxShadow: hoveredCard === index 
                  ? '0 10px 30px rgba(0, 0, 0, 0.08)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Full Bleed Image Background */}
              <div className="absolute inset-0">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Subtle Vignette Effect */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" 
                     style={{
                       background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
                     }}
                />
              </div>

              {/* Mustard Overlay on Hover */}
              <div 
                className="absolute inset-0 bg-[#db4b0d] transition-opacity duration-500"
                style={{ opacity: hoveredCard === index ? 0.2 : 0 }}
              />

              {/* Subtle Blur Background for Text */}
              <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-48 md:h-56 bg-gradient-to-t from-black/40 via-black/10 to-transparent backdrop-blur-lg" 
                   style={{ 
                     maskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
                     WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)'
                   }} 
              />

              {/* Content Overlay at Bottom */}
              <div className="absolute bottom-[-30px] sm:bottom-[-20px] md:bottom-[-10px] left-0 right-0 px-4 sm:px-5 md:px-6 pb-2 sm:pb-3 transition-all duration-500 ease-out"
                   style={{
                     transform: hoveredCard === index ? 'translateY(-30px)' : 'translateY(0)'
                   }}>
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-1 sm:mb-2 leading-tight drop-shadow-lg" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed drop-shadow-md line-clamp-1 text-white">
                  {service.description}
                </p>

                {/* Find Now Link */}
                <div 
                  className="mt-3 transition-all duration-300"
                  style={{
                    opacity: hoveredCard === index ? 1 : 0,
                    transform: hoveredCard === index ? 'translateY(0)' : 'translateY(10px)'
                  }}
                >
                  <span className="inline-flex items-center gap-2 text-white text-sm font-medium group/link">
                    <span className="relative">
                      Find now
                      <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-white transition-all duration-300 group-hover/link:w-full" />
                    </span>
                    <svg 
                      className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

export default Services;