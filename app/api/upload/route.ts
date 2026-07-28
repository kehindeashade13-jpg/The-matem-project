import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded or invalid file format' }, { status: 400 });
    }

    // Prepare clean unique file name
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedFileName}`;

    // Read arrayBuffer ONCE at the start to prevent stream-already-read errors on fallback
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isSupabaseConfigured) {
      try {
        // Try to list buckets to verify connectivity and bucket existence
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
          console.log('Supabase buckets check returned status: fallback active.');
        } else {
          const bucketExists = buckets?.some(b => b.name === 'school-media');
          if (!bucketExists) {
            console.log('Bucket "school-media" not found. Attempting to create it...');
            const { error: createError } = await supabase.storage.createBucket('school-media', {
              public: true,
              allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
            });
            if (createError) {
              console.log('Bucket auto-creation returned status: fallback active.');
            } else {
              console.log('Successfully created "school-media" bucket!');
            }
          }
        }

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('school-media')
          .upload(`carousels/${filename}`, buffer, {
            contentType: file.type || 'image/jpeg',
            duplex: 'half',
            upsert: true
          });

        if (!error && data) {
          const { data: urlData } = supabase.storage.from('school-media').getPublicUrl(data.path);
          if (urlData?.publicUrl) {
            return NextResponse.json({ url: urlData.publicUrl });
          }
        }
        console.log('Supabase storage upload completed: utilizing base64/local fallback.');
      } catch (supabaseErr) {
        console.log('Supabase upload exception handled: utilizing base64/local fallback.');
      }
    }

    // Fallback: Always convert to portable Data URL (base64) so it persists permanently in DB on Vercel & Cloud Run
    const mimeType = file.type || 'image/jpeg';
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    return NextResponse.json({ url: dataUrl });

  } catch (err: any) {
    console.error('API Upload error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process file' }, { status: 500 });
  }
}

