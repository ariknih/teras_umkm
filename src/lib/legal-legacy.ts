import type { DocNode, LegalSlug } from './organization'

// ponytail: the pre-CMS copy of /privacy and /terms, served (and loaded into
// the CMS editor) until each document's first publish. Delete this file once
// both are published in production.

type Inline = string | { bold: string }

const b = (bold: string): Inline => ({ bold })
const inline = (parts: Inline[]): DocNode[] =>
  parts.map((part) =>
    typeof part === 'string' ? { type: 'text', text: part } : { type: 'text', text: part.bold, marks: [{ type: 'bold' }] }
  )
const h = (text: string): DocNode => ({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text }] })
const p = (...parts: Inline[]): DocNode => ({ type: 'paragraph', content: inline(parts) })
const ul = (...items: Inline[][]): DocNode => ({
  type: 'bulletList',
  content: items.map((parts) => ({ type: 'listItem', content: [p(...parts)] }))
})
const doc = (...content: DocNode[]): DocNode => ({ type: 'doc', content })

export const LEGACY_UPDATED = '23 Mei 2026'

export const LEGACY_LEGAL: Record<LegalSlug, DocNode> = {
  privacy: doc(
    h('Pendahuluan'),
    p(
      'Saloka.id menghormati privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan privasi ini akan menginformasikan bagaimana kami menjaga data pribadi Anda ketika Anda mengunjungi platform kami, menggunakan layanan kami, dan memberitahu Anda tentang hak privasi Anda.'
    ),
    h('1. Informasi Yang Kami Kumpulkan'),
    p(
      'Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar, membuat toko, mengunggah produk, atau menggunakan fitur-fitur platform kami:'
    ),
    ul(
      [b('Data Akun:'), ' Nama, alamat email, kata sandi, nomor telepon, dan biodata profil.'],
      [b('Data Bisnis:'), ' Nama merchant, kategori usaha, detail produk, stok, harga, dan koordinat geolokasi toko.'],
      [
        b('Data Pembayaran:'),
        ' Riwayat transaksi, saldo dompet, informasi rekening bank untuk penarikan dana, serta status pembayaran melalui gateway pembayaran DOKU.'
      ],
      [
        b('Data Penggunaan:'),
        ' Informasi tentang bagaimana Anda berinteraksi dengan platform kami, termasuk alamat IP, tipe browser, dan log aktivitas sistem.'
      ]
    ),
    h('2. Penggunaan Informasi Anda'),
    p('Kami menggunakan data yang dikumpulkan untuk tujuan berikut:'),
    ul(
      ['Menyediakan, mengoperasikan, dan memelihara fitur marketplace, LMS Academy, program afiliasi, dan forum komunitas.'],
      ['Memproses transaksi pembayaran secara aman menggunakan gateway pembayaran resmi.'],
      ['Menghitung dan memverifikasi estimasi biaya pengiriman (logistik) berdasarkan jarak geolokasi.'],
      ['Mendeteksi, mencegah, dan menangani aktivitas penipuan atau masalah keamanan teknis.'],
      ['Meningkatkan pengalaman pengguna platform melalui pengujian A/B dan optimalisasi antarmuka.']
    ),
    h('3. Keamanan Data'),
    p(
      'Kami mengimplementasikan langkah-langkah keamanan teknis dan organisasional yang dirancang untuk melindungi data pribadi Anda dari akses yang tidak sah, pengungkapan, perubahan, atau penghancuran. Saldo dompet dan transaksi dikelola secara ketat melalui audit internal ledger untuk memastikan integritas keuangan.'
    ),
    h('4. Pengungkapan Kepada Pihak Ketiga'),
    p(
      'Kami tidak menjual atau menyewakan informasi pribadi Anda. Kami hanya membagikan data kepada pihak ketiga yang bekerja sama dengan kami untuk menunjang operasional platform:'
    ),
    ul(
      [
        b('Penyedia Gateway Pembayaran (DOKU):'),
        ' Untuk memproses transaksi pembayaran kartu kredit, bank transfer, dan e-wallet.'
      ],
      [b('Layanan Kurir & Logistik:'), ' Untuk menghitung biaya pengiriman dan mengatur pengiriman barang belanjaan Anda.'],
      [b('Otoritas Hukum:'), ' Jika diwajibkan oleh undang-undang atau untuk mematuhi proses hukum yang sah.']
    )
  ),

  terms: doc(
    h('Penerimaan Ketentuan'),
    p(
      'Dengan mengakses dan menggunakan platform Saloka.id, Anda menyetujui untuk terikat oleh Syarat & Ketentuan Layanan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda tidak diperkenankan mengakses platform atau menggunakan layanan kami.'
    ),
    h('1. Deskripsi Layanan'),
    p('Saloka.id adalah platform all-in-one bagi pelaku usaha mikro, kecil, dan menengah yang menyediakan:'),
    ul(
      [b('Marketplace:'), ' Sarana promosi, penjualan produk, jasa, lowongan kerja, dan sistem checkout logistik berbasis jarak.'],
      [b('LMS Academy:'), ' Program pembelajaran interaktif untuk meningkatkan keterampilan bisnis.'],
      [b('Affiliate Hub:'), ' Program pemasaran afiliasi dengan pelacakan komisi dan pembagian bagi hasil otomatis.'],
      [b('Community Forum:'), ' Wadah interaksi sosial bagi pelaku usaha.']
    ),
    h('2. Akun Pengguna & Keamanan'),
    p(
      'Untuk menggunakan sebagian besar fitur platform, Anda diwajibkan membuat akun yang valid. Anda bertanggung jawab penuh atas kerahasiaan informasi akun dan kata sandi Anda. Anda wajib segera memberitahukan kami jika ada penggunaan akun tanpa izin atau pelanggaran keamanan lainnya.'
    ),
    h('3. Ketentuan Transaksi & Kebijakan Toko'),
    p('Dalam bertransaksi di Saloka.id, pengguna tunduk pada aturan berikut:'),
    ul(
      [
        b('Pembelian Produk Sendiri:'),
        ' Pengguna dengan status Merchant dilarang keras membeli produk dari toko miliknya sendiri untuk meminimalkan risiko manipulasi rating, transaksi fiktif, atau penyalahgunaan insentif poin.'
      ],
      [
        b('Keakuratan Informasi:'),
        ' Merchant wajib mengunggah deskripsi produk, stok barang, harga, dan gambar asli (mendukung format PNG/JPG) secara akurat.'
      ],
      [
        b('Penyelesaian Pembayaran:'),
        ' Semua transaksi diproses secara real-time melalui gateway pembayaran DOKU atau saldo Dompet Saloka. Transaksi dinyatakan sah setelah pembayaran terverifikasi sukses di sistem audit kas platform.'
      ]
    ),
    h('4. Batasan Tanggung Jawab'),
    p(
      'Saloka.id bertindak sebagai fasilitator platform dan tidak bertanggung jawab atas kerugian langsung atau tidak langsung yang diakibatkan oleh perselisihan antar pengguna (misal antara Merchant dan Pembeli), ketidakcocokan kualitas barang fisik, atau keterlambatan pengiriman oleh jasa kurir eksternal.'
    ),
    h('5. Perubahan Ketentuan'),
    p(
      'Kami berhak untuk mengubah, memperbarui, atau mengganti Syarat & Ketentuan Layanan ini kapan saja sesuai dengan perkembangan hukum dan fitur platform. Anda dianjurkan untuk memeriksa halaman ini secara berkala untuk mengetahui perubahan terbaru.'
    )
  )
}
