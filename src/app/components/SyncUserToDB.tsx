import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../client/supabaseClient'

export const config = {
  api: {
    bodyParser: true, // Clerk sends JSON payload
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify the request is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic security: Verify webhook secret from headers or body (set this in Clerk dashboard)
  const clerkSignature = req.headers['clerk-signature'] || req.headers['x-clerk-signature'];
  if (!clerkSignature) {
    return res.status(401).json({ error: 'Missing Clerk signature' });
  }
  // TODO: Verify signature with your webhook secret using Clerk SDK (recommended)

  const event = req.body;

  if (event.type !== 'user.created') {
    // For now, only handle user.created events
    return res.status(200).json({ message: 'Event ignored' });
  }

  const user = event.data;

  if (!user) {
    return res.status(400).json({ error: 'Missing user data' });
  }

  const { id, firstName, lastName, emailAddresses, profileImageUrl } = user;

  const email = emailAddresses && emailAddresses.length > 0 ? emailAddresses[0].emailAddress : null;

  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id,
        first_name: firstName,
        last_name: lastName,
        email,
        avatar_url: profileImageUrl,
      }, { onConflict: 'id' });

    if (error) throw error;

    return res.status(200).json({ message: 'User synced to Supabase', data });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMessage });
  }
}
