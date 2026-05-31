const fs = require('fs');
const path = require('path');
const https = require('https');
const PDFDocument = require('pdfkit');

const flowchartCode = `graph TD
    Start([Pengunjung / Registrasi]) -->|Isi Form| FormSelect{Pilih Jalur Form}
    
    FormSelect -->|1. Form Komunitas| FormKomunitas[Komunitas: Perkumpulan / Koperasi]
    FormKomunitas -->|Kelola Anggota| DashKomunitas[Dashboard Komunitas]
    DashKomunitas -->|Anggota Terdaftar| MemberList[Daftar Anggota]
    DashKomunitas -->|Bagi Hasil Penjualan| RoyaltyFee[Komisi Royalty & Penarikan Dana]
    
    FormSelect -->|2. Form Trader| FormTrader[Trader / Merchant]
    FormTrader -->|Gabung Komunitas/Koperasi| JoinKomunitas[Pilih Komunitas]
    JoinKomunitas -->|Kelola Usaha| DashTrader[Dashboard Trader]
    
    DashTrader -->|A. Landing Page Builder| LPBuilder[Visual Builder: Tema, Subdomain, Logo, Rekening, Marketplace]
    DashTrader -->|B. Dompet Digital| WalletTrader[Dompet Digital: Top Up / Belanja / Transaksi]
    DashTrader -->|C. Akademi Digital| LMSTrader[Akademi LMS: Video, Sertifikat, Naik Level]
    DashTrader -->|D. Laporan Transaksi| TxTrader[Transaksi: Penjualan, Pendapatan, Riwayat]
    DashTrader -->|E. Kemitraan Afiliasi| AffTrader[Afiliasi: Komisi, Penarikan, Link Afiliasi]
    
    LMSTrader -->|Evaluasi Tingkat Jarak| LevelRules{Sistem Leveling & Radius}
    LevelRules -->|Level 1| R1[Jangkauan Peta & Pengiriman <= 5 km]
    LevelRules -->|Level 2| R2[Jangkauan Peta & Pengiriman <= 10 km]
    LevelRules -->|Level 3| R3[Jangkauan Peta & Pengiriman <= 20 km]
    LevelRules -->|Level 4| R4[Jangkauan Peta & Pengiriman Unlimited]
    
    FormSelect -->|3. Form Afiliator| FormAffiliate[Afiliator / Visitor]
    FormAffiliate -->|Kelola Rujukan| DashAffiliate[Dashboard Afiliator]
    DashAffiliate -->|Profil Pengguna| ProfileAff[Profil & Pengaturan Akun]
    DashAffiliate -->|Dompet Digital| WalletAff[Dompet Digital: Top Up / Belanja]
    DashAffiliate -->|Jejaring Afiliasi| NetAff[Afiliasi: Daftar Produk, Komisi, Penarikan, Riwayat, Banner Promosi]

    LPBuilder -->|Publish Landing Page| PublicLP[Landing Page Publik & QR Code]
    NetAff -->|Bagikan Tautan Produk| PublicLP
    PublicLP -->|Checkout / Beli Produk| OrderTx[Proses Transaksi & Pembayaran]
    OrderTx -->|Royalty 3-Tier| RoyaltyFee
    OrderTx -->|Komisi Afiliasi| NetAff
    OrderTx -->|Pendapatan Trader| TxTrader`;

const erdCode = `erDiagram
    User {
        String id PK
        String email UK
        String name
        String passwordHash
        Role role
        Float latitude
        Float longitude
        Int level
        Int xp
        Float points
        String landingPageTemplate
        String landingPageConfig
        Boolean landingPageSetup
        String parentAffiliateId FK
        String membershipLevel
        String membershipAccess
        DateTime createdAt
        DateTime updatedAt
    }

    Wallet {
        String id PK
        Float balance
        String userId FK
        DateTime createdAt
        DateTime updatedAt
    }

    WalletTransaction {
        String id PK
        Float amount
        TransactionType type
        String description
        String walletId FK
        DateTime createdAt
    }

    Product {
        String id PK
        String title
        String description
        Float price
        ProductCategory category
        Int stock
        String imageUrl
        Float latitude
        Float longitude
        String jvPartnerId
        Float jvSharePercent
        String merchantId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Order {
        String id PK
        Float totalAmount
        OrderStatus status
        String buyerId FK
        Float shippingFee
        String courier
        String shippingAddress
        String shippingLabel
        String couponCode
        Float discountAmount
        String bumpSales
        DateTime createdAt
        DateTime updatedAt
    }

    OrderItem {
        String id PK
        Int quantity
        Float price
        String orderId FK
        String productId FK
    }

    Course {
        String id PK
        String title
        String description
        String coverImage
        String accessRequired
        DateTime createdAt
        DateTime updatedAt
    }

    Lesson {
        String id PK
        String title
        String content
        String videoUrl
        Int duration
        Int orderIndex
        String courseId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Progress {
        String id PK
        Boolean completed
        String userId FK
        String lessonId FK
        DateTime createdAt
        DateTime updatedAt
    }

    CommunityGroup {
        String id PK
        String name
        String description
        String coverUrl
        String avatarUrl
        Boolean isSuspended
        String adminId FK
        DateTime createdAt
        DateTime updatedAt
    }

    GroupMember {
        String id PK
        String groupId FK
        String userId FK
        DateTime createdAt
    }

    AffiliateReferral {
        String id PK
        Float amount
        PayoutStatus status
        String affiliateId FK
        String buyerId FK
        DateTime createdAt
        DateTime updatedAt
    }

    User ||--o| Wallet : "memiliki"
    Wallet ||--o{ WalletTransaction : "mencatat"
    User ||--o{ Product : "menjual"
    User ||--o{ Order : "melakukan transaksi"
    Order ||--o{ OrderItem : "memiliki item"
    Product ||--o{ OrderItem : "dipesan di"
    User ||--o{ Progress : "menyelesaikan kelas"
    Course ||--o{ Lesson : "berisi"
    Lesson ||--o{ Progress : "diikuti dalam"
    User ||--o{ CommunityGroup : "mengelola"
    CommunityGroup ||--o{ GroupMember : "memiliki anggota"
    User ||--o{ GroupMember : "terdaftar sebagai"
    User ||--o{ AffiliateReferral : "menerima komisi"`;

function downloadPng(mermaidCode, filename, callback) {
  const config = {
    code: mermaidCode,
    mermaid: {
      theme: "default",
      themeVariables: {
        background: "#ffffff"
      }
    }
  };
  
  const jsonStr = JSON.stringify(config);
  const base64 = Buffer.from(jsonStr).toString('base64');
  const url = `https://mermaid.ink/img/${base64}`;
  const destDir = path.join(__dirname, 'public', 'images');
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const filePath = path.join(destDir, filename);
  const file = fs.createWriteStream(filePath);
  
  console.log(`Downloading PNG from: ${url.substring(0, 80)}...`);
  
  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${filename}: HTTP Status ${response.statusCode}`);
      return;
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Saved ${filename} to ${filePath}`);
      if (callback) callback(filePath);
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${filename}:`, err.message);
  });
}

// Track downloads
let flowchartPath = null;
let erdPath = null;

function checkAndBuild() {
  if (flowchartPath && erdPath) {
    buildPdf();
  }
}

downloadPng(flowchartCode, 'flowchart.png', (filePath) => {
  flowchartPath = filePath;
  checkAndBuild();
});

downloadPng(erdCode, 'erd.png', (filePath) => {
  erdPath = filePath;
  checkAndBuild();
});

function buildPdf() {
  console.log('Generating PDF...');
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const outputDir = path.join(__dirname, 'public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const pdfPath = path.join(outputDir, 'teras_umkm_erd_flowchart.pdf');
  const stream = fs.createWriteStream(pdfPath);
  
  doc.pipe(stream);
  
  // PAGE 1: COVER PAGE
  doc.rect(0, 0, 595.28, 841.89).fill('#171717'); // Dark slate background
  
  // Title
  doc.fillColor('#facc15').font('Helvetica-Bold').fontSize(26);
  doc.text('DOKUMEN SPESIFIKASI TEKNIS', 40, 200, { align: 'center' });
  doc.text('TERAS UMKM', 40, 240, { align: 'center' });
  
  // Horizontal divider
  doc.rect(100, 290, 395, 4).fill('#facc15');
  
  // Subtitle
  doc.fillColor('#ffffff').font('Helvetica').fontSize(14);
  doc.text('Diagram Alur Proses Bisnis (Flowchart) &', 40, 320, { align: 'center' });
  doc.text('Entity Relationship Diagram (ERD) Database', 40, 345, { align: 'center' });
  
  // Prepared by / Date
  doc.fillColor('#a3a3a3').fontSize(10);
  doc.text('Disiapkan Untuk: Koperasi, Mitra UMKM, & Dosen Penguji', 40, 550, { align: 'center' });
  doc.text('Tanggal Pembuatan: Mei 2026', 40, 570, { align: 'center' });
  doc.text('Versi: 1.0 (Final Revisi)', 40, 590, { align: 'center' });
  
  // Logo placeholder text / styling
  doc.fillColor('#facc15').fontSize(36).font('Helvetica-Bold');
  doc.text('T', 40, 80, { align: 'center' });
  
  // PAGE 2: PENGANTAR & DAFTAR ISI
  doc.addPage().fillColor('#000000');
  doc.rect(40, 40, 515, 2).fill('#facc15');
  
  doc.fillColor('#171717').font('Helvetica-Bold').fontSize(18);
  doc.text('1. Pendahuluan', 40, 60);
  doc.moveDown();
  
  doc.font('Helvetica').fontSize(11).fillColor('#374151');
  const introText = 'Dokumen ini memuat spesifikasi teknis dan visual dari platform Teras UMKM. Penyusunan dokumen ini didasarkan pada dua kebutuhan utama:\n\n' +
    '1. Kebutuhan Klien (Bisnis): Alur registrasi terpisah (Komunitas/Koperasi, Trader/Merchant, Afiliator/Visitor), kustomisasi landing page visual, dompet digital belanja/top-up, leveling radius geofencing LMS (5km s.d unlimited), transaksi penjualan/pendapatan, komisi afiliasi multi-tier, serta banner promosi.\n\n' +
    '2. Kebutuhan Dosen (Akademik): Penggunaan Next.js & Prisma ORM, pemisah hak akses user, relasi database type-safe, dan sistem antrean Live Chat Multi-Agent untuk Customer Service.\n\n' +
    'Dengan penyelarasan ini, platform Teras UMKM siap diuji dan dideploy untuk kebutuhan produksi.';
  
  doc.text(introText, { align: 'justify', lineGap: 4 });
  doc.moveDown(2);
  
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#171717');
  doc.text('2. Daftar Isi', 40, 320);
  doc.moveDown();
  
  doc.font('Helvetica').fontSize(11).fillColor('#374151');
  const contents = [
    { page: 'Halaman 1', title: 'Cover Dokumen' },
    { page: 'Halaman 2', title: '1. Pendahuluan & 2. Daftar Isi' },
    { page: 'Halaman 3', title: '3. Diagram Alur Proses Bisnis (Flowchart)' },
    { page: 'Halaman 4', title: '4. Entity Relationship Diagram (ERD) Relasi Database' },
    { page: 'Halaman 5', title: '5. Kamus Data & Spesifikasi Tabel Utama' },
    { page: 'Halaman 6', title: '6. Matriks Keselarasan Persyaratan Klien & Dosen' }
  ];
  
  contents.forEach((c) => {
    doc.text(`${c.title}`, { continued: true });
    doc.text(` ..................................................................................................................... `, { continued: true, fillColor: '#9ca3af' });
    doc.text(`${c.page}`, { align: 'right', fillColor: '#171717' });
    doc.moveDown(0.8);
  });
  
  // PAGE 3: FLOWCHART PROCESS
  doc.addPage();
  doc.rect(40, 40, 515, 2).fill('#facc15');
  doc.fillColor('#171717').font('Helvetica-Bold').fontSize(18);
  doc.text('3. Diagram Alur Proses Bisnis (Flowchart)', 40, 60);
  doc.moveDown(0.5);
  
  doc.font('Helvetica').fontSize(10).fillColor('#4b5563');
  doc.text('Diagram di bawah menggambarkan alur registrasi pengguna yang terbagi menjadi Komunitas (Koperasi), Trader (Merchant), dan Afiliator beserta integrasi transaksinya:', { lineGap: 3 });
  doc.moveDown();
  
  // Embed Flowchart Image
  try {
    doc.image(flowchartPath, 40, 130, { fit: [515, 450], align: 'center', valign: 'center' });
  } catch (e) {
    doc.text('[Error loading flowchart image]', 40, 200);
  }
  
  // Explanation of Flowchart Roles
  doc.y = 590;
  doc.fillColor('#171717').font('Helvetica-Bold').fontSize(11);
  doc.text('Penjelasan Alur Peran (Roles):');
  doc.font('Helvetica').fontSize(9.5).fillColor('#374151');
  doc.text('• Komunitas/Koperasi: Mengelola registrasi kelompok dan menerima royalty bagi hasil.', { indent: 10, lineGap: 2 });
  doc.text('• Trader/Merchant: Memiliki domain/subdomain, Visual Landing Page Builder, Dompet Digital (Top-up/belanja), Akademi LMS dengan geofencing radius (naik level memperluas jarak), laporan penjualan, dan manajemen afiliasi.', { indent: 10, lineGap: 2 });
  doc.text('• Afiliator/Visitor: Mempromosikan katalog produk, membagikan link afiliasi/banner, merekrut downline jaringan berjenjang, dan menarik dana komisi.', { indent: 10, lineGap: 2 });
  
  // PAGE 4: ERD DATABASE
  doc.addPage();
  doc.rect(40, 40, 515, 2).fill('#facc15');
  doc.fillColor('#171717').font('Helvetica-Bold').fontSize(18);
  doc.text('4. Entity Relationship Diagram (ERD) Database', 40, 60);
  doc.moveDown(0.5);
  
  doc.font('Helvetica').fontSize(10).fillColor('#4b5563');
  doc.text('Relasi antartabel database yang menjamin integritas data (type-safe) dengan Prisma ORM:', { lineGap: 3 });
  doc.moveDown();
  
  // Embed ERD Image
  try {
    doc.image(erdPath, 40, 120, { fit: [515, 520], align: 'center', valign: 'center' });
  } catch (e) {
    doc.text('[Error loading ERD image]', 40, 200);
  }
  
  doc.y = 660;
  doc.fillColor('#171717').font('Helvetica-Bold').fontSize(11);
  doc.text('Karakteristik Skema Database:');
  doc.font('Helvetica').fontSize(9.5).fillColor('#374151');
  doc.text('• Type-safe: Hubungan strict foreign keys untuk User, Wallet, Order, Product, dan Group.', { indent: 10, lineGap: 2 });
  doc.text('• Multi-tier Downline: Relasi pohon (self-relation parentAffiliateId) pada tabel User.', { indent: 10, lineGap: 2 });
  doc.text('• Geofencing & LMS: Koordinat latitude/longitude toko dan level merchant terhubung dengan progress penyelesaian modul akademi.', { indent: 10, lineGap: 2 });
  
  // PAGE 5: KAMUS DATA
  doc.addPage();
  doc.rect(40, 40, 515, 2).fill('#facc15');
  doc.fillColor('#171717').font('Helvetica-Bold').fontSize(18);
  doc.text('5. Kamus Data & Spesifikasi Tabel', 40, 60);
  doc.moveDown();
  
  doc.font('Helvetica').fontSize(10).fillColor('#374151');
  
  const tablesInfo = [
    { name: 'User', desc: 'Menyimpan profil, password hash, peran (CUSTOMER/MERCHANT/AFFILIATE/CS), level, koordinat GPS geofencing, kustomisasi landing page, dan relasi rujukan downline.' },
    { name: 'Wallet & WalletTransaction', desc: 'Mengatur dompet saldo digital (ledger), top-up, pencairan komisi (withdrawal), dan riwayat bagi hasil secara berkala.' },
    { name: 'Product & ProductCategory', desc: 'Katalog produk milik merchant (makanan, fashion, dll.) yang dilengkapi koordinat lokasi outlet untuk geofencing terdekat.' },
    { name: 'Order & OrderItem & Tracking', desc: 'Mencatat transaksi belanja, alamat pengiriman, status pembayaran, serta langkah pelacakan status logistik.' },
    { name: 'Course & Lesson & Progress', desc: 'Modul materi video pembelajaran Akademi Digital (LMS) beserta perekaman status selesai untuk syarat naik level radius.' },
    { name: 'CommunityGroup & GroupMember', desc: 'Mewakili entitas Koperasi / Jaringan Perkumpulan, daftar anggota terdaftar, serta koordinasi diskusi forum.' },
    { name: 'AffiliateReferral', desc: 'Mencatat perolehan komisi pemasaran dari hasil rujukan link afiliasi pembeli.' },
    { name: 'ChatRoom & ChatMessage & Support', desc: 'Saluran bantuan interaksi real-time pelanggan dengan Merchant (Toko) dan CS Multi-Agent.' }
  ];
  
  tablesInfo.forEach((t) => {
    doc.fillColor('#171717').font('Helvetica-Bold').fontSize(11).text(`• Tabel: ${t.name}`);
    doc.fillColor('#374151').font('Helvetica').fontSize(9.5).text(t.desc, { indent: 12, lineGap: 2 });
    doc.moveDown(0.8);
  });
  
  // PAGE 6: MATRIKS KESESUAIAN & PENUTUP
  doc.addPage();
  doc.rect(40, 40, 515, 2).fill('#facc15');
  doc.fillColor('#171717').font('Helvetica-Bold').fontSize(18);
  doc.text('6. Matriks Keselarasan Kebutuhan & Penutup', 40, 60);
  doc.moveDown();
  
  doc.font('Helvetica-Bold').fontSize(11).text('Tabel Evaluasi Pemenuhan Persyaratan:');
  doc.moveDown(0.5);
  
  // Simple table styling
  const startX = 40;
  let startY = 110;
  
  // Table headers
  doc.rect(startX, startY, 515, 20).fill('#171717');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('Fitur / Persyaratan', startX + 10, startY + 5);
  doc.text('Pemenuhan Skema Database', startX + 170, startY + 5);
  doc.text('Status', startX + 460, startY + 5);
  
  startY += 20;
  
  const matrixData = [
    { req: 'Jalur Koperasi/Komunitas', compliance: 'Tabel CommunityGroup & GroupMember', status: 'Sesuai' },
    { req: 'Royalty & Penarikan', compliance: 'WalletTransaction & PayoutStatus', status: 'Sesuai' },
    { req: 'Visual Landing Page', compliance: 'landingPageTemplate & Config di User', status: 'Sesuai' },
    { req: 'Dompet Digital & Belanja', compliance: 'Wallet & Order & OrderItem', status: 'Sesuai' },
    { req: 'Akademi LMS & Leveling', compliance: 'Course, Lesson, Progress, User.level', status: 'Sesuai' },
    { req: 'Radius Jarak (5km-unlim)', compliance: 'Geofencing via latitude & longitude', status: 'Sesuai' },
    { req: 'Kemitraan & Downline', compliance: 'Self-relation parentAffiliateId User', status: 'Sesuai' },
    { req: 'Multi-Agent Live Chat CS', compliance: 'ChatRoom, ChatMessage, SupportTicket', status: 'Sesuai' }
  ];
  
  doc.font('Helvetica').fontSize(9).fillColor('#374151');
  matrixData.forEach((row, i) => {
    // Zebra striping background
    if (i % 2 === 0) {
      doc.rect(startX, startY, 515, 22).fill('#f9fafb');
    } else {
      doc.rect(startX, startY, 515, 22).fill('#f3f4f6');
    }
    
    doc.fillColor('#171717').font('Helvetica-Bold').text(row.req, startX + 10, startY + 6);
    doc.font('Helvetica').fillColor('#374151').text(row.compliance, startX + 170, startY + 6);
    doc.fillColor('#15803d').font('Helvetica-Bold').text(row.status, startX + 460, startY + 6);
    
    startY += 22;
  });
  
  // Footer / Conclusion text
  doc.y = startY + 30;
  doc.fillColor('#171717').font('Helvetica-Bold').fontSize(12);
  doc.text('Kesimpulan & Penutup');
  doc.font('Helvetica').fontSize(10).fillColor('#4b5563');
  const conclusionText = 'Dokumen spesifikasi teknis ini membuktikan bahwa database relasional Teras UMKM telah dirancang dengan matang untuk memenuhi seluruh alur operasional bisnis klien (seperti radius geofencing tingkat, pendaftaran koperasi, dompet saldo digital) sekaligus memenuhi aspek akademis dosen (seperti type-safety ORM, multi-agent support queue). Seluruh komponen terintegrasi dengan kokoh di dalam Next.js & Prisma ORM.';
  doc.text(conclusionText, { align: 'justify', lineGap: 3 });
  
  // End of doc
  doc.end();
  console.log(`PDF successfully generated at: ${pdfPath}`);
}
