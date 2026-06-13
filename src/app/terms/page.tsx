import Link from 'next/link';

export const metadata = {
  title: 'Syarat & Ketentuan Layanan - Saloka.id',
  description: 'Syarat dan ketentuan layanan Saloka.id yang mengatur hak, kewajiban, dan tanggung jawab pengguna, merchant, serta pembeli di platform kami.',
};

export default function TermsPage() {
  return (
    <main className="relative min-h-screen bg-bg-dark pt-16 pb-24 px-6 md:px-10 text-text-primary" id="terms-of-service-page">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-geist font-bold text-text-secondary hover:text-primary tracking-wider uppercase mb-8 transition-colors"
          id="back-to-home-link-terms"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Beranda
        </Link>

        <h1 className="font-sora text-3xl font-extrabold text-text-primary mb-6">
          Syarat & Ketentuan <span className="text-primary">Layanan.</span>
        </h1>
        <p className="text-xs text-text-secondary mb-10">
          Terakhir Diperbarui: 23 Mei 2026
        </p>

        <div className="space-y-8 text-sm text-text-secondary leading-relaxed border border-border-subtle bg-surface-dark/60 p-6 md:p-10 rounded-xl backdrop-blur-md">
          <section className="space-y-3" id="sec-acceptance">
            <h2 className="font-sora text-base font-bold text-text-primary">Penerimaan Ketentuan</h2>
            <p>
              Dengan mengakses dan menggunakan platform Saloka.id, Anda menyetujui untuk terikat oleh Syarat & Ketentuan Layanan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda tidak diperkenankan mengakses platform atau menggunakan layanan kami.
            </p>
          </section>

          <section className="space-y-3" id="sec-description">
            <h2 className="font-sora text-base font-bold text-text-primary">1. Deskripsi Layanan</h2>
            <p>
              Saloka.id adalah platform all-in-one bagi pelaku usaha mikro, kecil, dan menengah yang menyediakan:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4 text-xs">
              <li><strong>Marketplace:</strong> Sarana promosi, penjualan produk, jasa, lowongan kerja, dan sistem checkout logistik berbasis jarak.</li>
              <li><strong>LMS Academy:</strong> Program pembelajaran interaktif untuk meningkatkan keterampilan bisnis.</li>
              <li><strong>Affiliate Hub:</strong> Program pemasaran afiliasi dengan pelacakan komisi dan pembagian bagi hasil otomatis.</li>
              <li><strong>Community Forum:</strong> Wadah interaksi sosial bagi pelaku usaha.</li>
            </ul>
          </section>

          <section className="space-y-3" id="sec-accounts">
            <h2 className="font-sora text-base font-bold text-text-primary">2. Akun Pengguna & Keamanan</h2>
            <p>
              Untuk menggunakan sebagian besar fitur platform, Anda diwajibkan membuat akun yang valid. Anda bertanggung jawab penuh atas kerahasiaan informasi akun dan kata sandi Anda. Anda wajib segera memberitahukan kami jika ada penggunaan akun tanpa izin atau pelanggaran keamanan lainnya.
            </p>
          </section>

          <section className="space-y-3" id="sec-obligations">
            <h2 className="font-sora text-base font-bold text-text-primary">3. Ketentuan Transaksi & Kebijakan Toko</h2>
            <p>
              Dalam bertransaksi di Saloka.id, pengguna tunduk pada aturan berikut:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4 text-xs">
              <li><strong>Pembelian Produk Sendiri:</strong> Pengguna dengan status Merchant dilarang keras membeli produk dari toko miliknya sendiri untuk meminimalkan risiko manipulasi rating, transaksi fiktif, atau penyalahgunaan insentif poin.</li>
              <li><strong>Keakuratan Informasi:</strong> Merchant wajib mengunggah deskripsi produk, stok barang, harga, dan gambar asli (mendukung format PNG/JPG) secara akurat.</li>
              <li><strong>Penyelesaian Pembayaran:</strong> Semua transaksi diproses secara real-time melalui gateway pembayaran Midtrans atau saldo Dompet Saloka. Transaksi dinyatakan sah setelah pembayaran terverifikasi sukses di sistem audit kas platform.</li>
            </ul>
          </section>

          <section className="space-y-3" id="sec-limitations">
            <h2 className="font-sora text-base font-bold text-text-primary">4. Batasan Tanggung Jawab</h2>
            <p>
              Saloka.id bertindak sebagai fasilitator platform dan tidak bertanggung jawab atas kerugian langsung atau tidak langsung yang diakibatkan oleh perselisihan antar pengguna (misal antara Merchant dan Pembeli), ketidakcocokan kualitas barang fisik, atau keterlambatan pengiriman oleh jasa kurir eksternal.
            </p>
          </section>

          <section className="space-y-3" id="sec-modifications">
            <h2 className="font-sora text-base font-bold text-text-primary">5. Perubahan Ketentuan</h2>
            <p>
              Kami berhak untuk mengubah, memperbarui, atau mengganti Syarat & Ketentuan Layanan ini kapan saja sesuai dengan perkembangan hukum dan fitur platform. Anda dianjurkan untuk memeriksa halaman ini secara berkala untuk mengetahui perubahan terbaru.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
