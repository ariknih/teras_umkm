import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filename, fileType, folder = 'courses' } = body

    if (!filename || !fileType) {
      return NextResponse.json({ error: 'Nama file dan tipe file wajib diisi.' }, { status: 400 })
    }

    // `folder` picks the key prefix a caller writes into — it was accepted
    // as-is from the client, so any logged-in account (not just admins)
    // could request a signed URL into the 'courses' prefix the academy CMS
    // uses for lesson videos and course covers. Restrict to known prefixes,
    // and gate the academy one behind the same admin check its own actions use.
    const ALLOWED_FOLDERS = ['courses', 'builder']
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: 'Folder unggahan tidak dikenali.' }, { status: 400 })
    }
    if (folder === 'courses' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Hanya untuk Administrator.' }, { status: 403 })
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).slice(2, 8)
    const key = `${folder}/${user.id}-${timestamp}-${randomStr}.${ext}`

    // Presigned upload URL valid for 15 minutes (900 seconds)
    const EXPIRES_IN = 900

    // ─── OPTION 1: CLOUDFLARE R2 (preferred — zero egress fees) ───────────────
    // Mirrors the provider order in /api/upload so both paths agree on where
    // files land. R2 speaks the S3 API, so it is the same SDK with a custom
    // endpoint and region 'auto'.
    const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
    const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
    const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'teras-umkm'
    const r2PublicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL

    if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
      const r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
        },
      })

      const uploadUrl = await getSignedUrl(
        r2Client,
        new PutObjectCommand({ Bucket: r2Bucket, Key: key, ContentType: fileType }),
        { expiresIn: EXPIRES_IN }
      )

      // Without a public domain the raw r2.cloudflarestorage endpoint is NOT
      // publicly readable, so playback would 401. Enable the bucket's r2.dev
      // URL or attach a custom domain, then set CLOUDFLARE_R2_PUBLIC_URL.
      const publicUrl = r2PublicDomain
        ? `${r2PublicDomain.replace(/\/$/, '')}/${key}`
        : `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}/${key}`

      return NextResponse.json({
        uploadUrl,
        publicUrl,
        key,
        provider: 'cloudflare-r2-presigned',
      })
    }

    // ─── OPTION 2: AWS S3 ─────────────────────────────────────────────────────
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    const awsRegion = process.env.AWS_REGION || 'ap-southeast-2'
    const awsBucket = process.env.AWS_S3_BUCKET_NAME

    if (!awsAccessKeyId || !awsSecretAccessKey || !awsBucket) {
      return NextResponse.json(
        { error: 'Penyimpanan objek belum dikonfigurasi (Cloudflare R2 atau AWS S3).' },
        { status: 500 }
      )
    }

    const s3Client = new S3Client({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    })

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: awsBucket, Key: key, ContentType: fileType }),
      { expiresIn: EXPIRES_IN }
    )
    const publicUrl = `https://${awsBucket}.s3.${awsRegion}.amazonaws.com/${key}`

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
      provider: 'aws-s3-presigned',
    })
  } catch (error: any) {
    console.error('Presigned URL generation error:', error)
    return NextResponse.json({ error: error.message || 'Gagal membuat URL upload.' }, { status: 500 })
  }
}
