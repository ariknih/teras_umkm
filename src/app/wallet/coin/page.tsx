'use client'

import { useState, useEffect } from 'react'
import { goeyToast } from 'goey-toast'
import { getUserCoinBalance, getCoinTransactionHistory, getUserRedemptions, getCoinVouchers, redeemCoinVoucher } from '@/app/actions/coin'

type CoinTx = {
  id: string
  type: string
  amount: number
  description: string
  createdAt: Date | string
}

type Voucher = {
  id: string
  name: string
  description: string
  type: string
  coinCost: number
  value: number
  code?: string
  maxRedemption: number
  totalRedeemed: number
  isActive: boolean
  validUntil?: Date | string | null
}

type Redemption = {
  id: string
  coinSpent: number
  status: string
  claimCode: string | null
  claimedAt: Date | string | null
  createdAt: Date | string
  voucher: Voucher | null
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function TxTypeLabel({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    TOPUP: { label: 'Top Up', color: '#10B981', icon: '⬆️' },
    REWARD_USER_INVITE: { label: 'Reward Undangan', color: '#2DB24A', icon: '🎁' },
    REWARD_MERCHANT_INVITE: { label: 'Reward Merchant', color: '#15803D', icon: '🤝' },
    REDEEM_VOUCHER: { label: 'Redeem Voucher', color: '#D97706', icon: '🎟️' },
    DISTRIBUTE: { label: 'Distribusi', color: '#2563EB', icon: '📤' },
  }
  const info = map[type] || { label: type, color: '#9CA3AF', icon: '•' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 20,
      background: info.color + '15', color: info.color,
      fontSize: 12, fontWeight: 600
    }}>
      {info.icon} {info.label}
    </span>
  )
}

export default function WalletCoinPage() {
  const [balance, setBalance] = useState<number>(0)
  const [txs, setTxs] = useState<CoinTx[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'history' | 'voucher' | 'my-voucher'>('history')
  const [redeemLoading, setRedeemLoading] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [bal, history, voucherList, redemptionList] = await Promise.all([
        getUserCoinBalance(),
        getCoinTransactionHistory(),
        getCoinVouchers(),
        getUserRedemptions(),
      ])
      setBalance(bal)
      setTxs(history as CoinTx[])
      setVouchers(voucherList as Voucher[])
      setRedemptions(redemptionList as Redemption[])
      setLoading(false)
    }
    load()
  }, [])

  const handleRedeem = async (voucherId: string) => {
    setRedeemLoading(voucherId)
    const res = await redeemCoinVoucher(voucherId)
    setRedeemLoading(null)
    if ('error' in res) {
      goeyToast.error(res.error as string)
    } else {
      goeyToast.success(`Berhasil menukar voucher! Kode klaim: ${res.claimCode}`)
      // Refresh
      const [bal, history, voucherList, redemptionList] = await Promise.all([
        getUserCoinBalance(),
        getCoinTransactionHistory(),
        getCoinVouchers(),
        getUserRedemptions(),
      ])
      setBalance(bal)
      setTxs(history as CoinTx[])
      setVouchers(voucherList as Voucher[])
      setRedemptions(redemptionList as Redemption[])
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F7F5',
      padding: '24px 16px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <a href="/wallet" style={{ color: '#2DB24A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            ← Kembali ke Wallet
          </a>
          <h1 style={{ color: '#111827', fontSize: 26, fontWeight: 700, margin: '8px 0 4px' }}>
            💰 Wallet Coin
          </h1>
          <p style={{ color: '#4B5563', fontSize: 14 }}>Kelola coin reward dan tukar dengan voucher menarik</p>
        </div>

        {/* Balance Card */}
        <div style={{
          background: 'linear-gradient(135deg, #2DB24A 0%, #198754 50%, #0F5132 100%)',
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 30px rgba(45, 178, 74, 0.2)',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)'
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
              Saldo Coin Kamu
            </p>
            {loading ? (
              <div style={{ height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 8, width: 140, animation: 'pulse 1.5s infinite' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ color: '#fff', fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>
                  {balance.toLocaleString('id-ID')}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: 600 }}>coin</span>
              </div>
            )}
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 }}>
              ≈ Rp {(balance * 1500).toLocaleString('id-ID')} (estimasi nilai)
            </p>
          </div>
        </div>

        {/* Info cara dapat coin */}
        <div style={{
          background: 'rgba(45, 178, 74, 0.08)',
          border: '1px solid rgba(45, 178, 74, 0.2)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 24,
        }}>
          <p style={{ color: '#0F5132', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>💡 Cara Dapat Coin:</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { icon: '👥', text: 'Undang user baru daftar dengan link referral kamu → +1 coin' },
              { icon: '🤝', text: 'Undang merchant ke komunitas (PERKUMPULAN) → +5 coin' },
              { icon: '💳', text: 'Anggota koperasi mengundang merchant → dapat saldo reward' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ color: '#374151', fontSize: 13 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#FFFFFF', borderRadius: 12, padding: 4, border: '1px solid #E5E7EB' }}>
          {[
            { key: 'history', label: '📋 Riwayat' },
            { key: 'voucher', label: '🎟️ Tukar Voucher' },
            { key: 'my-voucher', label: '✅ Voucher Saya' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none',
                background: activeTab === tab.key ? '#2DB24A' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#4B5563',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Riwayat */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: 72, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
              ))
            ) : txs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🪙</div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Belum ada transaksi coin</p>
                <p style={{ fontSize: 13 }}>Mulai undang teman untuk dapat coin!</p>
              </div>
            ) : txs.map(tx => (
              <div key={tx.id} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 14, padding: '14px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <TxTypeLabel type={tx.type} />
                  <span style={{ color: '#4B5563', fontSize: 12 }}>{tx.description}</span>
                  <span style={{ color: '#9CA3AF', fontSize: 11 }}>{formatDate(tx.createdAt)}</span>
                </div>
                <span style={{
                  color: tx.amount >= 0 ? '#2DB24A' : '#DC2626',
                  fontWeight: 700, fontSize: 18, flexShrink: 0
                }}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount} 🪙
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tukar Voucher */}
        {activeTab === 'voucher' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: 120, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
              ))
            ) : vouchers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎟️</div>
                <p style={{ fontWeight: 600 }}>Belum ada voucher tersedia</p>
              </div>
            ) : vouchers.map(v => (
              <div key={v.id} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 16, padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                  background: v.type === 'INTERNAL' ? 'linear-gradient(135deg,#2DB24A,#198754)' : 'linear-gradient(135deg,#F59E0B,#D97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
                }}>
                  {v.type === 'INTERNAL' ? '🏷️' : '🎫'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ color: '#111827', fontWeight: 700, fontSize: 15 }}>{v.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: v.type === 'INTERNAL' ? 'rgba(45,178,74,0.1)' : 'rgba(217,119,6,0.1)',
                      color: v.type === 'INTERNAL' ? '#2DB24A' : '#D97706'
                    }}>
                      {v.type === 'INTERNAL' ? 'Platform' : 'Eksternal'}
                    </span>
                  </div>
                  <p style={{ color: '#4B5563', fontSize: 13, marginBottom: 8 }}>{v.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ color: '#2DB24A', fontWeight: 700, fontSize: 15 }}>
                      🪙 {v.coinCost} coin
                    </span>
                    <span style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>
                      ≈ Rp {v.value.toLocaleString('id-ID')}
                    </span>
                    {v.maxRedemption > 0 && (
                      <span style={{ color: '#6B7280', fontSize: 12 }}>
                        Sisa: {v.maxRedemption - v.totalRedeemed}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  id={`redeem-btn-${v.id}`}
                  onClick={() => handleRedeem(v.id)}
                  disabled={redeemLoading === v.id || balance < v.coinCost}
                  style={{
                    padding: '10px 18px', borderRadius: 12, border: 'none',
                    background: balance >= v.coinCost ? 'linear-gradient(135deg,#2DB24A,#198754)' : '#F3F4F6',
                    color: balance >= v.coinCost ? '#fff' : '#9CA3AF',
                    fontWeight: 700, fontSize: 14, cursor: balance >= v.coinCost ? 'pointer' : 'not-allowed',
                    flexShrink: 0, transition: 'all 0.2s',
                    opacity: redeemLoading === v.id ? 0.7 : 1,
                  }}
                >
                  {redeemLoading === v.id ? '...' : 'Tukar'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Voucher Saya */}
        {activeTab === 'my-voucher' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: 100, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
              ))
            ) : redemptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ fontWeight: 600 }}>Belum ada voucher yang kamu tukar</p>
                <button onClick={() => setActiveTab('voucher')} style={{
                  marginTop: 12, padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: '#2DB24A', color: '#fff', fontWeight: 600, cursor: 'pointer'
                }}>
                  Lihat Voucher Tersedia
                </button>
              </div>
            ) : redemptions.map(r => (
              <div key={r.id} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 14, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ color: '#111827', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                      {r.voucher?.name || 'Voucher'}
                    </p>
                    <p style={{ color: '#4B5563', fontSize: 13, marginBottom: 8 }}>
                      Ditukar: {r.coinSpent} coin • {formatDate(r.createdAt)}
                    </p>
                    {r.claimCode && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(45,178,74,0.1)', border: '1px solid rgba(45,178,74,0.3)',
                        borderRadius: 10, padding: '8px 14px'
                      }}>
                        <span style={{ color: '#2DB24A', fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
                          {r.claimCode}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(r.claimCode!)
                            goeyToast.success('Kode disalin!')
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2DB24A', fontSize: 14 }}
                          title="Salin kode"
                        >
                          📋
                        </button>
                      </div>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: r.status === 'CLAIMED' ? '#DEF7EC' : '#FEF08A',
                    color: r.status === 'CLAIMED' ? '#03543F' : '#854D0E',
                  }}>
                    {r.status === 'CLAIMED' ? '✅ Diklaim' : r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}

