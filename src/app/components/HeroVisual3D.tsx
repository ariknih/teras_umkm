'use client'

const ORDERS = [
  { name: 'Batik Madura Premium', price: 'Rp 185.000', color: '#4ade80', done: true },
  { name: 'Kopi Aceh Gayo 250g',  price: 'Rp 95.000',  color: '#facc15', done: false },
  { name: 'Jasa Desain Logo',      price: 'Rp 350.000', color: '#4ade80', done: true },
]

const BARS = [38, 52, 44, 68, 58, 78, 62, 88, 72, 92, 82, 100]

export default function HeroVisual3D() {
  return (
    <div className="hidden lg:flex items-center justify-center relative w-full" style={{ height: '500px' }}>
      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes h3d-main {
          0%,100% { transform: rotateY(-14deg) rotateX(7deg) translateY(0px); }
          50%      { transform: rotateY(-9deg)  rotateX(4deg) translateY(-14px); }
        }
        @keyframes h3d-chip1 {
          0%,100% { transform: translateY(0px)   rotateZ(-2deg); }
          50%      { transform: translateY(-12px) rotateZ(-1deg); }
        }
        @keyframes h3d-chip2 {
          0%,100% { transform: translateY(0px)   rotateZ(2deg); }
          50%      { transform: translateY(-16px) rotateZ(1deg); }
        }
        @keyframes h3d-chip3 {
          0%,100% { transform: translateY(0px)  rotateZ(1deg); }
          50%      { transform: translateY(-9px) rotateZ(-1deg); }
        }
        @keyframes h3d-live {
          0%,100% { box-shadow: 0 0 0 0   rgba(34,197,94,0.6); }
          50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @keyframes h3d-glow {
          0%,100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.8;  transform: scale(1.06); }
        }
      `}</style>

      {/* Ambient glow blob */}
      <div style={{
        position: 'absolute',
        width: '480px', height: '480px',
        background: 'radial-gradient(circle, rgba(201,162,39,0.13) 0%, transparent 68%)',
        borderRadius: '50%',
        filter: 'blur(48px)',
        animation: 'h3d-glow 6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Scene — perspective container */}
      <div style={{ position: 'relative', width: '340px', height: '420px', perspective: '1100px' }}>

        {/* ──────── MAIN DASHBOARD CARD ──────── */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          background: 'linear-gradient(155deg, #1c1e2a 0%, #141620 60%, #0f1118 100%)',
          border: '1px solid rgba(201,162,39,0.22)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 48px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,162,39,0.07), inset 0 1px 0 rgba(255,255,255,0.05)',
          animation: 'h3d-main 5s ease-in-out infinite',
          transformOrigin: 'center center',
          zIndex: 10,
        }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '9px',
                background: 'linear-gradient(135deg, #c9a227, #e8b84b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
              }}>🏪</div>
              <div>
                <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.32)', fontFamily: 'monospace', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Teras UMKM</p>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#fff', margin: 0 }}>Merchant Dashboard</p>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '3px 9px', borderRadius: '999px',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', animation: 'h3d-live 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '8px', fontWeight: 700, color: '#22c55e', fontFamily: 'monospace' }}>LIVE</span>
            </div>
          </div>

          {/* Revenue block */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.055)',
            borderRadius: '13px', padding: '13px', marginBottom: '13px',
          }}>
            <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px', fontFamily: 'monospace' }}>Pendapatan Bulan Ini</p>
            <p style={{ fontSize: '21px', fontWeight: 800, color: '#c9a227', margin: '0 0 2px', letterSpacing: '-0.02em', fontFamily: 'system-ui, sans-serif' }}>Rp 12.480.000</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '9px', color: '#4ade80', fontWeight: 700 }}>↑ +24%</span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)' }}>dari bulan lalu</span>
            </div>
            {/* Sparkline */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', marginTop: '10px', height: '26px' }}>
              {BARS.map((h, i) => (
                <div key={i} style={{
                  flex: 1, borderRadius: '2px',
                  background: i === BARS.length - 1
                    ? 'linear-gradient(to top, #c9a227, #e8b84b)'
                    : 'rgba(201,162,39,0.22)',
                  height: `${h}%`,
                }} />
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div style={{ marginBottom: '13px' }}>
            <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 7px', fontFamily: 'monospace' }}>Pesanan Terbaru</p>
            {ORDERS.map((o, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 0',
                borderBottom: i < ORDERS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, overflow: 'hidden' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: o.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</span>
                </div>
                <span style={{ fontSize: '9px', color: '#c9a227', fontWeight: 700, fontFamily: 'monospace', flexShrink: 0, marginLeft: '4px' }}>{o.price}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '11px', borderTop: '1px solid rgba(255,255,255,0.055)' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}>1.247 pengunjung hari ini</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: '8px', color: '#c9a227' }}>★</span>)}
            </div>
          </div>
        </div>

        {/* ──────── CHIP: Total Produk (top-left) ──────── */}
        <div style={{
          position: 'absolute', top: '14%', left: '-30px', zIndex: 20,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(248,249,255,0.97) 100%)',
          border: '1px solid rgba(201,162,39,0.4)',
          borderRadius: '14px', padding: '10px 14px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(201,162,39,0.08)',
          animation: 'h3d-chip1 3.8s ease-in-out infinite',
          backdropFilter: 'blur(12px)',
          minWidth: '118px',
        }}>
          <p style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px', fontFamily: 'monospace' }}>Total Produk</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#735c00', margin: 0, lineHeight: 1, fontFamily: 'system-ui, sans-serif' }}>328</p>
          <p style={{ fontSize: '8px', color: '#4ade80', margin: '3px 0 0', fontWeight: 700 }}>↑ 12 baru minggu ini</p>
        </div>

        {/* ──────── CHIP: Pesanan Aktif (top-right) ──────── */}
        <div style={{
          position: 'absolute', top: '6%', right: '-32px', zIndex: 20,
          background: 'linear-gradient(135deg, #1e2130 0%, #16181f 100%)',
          border: '1px solid rgba(201,162,39,0.2)',
          borderRadius: '14px', padding: '10px 14px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          animation: 'h3d-chip2 4.4s ease-in-out infinite',
          minWidth: '118px',
        }}>
          <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px', fontFamily: 'monospace' }}>Pesanan Aktif</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#c9a227', margin: 0, lineHeight: 1, fontFamily: 'system-ui, sans-serif' }}>1.892</p>
          <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.28)', margin: '3px 0 0' }}>Di seluruh platform</p>
        </div>

        {/* ──────── CHIP: Rating (bottom-right) ──────── */}
        <div style={{
          position: 'absolute', bottom: '12%', right: '-38px', zIndex: 20,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(248,249,255,0.97) 100%)',
          border: '1px solid rgba(201,162,39,0.4)',
          borderRadius: '14px', padding: '10px 14px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
          animation: 'h3d-chip3 5.2s ease-in-out infinite',
          backdropFilter: 'blur(12px)',
          minWidth: '110px',
        }}>
          <div style={{ display: 'flex', gap: '2px', marginBottom: '3px' }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: '9px', color: '#f59e0b' }}>★</span>)}
          </div>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#735c00', margin: 0, lineHeight: 1, fontFamily: 'system-ui, sans-serif' }}>4.9</p>
          <p style={{ fontSize: '8px', color: '#9ca3af', margin: '3px 0 0' }}>Rating rata-rata</p>
        </div>

      </div>
    </div>
  )
}
