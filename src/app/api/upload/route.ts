import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { supabaseAdmin } from '@/lib/supabase'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024  // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/quicktime']

const BUCKET = 'uploads' // nama bucket di Supabase Storage

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
      return NextResponse.json({ error: 'Ukuran gambar melebihi 5MB.' }, { status: 400 })
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'Ukuran video melebihi 50MB.' }, { status: 400 })
    }

    // Generate unique filepath: folder/userId-timestamp-random.ext
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).slice(2, 8)
    const filename = `${folder}/${user.id}-${timestamp}-${randomStr}.${ext}`

    // Convert File to ArrayBuffer → Uint8Array for Supabase upload
    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

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
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengunggah file.' }, { status: 500 })
  }
}
