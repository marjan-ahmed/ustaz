// 'use client';

// import { useEffect, useState } from 'react';
// import { supabase } from '../../../client/supabaseClient';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent } from '@/components/ui/card';

// type Provider = {
//   id: string;
//   name: string;
//   location: any; // geography
//   services: string[];
// };

// export default function FindProviderPage() {
//   const [service, setService] = useState('');
//   const [address, setAddress] = useState('');
//   const [providers, setProviders] = useState<Provider[]>([]);
//   const [loading, setLoading] = useState(false);

//   const handleSearch = async () => {
//     setLoading(true);
//     setProviders([]);

//     try {
//       const { data, error } = await supabase
//         .from('providers')
//         .select('*')
//         .ilike('services', `%${service}%`);

//       if (error) throw error;
//       setProviders(data as Provider[]);
//     } catch (err) {
//       console.error('Error fetching providers:', err);
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-6">Find a Provider</h1>

//       <div className="mb-4">
//         <Label htmlFor="service">Service</Label>
//         <Input
//           id="service"
//           placeholder="e.g., plumbing, electrician"
//           value={service}
//           onChange={(e) => setService(e.target.value)}
//         />
//       </div>

//       <div className="mb-4">
//         <Label htmlFor="address">Address</Label>
//         <Input
//           id="address"
//           placeholder="Enter your location or city"
//           value={address}
//           onChange={(e) => setAddress(e.target.value)}
//         />
//       </div>

//       <Button onClick={handleSearch} disabled={loading}>
//         {loading ? 'Searching...' : 'Find Provider'}
//       </Button>

//       <div className="mt-6">
//         {providers.length > 0 ? (
//           <div className="space-y-4">
//             {providers.map((provider) => (
//               <Card key={provider.id}>
//                 <CardContent className="p-4">
//                   <p className="font-semibold">{provider.name}</p>
//                   <p>Services: {provider.services.join(', ')}</p>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         ) : (
//           !loading && <p>No providers found for this service.</p>
//         )}
//       </div>
//     </div>
//   );
// }
