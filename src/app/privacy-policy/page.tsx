import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-2">
        We respect your privacy. We do not sell or share your personal data.
        Authentication is handled through third-party providers such as Facebook Login.
        Your data is only used to log you in and enhance user experience.
      </p>
    </main>
  );
};

export default PrivacyPolicy;