import { getCoinVouchers } from '@/app/actions/coin'
import Link from 'next/link'

export const metadata = {
  title: 'Tukar Coin dengan Voucher | Saloka.id',
  description: 'Tukar coin reward Anda dengan voucher diskon menarik dari berbagai merchant dan platform.',
}

export default async function VoucherCatalogPage() {
  const vouchers = await getCoinVouchers()

  const internal = vouchers.filter((v: any) => v.type === 'INTERNAL')
  const external = vouchers.filter((v: any) => v.type === 'EXTERNAL')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '32px 16px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎟️</div>
          <h1 style={{ color: '#f1f5f9', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            Katalog Voucher
          </h1>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 480, margin: '0 auto 20px' }}>
            Tukar coin reward kamu dengan voucher diskon internal maupun eksternal
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <Link href="/wallet/coin" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}>
              🪙 Lihat Saldo Coin Saya
            </Link>
          </div>
        </div>

        {vouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: '#475569' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Belum ada voucher tersedia</p>
            <p style={{ fontSize: 14 }}>Cek kembali nanti untuk voucher eksklusif</p>
          </div>
        ) : (
          <>
            {/* Internal Vouchers */}
            {internal.length > 0 && (
              <section style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                  }}>🏷️</div>
                  <div>
                    <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, margin: 0 }}>
                      Voucher Platform
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Diskon belanja di Saloka.id</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {internal.map((v: any) => (
                    <VoucherCard key={v.id} voucher={v} accentColor="#6366f1" accentGrad="135deg, #6366f1, #8b5cf6" />
                  ))}
                </div>
              </section>
            )}

            {/* External Vouchers */}
            {external.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                  }}>🎫</div>
                  <div>
                    <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, margin: 0 }}>
                      Voucher Eksternal
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Voucher TikTok, Shopee, dan lainnya</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {external.map((v: any) => (
                    <VoucherCard key={v.id} voucher={v} accentColor="#f59e0b" accentGrad="135deg, #f59e0b, #ef4444" />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* CTA */}
        <div style={{
          marginTop: 56, textAlign: 'center', padding: '32px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
        }}>
          <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Belum punya coin? Mulai dapat coin sekarang!
          </p>
          <p style={{ color: '#475569', fontSize: 14, marginBottom: 20 }}>
            Undang teman daftar pakai link referral kamu → dapat +1 coin per undangan
          </p>
          <Link href="/settings" style={{
            display: 'inline-flex', padding: '12px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15,
          }}>
            🔗 Salin Link Referral
          </Link>
        </div>
      </div>
    </div>
  )
}

function VoucherCard({ voucher, accentColor, accentGrad }: {
  voucher: any
  accentColor: string
  accentGrad: string
}) {
  const remaining = voucher.maxRedemption > 0 ? voucher.maxRedemption - voucher.totalRedeemed : null
  const isExpired = voucher.validUntil && new Date(voucher.validUntil) < new Date()

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid rgba(255,255,255,0.1)`,
      borderRadius: 18,
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px ${accentColor}33`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Top bar */}
      <div style={{ height: 6, background: `linear-gradient(${accentGrad})` }} />

      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h3 style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700, margin: 0, flex: 1 }}>
            {voucher.name}
          </h3>
          {isExpired && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 20,
              background: '#ef444422', color: '#f87171', fontWeight: 600, flexShrink: 0, marginLeft: 8
            }}>
              Kedaluwarsa
            </span>
          )}
        </div>

        <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
          {voucher.description}
        </p>

        {/* Value */}
        <div style={{
          background: `${accentColor}11`, borderRadius: 10, padding: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16,
        }}>
          <div>
            <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 2px' }}>Nilai Voucher</p>
            <p style={{ color: '#10b981', fontSize: 18, fontWeight: 700, margin: 0 }}>
              Rp {voucher.value.toLocaleString('id-ID')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 2px' }}>Biaya</p>
            <p style={{ color: accentColor, fontSize: 18, fontWeight: 700, margin: 0 }}>
              🪙 {voucher.coinCost}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {remaining !== null ? (
            <span style={{ color: '#475569', fontSize: 12 }}>Sisa: {remaining} kode</span>
          ) : (
            <span style={{ color: '#475569', fontSize: 12 }}>Unlimited</span>
          )}
          {voucher.validUntil && (
            <span style={{ color: '#475569', fontSize: 12 }}>
              Exp: {new Date(voucher.validUntil).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        <Link href="/wallet/coin" style={{
          display: 'block', textAlign: 'center', marginTop: 14,
          padding: '11px', borderRadius: 10,
          background: isExpired || (remaining !== null && remaining <= 0)
            ? 'rgba(255,255,255,0.06)'
            : `linear-gradient(${accentGrad})`,
          color: isExpired || (remaining !== null && remaining <= 0) ? '#475569' : '#fff',
          textDecoration: 'none', fontWeight: 700, fontSize: 14,
          pointerEvents: isExpired || (remaining !== null && remaining <= 0) ? 'none' : 'auto',
        }}>
          {isExpired ? 'Tidak Tersedia' : (remaining !== null && remaining <= 0) ? 'Habis' : '🎟️ Tukar Sekarang'}
        </Link>
      </div>
    </div>
  )
}
