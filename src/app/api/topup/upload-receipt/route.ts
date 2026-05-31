import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('receipt') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing file: receipt' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Max 5MB allowed.' }, { status: 400 });
    }

    // Generate unique filename: provider-id/timestamp-originalname
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${user.id}/${timestamp}-receipt.${ext}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('topup-receipts')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[topup/upload-receipt] Storage upload failed', {
        uid: user.id,
        error: uploadError.message,
      });
      return NextResponse.json(
        { error: 'Failed to upload receipt', details: uploadError.message },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('topup-receipts')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      message: 'Receipt uploaded successfully',
      path: uploadData.path,
      url: publicUrlData.publicUrl,
    });
  } catch (e: any) {
    console.error('[topup/upload-receipt] unexpected', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
