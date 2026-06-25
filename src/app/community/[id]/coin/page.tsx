'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { goeyToast } from 'goey-toast'
import { getCommunityCoinBalance, topupCommunityCoin, checkCommunityLoanEligibility } from '@/app/actions/coin'
import { getIndukCommunityDetail } from '@/app/actions/community'
import { getCurrentUserProfile } from '@/app/actions/auth'

const COIN_RATE = 1500 // 1 coin = Rp 1.500

export default function CommunityCoinPage() {
  const params = useParams()
  const communityId = params.id as string

  const [community, setCommunity] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [coinData, setCoinData] = useState<{ coinBalance: number; minCoinForLoan: number } | null>(null)
  const [loanEligibility, setLoanEligibility] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [topupLoading, setTopupLoading] = useState(false)
  const [jumlahCoin, setJumlahCoin] = useState('')

  const loadData = async () => {
    const [comm, user, cData, eligibility] = await Promise.all([
      getIndukCommunityDetail(communityId),
      getCurrentUserProfile(),
      getCommunityCoinBalance(communityId),
      checkCommunityLoanEligibility(communityId),
    ])
    setCommunity(comm)
    setCurrentUser(user)
    setCoinData(cData)
    setLoanEligibility(eligibility)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [communityId])

  const isKetua = currentUser && community && (currentUser.id === community.ketuaId || currentUser.role === 'ADMIN')

  const handleTopup = async () => {
    const n = parseFloat(jumlahCoin)
    if (!jumlahCoin || isNaN(n) || n <= 0) {
      goeyToast.error('Masukkan jumlah coin yang valid.')
      return
    }
    setTopupLoading(true)
    const form = new FormData()
    form.set('communityId', communityId)
    form.set('jumlahCoin', n.toString())
    const res = await topupCommunityCoin(form)
    setTopupLoading(false)
    if ('error' in res) {
      goeyToast.error(res.error as string)
    } else {
      setJumlahCoin('')
      goeyToast.success(`Berhasil melakukan top up ${n} coin!`)
      loadData()
    }
  }

  const coinBalance = coinData?.coinBalance || 0
  const minCoin = coinData?.minCoinForLoan || 1000
  const progressPercent = Math.min(100, (coinBalance / minCoin) * 100)
  const totalRupiah = parseFloat(jumlahCoin || '0') * COIN_RATE

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F7F5',
      padding: '24px 16px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Back */}
        <div style={{ marginBottom: 28 }}>
          <a href={`/community/${communityId}`} style={{ color: '#2DB24A', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            ← Kembali ke Komunitas
          </a>
          <h1 style={{ color: '#111827', fontSize: 26, fontWeight: 700, margin: '8px 0 4px' }}>
            🪙 Coin Komunitas
          </h1>
          {community && (
            <p style={{ color: '#4B5563', fontSize: 14 }}>{community.name}</p>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: 100, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : (
          <>
            {/* Coin Balance Card */}
            <div style={{
              background: 'linear-gradient(135deg, #2DB24A 0%, #198754 60%, #0F5132 100%)',
              borderRadius: 20, padding: '28px 32px', marginBottom: 20,
              boxShadow: '0 12px 30px rgba(45, 178, 74, 0.25)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', bottom: -30, right: -20,
                width: 130, height: 130, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)'
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                  Kas Coin Komunitas
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ color: '#fff', fontSize: 48, fontWeight: 800 }}>
                    {coinBalance.toLocaleString('id-ID')}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 20, fontWeight: 600 }}>coin</span>
                </div>

                {/* Progress bar untuk pinjaman */}
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                      Progress menuju akses pinjaman
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>
                      {coinBalance}/{minCoin}
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{
                      height: '100%', borderRadius: 8, transition: 'width 0.5s ease',
                      width: `${progressPercent}%`,
                      background: progressPercent >= 100
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.7)',
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Pinjaman */}
            <div style={{
              background: loanEligibility?.eligible
                ? '#DEF7EC'
                : '#FDE8E8',
              border: `1px solid ${loanEligibility?.eligible ? '#BCF0DA' : '#FBD5D5'}`,
              borderRadius: 14, padding: '16px 20px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 28 }}>
                {loanEligibility?.eligible ? '🟢' : '🔴'}
              </span>
              <div>
                <p style={{
                  color: loanEligibility?.eligible ? '#03543F' : '#9B1C1C',
                  fontWeight: 700, fontSize: 15, marginBottom: 4
                }}>
                  {loanEligibility?.eligible ? 'Akses Pinjaman Aktif' : 'Akses Pinjaman Belum Tersedia'}
                </p>
                <p style={{ color: '#4B5563', fontSize: 13 }}>{loanEligibility?.message}</p>
              </div>
            </div>

            {/* Top Up Form (Hanya Ketua) */}
            {isKetua ? (
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 20, padding: '24px',
                marginBottom: 20,
              }}>
                <h2 style={{ color: '#111827', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                  ⬆️ Top Up Coin
                </h2>
                <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>
                  Rate: 1 coin = Rp 1.500 · Hanya Ketua yang bisa top up
                </p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  {[100, 250, 500, 1000].map(preset => (
                    <button
                      key={preset}
                      id={`preset-${preset}`}
                      onClick={() => setJumlahCoin(preset.toString())}
                      style={{
                        padding: '8px 18px', borderRadius: 10, border: '1px solid #E5E7EB',
                        background: jumlahCoin === preset.toString()
                          ? '#2DB24A'
                          : '#FFFFFF',
                        color: jumlahCoin === preset.toString() ? '#fff' : '#4B5563',
                        fontWeight: 600, fontSize: 14, cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {preset.toLocaleString('id-ID')} coin
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <input
                    id="topup-coin-input"
                    type="number"
                    min="1"
                    value={jumlahCoin}
                    onChange={e => setJumlahCoin(e.target.value)}
                    placeholder="Jumlah coin..."
                    style={{
                      width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid #D1D5DB',
                      background: '#FFFFFF', color: '#111827', fontSize: 16,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {jumlahCoin && parseFloat(jumlahCoin) > 0 && (
                  <div style={{
                    background: 'rgba(45,178,74,0.08)', borderRadius: 10, padding: '12px 16px',
                    marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ color: '#4B5563', fontSize: 14 }}>Total biaya</span>
                    <span style={{ color: '#2DB24A', fontWeight: 700, fontSize: 18 }}>
                      Rp {totalRupiah.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <button
                  id="topup-submit-btn"
                  onClick={handleTopup}
                  disabled={topupLoading || !jumlahCoin || parseFloat(jumlahCoin) <= 0}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: topupLoading || !jumlahCoin ? '#F3F4F6'
                      : 'linear-gradient(135deg, #2DB24A, #198754)',
                    color: topupLoading || !jumlahCoin ? '#9CA3AF' : '#fff',
                    fontWeight: 700, fontSize: 16, cursor: topupLoading || !jumlahCoin ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {topupLoading ? '⏳ Memproses...' : '⬆️ Top Up Sekarang'}
                </button>
              </div>
            ) : (
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 14, padding: '16px 20px', marginBottom: 20,
                textAlign: 'center', color: '#6B7280',
              }}>
                <p style={{ fontSize: 14 }}>Hanya Ketua Komunitas yang dapat top up coin.</p>
              </div>
            )}

            {/* Info Penggunaan Coin */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 14, padding: '18px 20px',
            }}>
              <p style={{ color: '#111827', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📚 Info Penggunaan Coin Komunitas</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '🔓', text: `Minimal ${minCoin.toLocaleString('id-ID')} coin untuk membuka akses pinjaman modal bagi member.` },
                  { icon: '💸', text: 'Untuk komunitas KOPERASI: reward merchant invite dibayar dari kas komunitas (dalam bentuk saldo reward).' },
                  { icon: '🪙', text: 'Rate top up: 1 coin = Rp 1.500' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ color: '#4B5563', fontSize: 13, lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}

