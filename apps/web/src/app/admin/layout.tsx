import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal - Ustaz',
  description: 'Ustaz Admin Portal — Manage top-up requests and provider wallet approvals',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="antialiased">
      {children}
    </div>
  );
}
