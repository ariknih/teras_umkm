import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/quicktime']

const BUCKET = 'penyimpanan' // nama bucket di Supabase Storage

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general' // misal: 'products', 'avatars'

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 })
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: `Tipe file tidak didukung: ${file.type}` }, { status: 400 })
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Ukuran gambar melebihi 10MB.' }, { status: 400 })
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'Ukuran video melebihi 500MB.' }, { status: 400 })
    }

    // Generate unique filepath: folder/userId-timestamp-random.ext
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).slice(2, 8)
    const filename = `${folder}/${user.id}-${timestamp}-${randomStr}.${ext}`

    // Convert File to Uint8Array buffer
    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    // ─── OPTION 1: CLOUDFLARE R2 STORAGE ──────────────────────────────────────
    const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
    const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
    const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'teras-umkm'
    const r2PublicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL

    if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
      try {
        const r2Client = new S3Client({
          region: 'auto',
          endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretAccessKey,
          },
        })

        await r2Client.send(
          new PutObjectCommand({
            Bucket: r2Bucket,
            Key: filename,
            Body: buffer,
            ContentType: file.type,
          })
        )

        const publicUrl = r2PublicDomain
          ? `${r2PublicDomain.replace(/\/$/, '')}/${filename}`
          : `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}/${filename}`

        return NextResponse.json({
          url: publicUrl,
          path: filename,
          filename,
          type: isImage ? 'image' : 'video',
          provider: 'cloudflare-r2',
        })
      } catch (r2Error: any) {
        console.error('Cloudflare R2 upload error, falling back to Supabase:', r2Error)
      }
    }

    // ─── OPTION 2: SUPABASE STORAGE (DEFAULT FALLBACK) ─────────────────────────
    const client = supabaseAdmin()
    const { data, error } = await client.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Supabase Storage upload error:', error)
      return NextResponse.json({ error: `Gagal upload ke Storage: ${error.message}` }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = client.storage
      .from(BUCKET)
      .getPublicUrl(data.path)

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
      filename,
      type: isImage ? 'image' : 'video',
      provider: 'supabase-storage',
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengunggah file.' }, { status: 500 })
  }
}
