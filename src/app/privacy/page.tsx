import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Privasi - Saloka.id',
  description: 'Kebijakan privasi Saloka.id menjelaskan bagaimana kami mengumpulkan, melindungi, dan menggunakan informasi pribadi Anda pada platform kami.',
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-bg-dark pt-16 pb-24 px-6 md:px-10 text-text-primary" id="privacy-policy-page">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-geist font-bold text-text-secondary hover:text-primary tracking-wider uppercase mb-8 transition-colors"
          id="back-to-home-link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Beranda
        </Link>

        <h1 className="font-sora text-3xl font-extrabold text-text-primary mb-6">
          Kebijakan <span className="text-primary">Privasi.</span>
        </h1>
        <p className="text-xs text-text-secondary mb-10">
          Terakhir Diperbarui: 23 Mei 2026
        </p>

        <div className="space-y-8 text-sm text-text-secondary leading-relaxed border border-border-subtle bg-surface-dark/60 p-6 md:p-10 rounded-xl backdrop-blur-md">
          <section className="space-y-3" id="sec-intro">
            <h2 className="font-sora text-base font-bold text-text-primary">Pendahuluan</h2>
            <p>
              Saloka.id menghormati privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan privasi ini akan menginformasikan bagaimana kami menjaga data pribadi Anda ketika Anda mengunjungi platform kami, menggunakan layanan kami, dan memberitahu Anda tentang hak privasi Anda.
            </p>
          </section>

          <section className="space-y-3" id="sec-information-gathering">
            <h2 className="font-sora text-base font-bold text-text-primary">1. Informasi Yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar, membuat toko, mengunggah produk, atau menggunakan fitur-fitur platform kami:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4 text-xs">
              <li><strong>Data Akun:</strong> Nama, alamat email, kata sandi, nomor telepon, dan biodata profil.</li>
              <li><strong>Data Bisnis:</strong> Nama merchant, kategori usaha, detail produk, stok, harga, dan koordinat geolokasi toko.</li>
              <li><strong>Data Pembayaran:</strong> Riwayat transaksi, saldo dompet, informasi rekening bank untuk penarikan dana, serta status pembayaran melalui gateway pembayaran Midtrans.</li>
              <li><strong>Data Penggunaan:</strong> Informasi tentang bagaimana Anda berinteraksi dengan platform kami, termasuk alamat IP, tipe browser, dan log aktivitas sistem.</li>
            </ul>
          </section>

          <section className="space-y-3" id="sec-information-usage">
            <h2 className="font-sora text-base font-bold text-text-primary">2. Penggunaan Informasi Anda</h2>
            <p>
              Kami menggunakan data yang dikumpulkan untuk tujuan berikut:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4 text-xs">
              <li>Menyediakan, mengoperasikan, dan memelihara fitur marketplace, LMS Academy, program afiliasi, dan forum komunitas.</li>
              <li>Memproses transaksi pembayaran secara aman menggunakan gateway pembayaran resmi.</li>
              <li>Menghitung dan memverifikasi estimasi biaya pengiriman (logistik) berdasarkan jarak geolokasi.</li>
              <li>Mendeteksi, mencegah, dan menangani aktivitas penipuan atau masalah keamanan teknis.</li>
              <li>Meningkatkan pengalaman pengguna platform melalui pengujian A/B dan optimalisasi antarmuka.</li>
            </ul>
          </section>

          <section className="space-y-3" id="sec-information-security">
            <h2 className="font-sora text-base font-bold text-text-primary">3. Keamanan Data</h2>
            <p>
              Kami mengimplementasikan langkah-langkah keamanan teknis dan organisasional yang dirancang untuk melindungi data pribadi Anda dari akses yang tidak sah, pengungkapan, perubahan, atau penghancuran. Saldo dompet dan transaksi dikelola secara ketat melalui audit internal ledger untuk memastikan integritas keuangan.
            </p>
          </section>

          <section className="space-y-3" id="sec-third-party">
            <h2 className="font-sora text-base font-bold text-text-primary">4. Pengungkapan Kepada Pihak Ketiga</h2>
            <p>
              Kami tidak menjual atau menyewakan informasi pribadi Anda. Kami hanya membagikan data kepada pihak ketiga yang bekerja sama dengan kami untuk menunjang operasional platform:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-4 text-xs">
              <li><strong>Penyedia Gateway Pembayaran (Midtrans):</strong> Untuk memproses transaksi pembayaran kartu kredit, bank transfer, dan e-wallet.</li>
              <li><strong>Layanan Kurir & Logistik:</strong> Untuk menghitung biaya pengiriman dan mengatur pengiriman barang belanjaan Anda.</li>
              <li><strong>Otoritas Hukum:</strong> Jika diwajibkan oleh undang-undang atau untuk mematuhi proses hukum yang sah.</li>
            </ul>
          </section>

          <section className="space-y-3" id="sec-contact">
            <h2 className="font-sora text-base font-bold text-text-primary">5. Kontak Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau pengelolaan data Anda, silakan hubungi tim dukungan Saloka.id melalui email di <span className="text-primary font-bold">support@Saloka.id.id</span>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
