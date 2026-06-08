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
  } else if (type === 'theme') {
    return `Generate a beautiful cohesive color theme for a landing page based on the following user description or business type:
Prompt: ${context.prompt}

Generate a matching style palette including:
- canvasBg: page background color (hex format, e.g. #FAF6EE)
- primaryColor: accent button or highlighted element color (hex format, e.g. #2DB24A)
- textColor: body text color (hex format, e.g. #111111)
- cardBg: card/section background color (hex format, e.g. #FFFFFF)
- borderRadius: recommended border radius for buttons/cards in pixels (number between 0 and 24, e.g. 8)
- styleName: a short descriptive name for this theme (e.g. Herbal Fresh)

Format Output: Return ONLY a valid JSON object matching this schema. Do not include markdown codeblocks (no \`\`\`json etc) or other text outside the JSON.
{
  "canvasBg": "#FAF6EE",
  "primaryColor": "#2DB24A",
  "textColor": "#111111",
  "cardBg": "#FFFFFF",
  "borderRadius": 8,
  "styleName": "Herbal Fresh"
}`
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
  } else if (type === 'theme') {
    const prompt = (context.prompt || '').toLowerCase()
    if (prompt.includes('herbal') || prompt.includes('hijau') || prompt.includes('green') || prompt.includes('daun') || prompt.includes('sehat')) {
      return JSON.stringify({
        canvasBg: '#f4f8f4',
        primaryColor: '#2db24a',
        textColor: '#1e3b26',
        cardBg: '#ffffff',
        borderRadius: 8,
        styleName: 'Herbal Fresh'
      })
    } else if (prompt.includes('kopi') || prompt.includes('cokelat') || prompt.includes('coffee') || prompt.includes('cafe')) {
      return JSON.stringify({
        canvasBg: '#fbf9f6',
        primaryColor: '#6f4e37',
        textColor: '#3e2723',
        cardBg: '#ffffff',
        borderRadius: 12,
        styleName: 'Coffee Warmth'
      })
    } else if (prompt.includes('gelap') || prompt.includes('dark') || prompt.includes('hitam') || prompt.includes('black') || prompt.includes('malam') || prompt.includes('cyber')) {
      return JSON.stringify({
        canvasBg: '#121212',
        primaryColor: '#00e5ff',
        textColor: '#e0e0e0',
        cardBg: '#1e1e1e',
        borderRadius: 6,
        styleName: 'Tech Dark'
      })
    } else if (prompt.includes('retro') || prompt.includes('vintage') || prompt.includes('klasik') || prompt.includes('lama')) {
      return JSON.stringify({
        canvasBg: '#f4efe2',
        primaryColor: '#e76f51',
        textColor: '#2b1a0a',
        cardBg: '#faf6ee',
        borderRadius: 0,
        styleName: 'Retro Classic'
      })
    } else if (prompt.includes('soft') || prompt.includes('pastel') || prompt.includes('pink') || prompt.includes('lucu') || prompt.includes('cantik') || prompt.includes('bunga')) {
      return JSON.stringify({
        canvasBg: '#f6f5fa',
        primaryColor: '#a78bfa',
        textColor: '#3f3d56',
        cardBg: '#ffffff',
        borderRadius: 20,
        styleName: 'Soft Pastel'
      })
    } else {
      return JSON.stringify({
        canvasBg: '#f8f9fa',
        primaryColor: '#2db24a',
        textColor: '#1a1a1a',
        cardBg: '#ffffff',
        borderRadius: 8,
        styleName: 'AI Custom Style'
      })
    }
  } else {
    const businessName = context.businessName || 'Usaha Premium Anda'
    const bio = context.bio || 'Menyediakan produk berkualitas.'
    
    return `Tagline: Menghadirkan Kemewahan dan Kualitas Sejati dalam Setiap Sentuhan.
    
Bio: ${businessName} adalah dedikasi kami untuk menghadirkan produk dan layanan terbaik dengan standar kualitas tertinggi. Terinspirasi oleh kebutuhan Anda, kami berkomitmen untuk mendampingi setiap momen berharga Anda melalui inovasi berkelanjutan, keandalan, dan pelayanan prima yang tulus dari hati.`
  }
}
