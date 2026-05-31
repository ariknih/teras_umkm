import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, context } = await req.json()
    if (!type || !context) {
      return NextResponse.json({ error: 'Bad Request. Tipe dan konteks wajib disertakan.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    
    // Fallback Mock AI Generator if key is not found
    if (!apiKey) {
      console.log('Gemini API Key tidak ditemukan di .env, menggunakan generator mock cerdas.')
      const resultText = generateMockCopywriting(type, context)
      return NextResponse.json({ text: resultText })
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: buildPrompt(type, context)
            }]
          }]
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API Error:', errorData)
      // Fallback on error
      const resultText = generateMockCopywriting(type, context)
      return NextResponse.json({ text: resultText })
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    return NextResponse.json({ text: content.trim() })

  } catch (error: any) {
    console.error('AI Copywriter Error:', error)
    return NextResponse.json({ error: error.message || 'Gagal menghasilkan teks.' }, { status: 500 })
  }
}

function buildPrompt(type: string, context: any): string {
  if (type === 'product') {
    return `Tulis deskripsi produk premium dalam Bahasa Indonesia untuk produk berikut:
Nama Produk: ${context.title}
Kategori: ${context.category}
Kata Kunci: ${context.keywords || 'artisan, berkualitas'}
Gaya Bahasa: Menarik, profesional, persuasif, persuasif untuk pasar menengah-atas.
Format Output: Tuliskan langsung deskripsi produknya saja tanpa kata pengantar atau tanda petik.`
  } else {
    return `Tulis tagline bisnis dan biografi profil singkat dalam Bahasa Indonesia untuk landing page toko UMKM berikut:
Nama Bisnis: ${context.businessName}
Kategori: ${context.category}
Deskripsi Singkat: ${context.bio}
Gaya Bahasa: Elegan, modern, dan tepercaya.
Format Output:
Tagline: [Tagline di sini]
Bio: [Bio profil yang diperluas di sini]`
  }
}

function generateMockCopywriting(type: string, context: any): string {
  if (type === 'product') {
    const title = context.title || 'Produk Premium'
    const category = context.category || 'Toko'
    const keywords = context.keywords || 'artisan, eksklusif'
    
    return `Memperkenalkan ${title}, produk berkualitas tinggi yang dirancang khusus untuk memenuhi gaya hidup modern Anda. Dibuat dengan dedikasi penuh dan bahan-bahan pilihan, produk ini menghadirkan estetika premium dan fungsionalitas terbaik di kelasnya.

Sangat cocok bagi Anda yang menghargai keindahan detail dan ketahanan produk jangka panjang. Sentuhan akhir yang elegan menjadikannya pilihan sempurna untuk melengkapi kebutuhan harian atau sebagai hadiah eksklusif bagi orang terkasih. Dapatkan keistimewaan ${title} sekarang juga!`
  } else {
    const businessName = context.businessName || 'Usaha Premium Anda'
    const bio = context.bio || 'Menyediakan produk berkualitas.'
    
    return `Tagline: Menghadirkan Kemewahan dan Kualitas Sejati dalam Setiap Sentuhan.
    
Bio: ${businessName} adalah dedikasi kami untuk menghadirkan produk dan layanan terbaik dengan standar kualitas tertinggi. Terinspirasi oleh kebutuhan Anda, kami berkomitmen untuk mendampingi setiap momen berharga Anda melalui inovasi berkelanjutan, keandalan, dan pelayanan prima yang tulus dari hati.`
  }
}
