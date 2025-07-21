import React from 'react';

function Services() {
  const services = [
  {
    title: "Electrical Service",
    description:
      "Our certified electricians provide expert electrical services including safe wiring, modern lighting installations, appliance fittings, fault diagnosis, and regular maintenance for homes, offices, and commercial setups. Ensuring quality, safety, and reliability is our top priority.",
    image: "https://plus.unsplash.com/premium_photo-1661911309991-cc81afcce97d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZWxlY3RyaWNpYW58ZW58MHx8MHx8fDA%3D",
  },
  {
    title: "Plumbing Service",
    description:
      "We offer professional plumbing services including leak detection and repair, pipe installations, drainage system setup, bathroom and kitchen fittings, and complete water system maintenance. Our team ensures prompt service, high-quality materials, and long-lasting solutions for residential and commercial properties.",
    image: "https://plus.unsplash.com/premium_photo-1664298589198-b15ff5382648?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGx1bWJlcnxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    title: "Carpentry",
    description:
      "Our skilled carpenters specialize in custom furniture making, woodwork repairs, structural carpentry, door and window installations, and decorative wood finishes. From modern to traditional designs, we deliver craftsmanship that enhances both functionality and aesthetics for your living or work space.",
    image: "https://images.unsplash.com/photo-1595844730289-b248c919d6f9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FycGVudGVyfGVufDB8fDB8fHww",
  },
  {
    title: "AC Maintenance",
    description:
      "Stay cool year-round with our reliable AC repair services. We handle air conditioner installations, gas refilling, deep cleaning, filter replacements, and troubleshooting for all major brands. Count on us for efficient, affordable cooling system care with quick response times.",
    image: "https://plus.unsplash.com/premium_photo-1682126009570-3fe2399162f7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YWMlMjByZXBhaXJ8ZW58MHx8MHx8fDA%3D",
  },
  {
    title: "Solar Technician",
    description:
      "Go green with our solar technician services. We provide solar panel setup, inverter installations, renewable energy consultations, and complete maintenance to ensure optimal energy generation. Save on electricity bills while contributing to a sustainable future with our expert solar solutions.",
    image: "https://plus.unsplash.com/premium_photo-1671808063421-697d6de53c2e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8c29sYXIlMjBpbnN0YWxsYXRpb258ZW58MHx8MHx8fDA%3D",
  },
];


  return (
  <section className="py-8 sm:py-16 bg-gradient-to-b from-[#fcf8f5] to-white">
  <div className="container mx-auto px-4 sm:px-6">
    <h2 className="text-2xl sm:text-4xl font-extrabold text-center mb-6 sm:mb-8">Our Services</h2>

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