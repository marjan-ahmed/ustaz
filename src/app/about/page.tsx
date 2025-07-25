'use client';
import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Header from '../components/Header';
import Footer from '../components/Footer';

function AboutUs() {
  const t = useTranslations('about');

  return (
    <>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        <meta name="keywords" content={t('meta.keywords')} />
        <meta name="author" content="Ustaz" />
      </Head>

      <Header />

      <main className="bg-orange-50 text-gray-900 min-h-screen">
        {/* Hero Section */}
        <section className="bg-[#db4b0d] text-white py-20 px-6 text-center shadow-lg">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">{t('hero.title')}</h1>
          <p className="mt-4 text-xl max-w-2xl mx-auto">{t('hero.subtitle')}</p>
        </section>

        {/* Story Section */}
        <section className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-[#db4b0d]">{t('story.heading')}</h2>
            <p className="text-sm sm: text-md md:text-lg leading-relaxed">{t('story.paragraph1')}</p>
            <p className="text-sm sm: text-md md:text-lg leading-relaxed">{t('story.paragraph2')}</p>
          </div>
          <Image
            src="https://images.pexels.com/photos/6914343/pexels-photo-6914343.jpeg"
            alt="Ustaz team in action - delivering trusted home services"
            width={600}
            height={400}
            className="rounded-2xl shadow-lg object-cover w-full"
          />
        </section>

        {/* Leadership Section */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#db4b0d] mb-12">{t('leadership.heading')}</h2>
            <p className="text-md sm:text-lg max-w-3xl mx-auto mb-10 text-gray-700">
              {t('leadership.description')}
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-12 max-w-5xl mx-auto">
            {[
              {
                name: t('founder.name'),
                role: t('founder.role'),
                image: '/team/founder.jpg',
              },
              {
                name: t('ceo.name'),
                role: t('ceo.role'),
                image: '/team/marjan-ceo.jpg',
              },
              {
                name: t('hoo.name'),
                role: t('hoo.role'),
                image: '/team/sufyan-hoo.jpg',
              },
            ].map((person, idx) => (
              <div
                key={idx}
                className="text-center group w-[220px] hover:scale-105 transition-transform duration-300"
              >
                <div className="rounded-full overflow-hidden shadow-lg w-[220px] h-[220px] mx-auto mb-4">
                  <Image
                    src={person.image}
                    alt={`${person.name} - ${person.role}`}
                    width={220}
                    height={220}
                    className="object-cover"
                  />
                </div>
                <h3 className="text-sm sm:text-md md:text-xl font-semibold text-gray-800">{person.name}</h3>
                <p className="text-xs sm:text-sm mt-0.5 text-gray-500">{person.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="bg-orange-100 py-20 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
            <div>
              <h3 className="text-xl font-bold text-[#db4b0d] mb-2">{t('missionVision.missionTitle')}</h3>
              <p className="text-base text-gray-700">{t('missionVision.missionText')}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#db4b0d] mb-2">{t('missionVision.visionTitle')}</h3>
              <p className="text-base text-gray-700">{t('missionVision.visionText')}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#db4b0d] mb-2">{t('missionVision.valuesTitle')}</h3>
              <p className="text-base text-gray-700">{t('missionVision.valuesText')}</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-[#db4b0d] text-white py-20 px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-lg mb-6">{t('cta.subtitle')}</p>
          <a
            href="https://wa.me/923051126649"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-[#db4b0d] px-6 py-3 rounded-full font-semibold hover:bg-orange-100 transition"
          >
            {t('cta.button')}
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default AboutUs;
