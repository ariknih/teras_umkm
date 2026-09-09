import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { supabaseAdmin } from '@/lib/supabase'
import { unlink } from 'fs/promises'
import path from 'path'

const SUPABASE_BUCKET = 'penyimpanan' // must match src/app/api/upload/route.ts

// Best-effort delete of a file previously written by /api/upload — the
// upload route doesn't persist which of its 4 providers (R2/S3/Supabase/
// local) handled a given URL, so the provider is inferred from the URL's
// host. Failures are swallowed: losing a storage object must never block
// the DB-row deletion that called this.
export async function deleteUploadedFile(url: string | null | undefined): Promise<void> {
  if (!url) return

  try {
    if (url.startsWith('/uploads/')) {
      await unlink(path.join(process.cwd(), 'public', url)).catch(() => {})
      return
    }

    const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
    const r2PublicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL
    if (r2AccountId && (
      (r2PublicDomain && url.startsWith(r2PublicDomain)) ||
      url.includes('.r2.cloudflarestorage.com')
    )) {
      const key = r2PublicDomain && url.startsWith(r2PublicDomain)
        ? url.slice(r2PublicDomain.replace(/\/$/, '').length + 1)
        : url.split(`/${process.env.CLOUDFLARE_R2_BUCKET_NAME || 'teras-umkm'}/`)[1]
      if (key) {
        const r2Client = new S3Client({
          region: 'auto',
          endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
          },
        })
        await r2Client.send(new DeleteObjectCommand({ Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'teras-umkm', Key: key }))
      }
      return
    }

    const awsBucket = process.env.AWS_S3_BUCKET_NAME
    if (awsBucket && url.includes(`${awsBucket}.s3.`)) {
      const key = url.split('.amazonaws.com/')[1]
      if (key) {
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || 'ap-southeast-2',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        })
        await s3Client.send(new DeleteObjectCommand({ Bucket: awsBucket, Key: key }))
      }
      return
    }

    if (url.includes('.supabase.co/')) {
      const marker = `/object/public/${SUPABASE_BUCKET}/`
      const idx = url.indexOf(marker)
      if (idx !== -1) {
        const key = url.slice(idx + marker.length)
        const client = supabaseAdmin()
        if (client) await client.storage.from(SUPABASE_BUCKET).remove([key])
      }
      return
    }
  } catch (err) {
    console.error('[deleteUploadedFile] cleanup failed for', url, err)
  }
}
