// // /pages/api/findAndNotifyProviders.ts

// import { supabase } from '../../../../../client/supabaseClient';
// import type { NextApiRequest, NextApiResponse } from 'next';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

//   const { userId, userName, service_type, lat, lng, radius_m } = req.body;

//   const { data: providers, error } = await supabase.rpc('find_nearby_provider', {
//     lat_input: lat,
//     lng_input: lng,
//     radius_mm: radius_m,
//     type_input: service_type,
//   });

//   if (error) return res.status(500).json({ error });

//   const notifications = providers.map((provider: any) => ({
//     user_id: userId,
//     provider_id: provider.userId,
//     service_type,
//     user_lat: lat,
//     user_lng: lng,
//     message: `${userName} requested ${service_type} service at your nearby location.`,
//     status: 'unread',
//   }));

//   const { error: insertError } = await supabase.from('notifications').insert(notifications);

//   if (insertError) return res.status(500).json({ error: insertError });

//   res.status(200).json({ message: 'Notifications sent to nearby providers.', providers });
// }
