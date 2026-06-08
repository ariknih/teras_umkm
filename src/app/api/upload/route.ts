import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getCurrentUser } from '@/app/actions/auth'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024  // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/quicktime']

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'image' // 'image' | 'video'

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

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).slice(2, 8)
    const filename = `${user.id}-${timestamp}-${randomStr}.${ext}`

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const url = `/uploads/${filename}`

    return NextResponse.json({ url, filename, type: isImage ? 'image' : 'video' })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengunggah file.' }, { status: 500 })
  }
}
