const fs = require('fs');
const path = require('path');
const https = require('https');

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

function downloadSvg(mermaidCode, filename) {
  // mermaid.ink uses base64 string or JSON encoded in base64
  // Let's create the JSON configuration
  const config = {
    code: mermaidCode,
    mermaid: {
      theme: "default"
    }
  };
  
  const jsonStr = JSON.stringify(config);
  const base64 = Buffer.from(jsonStr).toString('base64');
  
  const url = `https://mermaid.ink/svg/${base64}`;
  const destDir = path.join(__dirname, 'public', 'images');
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const filePath = path.join(destDir, filename);
  const file = fs.createWriteStream(filePath);
  
  console.log(`Downloading SVG from: ${url.substring(0, 80)}...`);
  
  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${filename}: HTTP Status ${response.statusCode}`);
      return;
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Saved ${filename} to ${filePath}`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${filename}:`, err.message);
  });
}

downloadSvg(flowchartCode, 'flowchart.svg');
downloadSvg(erdCode, 'erd.svg');
