/**
 * Center-crops an uploaded image to a fixed aspect ratio and encodes it as
 * WebP, falling back to JPEG when the browser's canvas can't encode WebP
 * (older Safari silently returns PNG instead of the requested type, per
 * spec, rather than erroring). Shared by course cover images (16:9) and
 * certificate template backgrounds (11:8.5 / US Letter Landscape) — both
 * need the exact same crop-then-encode behavior, just different ratios and
 * output sizes.
 */
export function cropAndEncodeImage(
  file: File,
  ratio: number,
  outputWidth: number,
  quality = 0.85
): Promise<string> {
  const outputHeight = Math.round(outputWidth / ratio)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (evt) => {
      const img = new Image()
      img.onload = () => {
        const w = img.width
        const h = img.height
        let sx = 0, sy = 0, sw = w, sh = h
        if (w / h > ratio) {
          sw = h * ratio
          sx = (w - sw) / 2
        } else {
          sh = w / ratio
          sy = (h - sh) / 2
        }
        const canvas = document.createElement('canvas')
        canvas.width = outputWidth
        canvas.height = outputHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas tidak didukung di browser ini.')); return }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight)
        let output = canvas.toDataURL('image/webp', quality)
        if (!output.startsWith('data:image/webp')) output = canvas.toDataURL('image/jpeg', quality)
        resolve(output)
      }
      img.onerror = () => reject(new Error('Gagal memuat gambar.'))
      img.src = evt.target?.result as string
    }
    reader.onerror = () => reject(new Error('Gagal membaca file.'))
    reader.readAsDataURL(file)
  })
}
