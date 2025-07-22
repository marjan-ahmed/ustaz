'use client'
import React from 'react';
import { useLocale, useTranslations } from 'next-intl';

function Services() {
  const locale = useLocale()
  const t = useTranslations("section");
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

  return (
  <section className="py-8 sm:py-16 bg-gradient-to-b from-[#fcf8f5] to-white">
  <div className="container mx-auto px-4 sm:px-6">
    <h2 className="text-2xl sm:text-4xl font-extrabold text-center mb-6 sm:mb-8">{t('ourservices')}</h2>

    <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-12"> {/* New: Grid for 2 columns on mobile, 1 on md+ */}
      {services.map((service, index) => (
        <div
          key={index}
          className={`flex flex-col border border-gray-300 rounded-lg overflow-hidden shadow-sm
                      ${index % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} `} /* md:flex-row-reverse for alternating layout on md+ */
        >
          {/* Image */}
          <div className="w-full md:w-1/2 h-[100px] sm:h-[150px] md:h-[350px]"> {/* Adjusted mobile height */}
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="w-full md:w-1/2 flex flex-col justify-center p-2 sm:p-6 bg-white"> {/* Adjusted mobile padding */}
            <h3 className="text-sm sm:text-3xl font-bold text-orange-600 text-center md:text-left">{service.title}</h3> {/* Adjusted mobile font size and centered text */}
            <p className="hidden md:block text-sm sm:text-[15px] mt-2 sm:mt-4 text-gray-600">{service.description}</p> {/* Hidden on mobile, shown on md+ */}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
  );
}

export default Services;