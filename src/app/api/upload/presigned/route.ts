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

    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    const awsRegion = process.env.AWS_REGION || 'ap-southeast-2'
    const awsBucket = process.env.AWS_S3_BUCKET_NAME

    if (!awsAccessKeyId || !awsSecretAccessKey || !awsBucket) {
      return NextResponse.json({ error: 'AWS S3 belum dikonfigurasi.' }, { status: 500 })
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).slice(2, 8)
    const key = `${folder}/${user.id}-${timestamp}-${randomStr}.${ext}`

    const s3Client = new S3Client({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    })

    const command = new PutObjectCommand({
      Bucket: awsBucket,
      Key: key,
      ContentType: fileType,
    })

    // Presigned upload URL valid for 15 minutes (900 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 })
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
