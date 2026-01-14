'use client'
import React, { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';

function Services() {
  const locale = useLocale()
  const t = useTranslations("section");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedService !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedService]);

  const services = [
    {
      title: t('elecTitle'),
      description: t('electDesc'),
      image: 'https://plus.unsplash.com/premium_photo-1661911309991-cc81afcce97d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZWxlY3RyaWNpYW58ZW58MHx8MHx8fDA%3D',
    },
    {
      title: t('plumbTitle'),
      description: t('plumbDesc'),
      image: 'https://plus.unsplash.com/premium_photo-1664298589198-b15ff5382648?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGx1bWJlcnxlbnwwfHwwfHx8MA%3D%3D',
    },
    {
      title: t('carpTitle'),
      description: t('carpDesc'),
      image: 'https://images.unsplash.com/photo-1595844730289-b248c919d6f9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FycGVudGVyfGVufDB8fDB8fHww',
    },
    {
      title: t('acTitle'),
      description: t('acDesc'),
      image: 'https://plus.unsplash.com/premium_photo-1682126009570-3fe2399162f7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YWMlMjByZXBhaXJ8ZW58MHx8MHx8fDA%3D',
    },
    {
      title: t('solarTitle'),
      description: t('solarDesc'),
      image: 'https://plus.unsplash.com/premium_photo-1671808063421-697d6de53c2e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8c29sYXIlMjBpbnN0YWxsYXRpb258ZW58MHx8MHx8fDA%3D',
    },
  ];

  const handleLearnMore = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedService(index);
  };

  const closeModal = () => {
    setSelectedService(null);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 
                        [&>*:nth-child(4)]:lg:col-start-1 [&>*:nth-child(4)]:lg:col-end-2
                        [&>*:nth-child(5)]:lg:col-start-2 [&>*:nth-child(5)]:lg:col-end-3
                        justify-items-center">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative bg-white overflow-hidden transition-all duration-300 w-full h-[320px] sm:h-[380px] md:h-[420px] max-w-full sm:max-w-sm"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
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

                {/* Learn More Link */}
                <div 
                  className="mt-3 transition-all duration-300"
                  style={{
                    opacity: hoveredCard === index ? 1 : 0,
                    transform: hoveredCard === index ? 'translateY(0)' : 'translateY(10px)'
                  }}
                >
                  <button 
                    onClick={(e) => handleLearnMore(index, e)}
                    className="inline-flex items-center gap-2 text-white text-sm font-medium group/link"
                  >
                    <span className="relative">
                      Learn more
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
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Detail Modal/Drawer */}
      {selectedService !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeModal}
        >
          <div 
            className="relative bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl transition-all duration-300 ease-out transform animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div className="relative h-64 w-full">
              <Image
                src={services[selectedService].image}
                alt={services[selectedService].title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Title on Image */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-3xl md:text-4xl font-semibold text-white drop-shadow-lg" style={{fontFamily: 'Clash Grotesk, sans-serif'}}>
                  {services[selectedService].title}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8">
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Service</h3>
                <p className="text-gray-700 leading-relaxed text-base mb-6">
                  {services[selectedService].description}
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">What We Offer</h3>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#db4b0d] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Professional and certified service providers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#db4b0d] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Quick response time and flexible scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#db4b0d] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Quality workmanship with warranty coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#db4b0d] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Transparent pricing and instant quotes</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    className="flex-1 bg-[#db4b0d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#c24309] transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Book Now
                  </button>
                  <button 
                    onClick={closeModal}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Services;