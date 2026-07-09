export const homeCopy = {
  eyebrow: 'Trusted home services in Pakistan',
  title: 'Find trusted professionals near you.',
  body: 'Book verified electricians, plumbers, AC technicians, carpenters, solar pros and cleaners with live tracking and a 3-day work guarantee.',
  primaryCta: 'Find a provider',
  secondaryCta: 'Become an Ustaz',
};

export const serviceCategories = [
  { name: 'Electrician Service', short: 'EL', tone: '#FFF7ED', accent: '#DB4B0D', note: 'Wiring, fans, panels' },
  { name: 'Plumbing', short: 'PL', tone: '#EFF6FF', accent: '#2563EB', note: 'Leaks, tanks, fittings' },
  { name: 'Carpentry', short: 'CP', tone: '#F7FEE7', accent: '#4D7C0F', note: 'Doors, shelves, repairs' },
  { name: 'AC Maintenance', short: 'AC', tone: '#ECFEFF', accent: '#0891B2', note: 'Service, cooling, gas' },
  { name: 'Solar Technician', short: 'SO', tone: '#FEF3C7', accent: '#B45309', note: 'Panels, inverter help' },
] as const;

export const webNavShortcuts = [
  { title: 'Find provider', subtitle: 'Start the booking flow', href: '/book', marker: '01' },
  { title: 'My Jobs', subtitle: 'Track requests and warranty', href: '/history', marker: '02' },
  { title: 'Become Ustaz', subtitle: 'Join as a verified provider', href: '/dashboard', marker: '03' },
  { title: 'About', subtitle: 'Why Ustaz exists', href: null, marker: '04' },
  { title: 'Contact', subtitle: 'Get help from support', href: null, marker: '05' },
] as const;

export const trustStats = [
  { value: '24/7', label: 'booking support' },
  { value: '3-day', label: 'work guarantee' },
  { value: 'Live', label: 'provider tracking' },
] as const;

export const bookingSteps = [
  { title: 'Choose service', body: 'Pick the exact repair or installation you need.' },
  { title: 'Confirm location', body: 'Share pickup point so nearby providers can respond.' },
  { title: 'Track the job', body: 'Follow accepted, enroute, arrival and completion states.' },
] as const;

export const providerTabs = ['Requests', 'Wallet', 'Warranty', 'Chat', 'Profile'] as const;

export const jobHistory = [
  { title: 'Kitchen sink repair', provider: 'Ahmed Plumbing', status: 'Completed', warranty: '2 days left', amount: 'Rs. 1,800' },
  { title: 'AC cooling service', provider: 'North Cooling Co.', status: 'In progress', warranty: 'Starts after completion', amount: 'Rs. 3,500' },
  { title: 'Switch board install', provider: 'Bilal Electric', status: 'Warranty claim available', warranty: '18 hours left', amount: 'Rs. 950' },
] as const;

export const chats = [
  { name: 'Ahmed Plumbing', message: 'I am 8 minutes away from your location.', time: 'Now', unread: 2 },
  { name: 'Ustaz Support', message: 'Your warranty claim evidence was received.', time: '11:24', unread: 0 },
  { name: 'Bilal Electric', message: 'Please confirm the breaker size.', time: 'Yesterday', unread: 0 },
] as const;
