import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const maxDuration = 60 // Allow 60 seconds for video processing

const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500 MB
const MAX_DOC_SIZE = 50 * 1024 * 1024   // 50 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/quicktime']
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream'
]

const BUCKET = 'penyimpanan' // nama bucket di Supabase Storage

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general' // misal: 'products', 'avatars', 'courses'

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 })
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
    const isDoc = ALLOWED_DOC_TYPES.includes(file.type) ||
                  file.name.endsWith('.pdf') ||
                  file.name.endsWith('.xlsx') ||
                  file.name.endsWith('.xls')

    if (!isImage && !isVideo && !isDoc) {
      return NextResponse.json({ error: `Tipe file tidak didukung: ${file.type}` }, { status: 400 })
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Ukuran gambar melebihi 10MB.' }, { status: 400 })
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: 'Ukuran video melebihi 500MB.' }, { status: 400 })
    }

    if (isDoc && file.size > MAX_DOC_SIZE) {
      return NextResponse.json({ error: 'Ukuran dokumen melebihi 50MB.' }, { status: 400 })
    }

    const fileTypeStr = isImage ? 'image' : (isVideo ? 'video' : 'document')

    // Generate unique filepath: folder/userId-timestamp-random.ext
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).slice(2, 8)
    const filename = `${folder}/${user.id}-${timestamp}-${randomStr}.${ext}`

    // Convert File to Buffer for AWS S3 & Supabase compatibility
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

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
          type: fileTypeStr,
          provider: 'cloudflare-r2',
        })
      } catch (r2Error: any) {
        console.error('Cloudflare R2 upload error:', r2Error)
      }
    }

    // ─── OPTION 2: DIRECT AWS S3 STORAGE ──────────────────────────────────────
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    const awsRegion = process.env.AWS_REGION || 'ap-southeast-2'
    const awsBucket = process.env.AWS_S3_BUCKET_NAME

    if (awsAccessKeyId && awsSecretAccessKey && awsBucket) {
      try {
        const s3Client = new S3Client({
          region: awsRegion,
          credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
          },
        })

        await s3Client.send(
          new PutObjectCommand({
            Bucket: awsBucket,
            Key: filename,
            Body: buffer,
            ContentType: file.type,
          })
        )

        const publicUrl = `https://${awsBucket}.s3.${awsRegion}.amazonaws.com/${filename}`

        return NextResponse.json({
          url: publicUrl,
          path: filename,
          filename,
          type: fileTypeStr,
          provider: 'aws-s3',
        })
      } catch (awsError: any) {
        console.error('AWS S3 upload error:', awsError)
      }
    }

    // ─── OPTION 3: SUPABASE STORAGE (FALLBACK) ─────────────────────────
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const client = supabaseAdmin()
        if (client) {
          const { data, error } = await client.storage
            .from(BUCKET)
            .upload(filename, buffer, {
              contentType: file.type,
              upsert: false,
            })

          if (!error && data?.path) {
            const { data: { publicUrl } } = client.storage
              .from(BUCKET)
              .getPublicUrl(data.path)

            return NextResponse.json({
              url: publicUrl,
              path: data.path,
              filename,
              type: fileTypeStr,
              provider: 'supabase-storage',
            })
          }
          console.warn('Supabase Storage upload error, falling back to local disk:', error?.message)
        }
      } catch (supaErr: any) {
        console.warn('Supabase Storage client error, falling back to local disk:', supaErr?.message)
      }
    }

    // ─── OPTION 4: LOCAL FILESYSTEM STORAGE (RELIABLE FALLBACK) ────────
    try {
      const localFilename = `${user.id}-${timestamp}-${randomStr}.${ext}`
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder)
      await mkdir(uploadsDir, { recursive: true })

      const filePath = path.join(uploadsDir, localFilename)
      await writeFile(filePath, buffer)

      const localPublicUrl = `/uploads/${folder}/${localFilename}`

      return NextResponse.json({
        url: localPublicUrl,
        path: `uploads/${folder}/${localFilename}`,
        filename: localFilename,
        type: fileTypeStr,
        provider: 'local-filesystem',
      })
    } catch (fsError: any) {
      console.error('Local filesystem upload error:', fsError)
      return NextResponse.json({ error: `Gagal menyimpan file ke server: ${fsError.message}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Gagal mengunggah file.' }, { status: 500 })
  }
}

