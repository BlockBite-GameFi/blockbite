'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useApp } from '@/lib/useApp';
import Navbar from '@/components/Navbar';

// Final 3D PNG mascots. NOTE: the PNG asset filenames don't match the
// characters they actually depict — file-naming pre-dates the final art.
// Re-pair each asset path to the character it actually shows, with the
// matching label color so the on-screen label color = character's hue.
//   mascot-brawler.png → purple crowned king  → Rex     (#9499e8)
//   mascot-sunny.png   → teal cube wave       → Tide    (#6ec8e0)
//   mascot-rex.png     → red blocky fighter   → Brawler (#d94553)
//   mascot-tide.png    → yellow happy cube    → Sunny   (#e1a438)
const FINAL_MASCOTS = [
  { src:'/mascots/mascot-brawler.png', name:'Rex',     color:'#9499e8' },
  { src:'/mascots/mascot-sunny.png',   name:'Tide',    color:'#6ec8e0' },
  { src:'/mascots/mascot-rex.png',     name:'Brawler', color:'#d94553' },
  { src:'/mascots/mascot-tide.png',    name:'Sunny',   color:'#e1a438' },
];

const BLOCK_COLORS = ['#a78bfa','#5eead4','#fbbf24','#f472b6','#7dd3fc','#fb923c'];
const BLOCK_ICONS: string[] = ['◆', '◈', '◉', '⬡', '◇', '✦'];

const PROGRAM_ID = 'DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf';

// TDP protocol features — design untouched, copy pivoted to protocol-first.
const FEATURES = {
  en: [
    { ic:'01', t:'Cliff Gate',
      d:'Zero tokens unlock before cliff_ts. Hard on-chain time floor — no early withdrawal, no special cases, no exceptions.' },
    { ic:'02', t:'Milestone Gate',
      d:'required_tier gates withdrawal on oracle proof. Game, DAO vote, or admin key — plug in any oracle, bots filtered automatically.' },
    { ic:'03', t:'Linear Streaming',
      d:'After cliff + milestone: tokens flow per-second at rate amount / duration. Math verified on-chain with u128 overflow protection.' },
    { ic:'04', t:'Cancel & Split',
      d:'Creator can cancel mid-stream. Vested portion stays for beneficiary; unvested returns atomically. Conservation law enforced.' },
    { ic:'05', t:'VGPV Bot Filter',
      d:'Velocity-Gated Proof Validation: 2h minimum between oracle updates, 3-strike block. Bots can not farm milestones.' },
    { ic:'06', t:'Revenue Split Vault',
      d:'fund_vault splits deposits 70/15/10/5 atomically. Dust from rounding always folds into the prize pool — zero token loss.' },
  ],
  id: [
    { ic:'01', t:'Cliff Gate',
      d:'Nol token unlock sebelum cliff_ts. Floor waktu keras on-chain — tidak ada penarikan awal, tidak ada pengecualian.' },
    { ic:'02', t:'Milestone Gate',
      d:'required_tier memblokir penarikan sampai bukti oracle tersedia. Game, DAO vote, atau admin key — sambungkan oracle apapun.' },
    { ic:'03', t:'Linear Streaming',
      d:'Setelah cliff + milestone: token mengalir per-detik di rate amount / duration. Matematika diverifikasi on-chain dengan proteksi u128.' },
    { ic:'04', t:'Cancel & Split',
      d:'Creator bisa cancel di tengah stream. Porsi vested tetap untuk beneficiary; unvested kembali secara atomik.' },
    { ic:'05', t:'VGPV Bot Filter',
      d:'Velocity-Gated Proof Validation: minimum 2 jam antar update oracle, block 3-strike. Bot tidak bisa farm milestone.' },
    { ic:'06', t:'Revenue Split Vault',
      d:'fund_vault membagi deposit 70/15/10/5 secara atomik. Debu dari pembulatan masuk ke prize pool — nol token hilang.' },
  ],
};

// TWO flows: builder (creates streams) + user (receives / claims)
const BUILDER_STEPS = {
  en: [
    { t:'Configure Distribution', d:'Set cliff (1w / 1mo / 6mo / 1y / custom), total duration, and required oracle tier. Live preview shows daily unlock rate.' },
    { t:'Lock Tokens On-Chain',   d:'create_stream atomically transfers tokens from your wallet into a PDA-owned vault. Only the program can release funds.' },
    { t:'Recipients Compete',     d:'Beneficiaries earn oracle proofs by playing, completing quests, or via DAO vote. Bots filtered by VGPV.' },
    { t:'Auto Vest + Claim',      d:'Once cliff + milestone conditions clear, tokens stream per-second. Recipients claim via /claim/[stream] — no spreadsheets.' },
  ],
  id: [
    { t:'Konfigurasi Distribusi', d:'Atur cliff (1m / 1b / 6b / 1t / custom), durasi total, dan tier oracle yang dibutuhkan.' },
    { t:'Kunci Token On-Chain',   d:'create_stream mentransfer token dari wallet kamu ke vault milik PDA secara atomik. Hanya program yang bisa melepaskan dana.' },
    { t:'Penerima Berkompetisi',  d:'Beneficiary mendapatkan bukti oracle dengan bermain, menyelesaikan quest, atau lewat vote DAO.' },
    { t:'Auto Vest + Klaim',      d:'Setelah kondisi cliff + milestone terpenuhi, token mengalir per-detik. Penerima klaim via /claim/[stream].' },
  ],
};

const BIOMES = {
  en: ['Crystal Caverns','Frozen Pass','Ember Foundry','Verdant Hollow','Abyss Tide','Sandborn Dunes','Voidline Citadel','Apex Sanctum'],
  id: ['Gua Kristal','Celah Beku','Pande Api','Lembah Hijau','Arus Jurang','Bukit Pasir','Benteng Kehampaan','Kuil Puncak'],
};
const BIOME_COLORS = ['#a78bfa','#7dd3fc','#fb923c','#86efac','#22d3ee','#fcd34d','#c084fc','#fbbf24'];

export default function Home() {
  const { lang } = useApp();
  const cvs = useRef<HTMLCanvasElement>(null);

  // Floating block canvas — design unchanged from original
  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let raf: number;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const bl = Array.from({ length: 22 }, (_, i) => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      sz: 18 + Math.random() * 28, spd: 0.18 + Math.random() * 0.38,
      color: BLOCK_COLORS[i % 6], icon: BLOCK_ICONS[i % 6],
      rot: Math.random() * Math.PI * 2, rs: (Math.random() - .5) * .012,
      op: 0.07 + Math.random() * 0.13,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      bl.forEach(b => {
        b.y -= b.spd; b.rot += b.rs;
        if (b.y < -50) { b.y = c.height + 50; b.x = Math.random() * c.width; }
        ctx.save(); ctx.globalAlpha = b.op;
        ctx.translate(b.x, b.y); ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        ctx.font = `900 ${b.sz}px "Space Grotesk",system-ui`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.icon, 0, 0); ctx.restore();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const F  = FEATURES[lang]      ?? FEATURES.en;
  const BS = BUILDER_STEPS[lang] ?? BUILDER_STEPS.en;
  const B  = BIOMES[lang]        ?? BIOMES.en;

  return (
    <div style={{ minHeight:'100vh', background:'var(--ds-bg)', color:'var(--ds-text)', fontFamily:"'Montserrat', var(--font-sg), system-ui, sans-serif", overflowX:'hidden', transition:'background .25s,color .25s' }}>
      <canvas ref={cvs} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:.18 }} />
      <Navbar />

      {/* ─── HERO — TDP FIRST ─────────────────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'100px 24px 60px', textAlign:'center', gap:28 }}>

        {/* Protocol badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:999, border:'1px solid var(--ds-accent)', background:'rgba(167,139,250,.12)', fontSize:12, fontWeight:800, color:'var(--ds-accent)', letterSpacing:'1.5px' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--ds-accent)', display:'inline-block', animation:'bbPulse 2s infinite' }} />
          {lang==='id' ? 'TOKEN DISTRIBUTION PROTOCOL · SOLANA DEVNET' : 'TOKEN DISTRIBUTION PROTOCOL · SOLANA DEVNET'}
        </div>

        {/* Hero headline — TDP pivot */}
        <h1 style={{ fontFamily:"'Montserrat', 'Space Grotesk', system-ui, sans-serif", fontSize:'clamp(38px,9vw,92px)', fontWeight:900, lineHeight:.95, letterSpacing:'-2px', margin:0 }}>
          {lang==='id'
            ? <>Distribusi Token via<br/><span style={{ background:'var(--ds-grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Kompetisi Terverifikasi.</span></>
            : <>Distribute Tokens via<br/><span style={{ background:'var(--ds-grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Verifiable Competition.</span></>}
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize:'clamp(14px,2vw,18px)', color:'var(--ds-text-dim)', maxWidth:600, lineHeight:1.65, margin:0 }}>
          {lang==='id'
            ? 'Cliff + Milestone + Linear vesting on-chain di Solana. Filter bot otomatis. Tanpa spreadsheet.'
            : 'Cliff + Milestone + Linear vesting on Solana. VGPV bot filter built-in. Zero spreadsheets.'}
        </p>

        {/* Mascots — unchanged floating oracle characters */}
        <div style={{ display:'flex', gap:24, justifyContent:'center', flexWrap:'wrap', alignItems:'flex-end' }}>
          {FINAL_MASCOTS.map((m, i) => (
            <Link key={m.name} href="/mascots" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, textDecoration:'none', animation:`bbFloat ${2.6+i*.35}s ease-in-out infinite`, animationDelay:`${i*.22}s` }}>
              <div style={{ width:120, height:120, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div aria-hidden style={{ position:'absolute', inset:'10%', borderRadius:'50%', background:`radial-gradient(circle, ${m.color}55 0%, ${m.color}00 70%)`, filter:'blur(10px)', zIndex:0 }}/>
                <Image src={m.src} alt={m.name} width={120} height={120} style={{ objectFit:'contain', position:'relative', zIndex:1, filter:`drop-shadow(0 6px 12px ${m.color}66)` }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Floating blocks — design unchanged */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          {BLOCK_COLORS.map((c,i) => (
            <div key={i} style={{ width:42, height:42, borderRadius:11, background:c, animation:`bbFloat ${2.5+i*.3}s ease-in-out infinite`, animationDelay:`${i*.18}s` }} />
          ))}
        </div>

        {/* Protocol stats — pivoted from game stats */}
        <div style={{ display:'flex', gap:36, flexWrap:'wrap', justifyContent:'center' }}>
          {[
            { v:'5',     l:lang==='id'?'INSTRUKSI':'INSTRUCTIONS' },
            { v:'0',     l:lang==='id'?'PERANTARA':'INTERMEDIARIES' },
            { v:'100%',  l:'ON-CHAIN' },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900 }}>{s.v}</div>
              <div style={{ fontSize:11, color:'var(--ds-text-dim)', letterSpacing:'1.5px', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Primary CTAs — DISTRIBUTE first, game secondary */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          <Link href="/distribute" style={{ padding:'14px 32px', borderRadius:12, background:'var(--ds-grad)', color:'#0a0a14', fontWeight:900, fontSize:16, textDecoration:'none', boxShadow:'0 0 28px rgba(167,139,250,.45)' }}>
            {lang==='id' ? 'BUAT STREAM' : 'CREATE STREAM'}
          </Link>
          <Link href="/quests" style={{ padding:'14px 28px', borderRadius:12, background:'transparent', border:'1px solid var(--ds-border)', color:'var(--ds-text)', fontWeight:700, fontSize:16, textDecoration:'none' }}>
            {lang==='id' ? 'KLAIM TOKEN' : 'CLAIM TOKENS'}
          </Link>
          <Link href="/game" style={{ padding:'14px 28px', borderRadius:12, background:'transparent', border:'1px solid var(--ds-border)', color:'var(--ds-text)', fontWeight:700, fontSize:16, textDecoration:'none' }}>
            {lang==='id' ? 'MAIN GAME' : 'PLAY GAME'}
          </Link>
        </div>
      </section>

      {/* ─── PROTOCOL SPEC BAND ───────────────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, background:'var(--ds-surface)', borderTop:'1px solid var(--ds-border)', borderBottom:'1px solid var(--ds-border)', padding:'18px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', gap:24, alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
          <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--ds-text-dim)', letterSpacing:'0.5px' }}>
            Program: <span style={{ color:'var(--ds-accent)' }}>{PROGRAM_ID}</span>
          </span>
          {['create_stream','withdraw','cancel','update_proof','fund_vault'].map((ix) => (
            <span key={ix} style={{ fontFamily:'monospace', fontSize:11, padding:'3px 8px', borderRadius:4, background:'rgba(167,139,250,.1)', color:'var(--ds-accent)', border:'1px solid rgba(167,139,250,.2)' }}>
              {ix}()
            </span>
          ))}
        </div>
      </section>

      {/* ─── PROTOCOL FEATURES ────────────────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 24px', maxWidth:1100, margin:'0 auto' }}>
        <p style={{ fontSize:11, letterSpacing:'2px', color:'var(--ds-accent)', textAlign:'center', marginBottom:10 }}>
          {lang==='id' ? 'ARSITEKTUR PROTOKOL' : 'PROTOCOL ARCHITECTURE'}
        </p>
        <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, textAlign:'center', marginBottom:40 }}>
          {lang==='id' ? 'Kenapa BlockBite TDP?' : 'Why BlockBite TDP?'}
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
          {F.map((f,i) => (
            <div key={i} style={{ padding:24, borderRadius:20, background:'var(--ds-surface)', border:'1px solid var(--ds-border)', transition:'.2s' }}
              onMouseEnter={e => { const d = e.currentTarget as HTMLElement; d.style.borderColor='var(--ds-accent)'; d.style.background='rgba(167,139,250,.08)'; }}
              onMouseLeave={e => { const d = e.currentTarget as HTMLElement; d.style.borderColor='var(--ds-border)'; d.style.background='var(--ds-surface)'; }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'2px', color:'var(--ds-accent)', marginBottom:14, fontFamily:'monospace' }}>{f.ic}</div>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>{f.t}</div>
              <div style={{ fontSize:13, color:'var(--ds-text-dim)', lineHeight:1.6 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS — BUILDER FLOW ──────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 24px', maxWidth:1100, margin:'0 auto' }}>
        <p style={{ fontSize:11, letterSpacing:'2px', color:'var(--ds-accent)', textAlign:'center', marginBottom:10 }}>
          {lang==='id' ? 'UNTUK BUILDER' : 'FOR BUILDERS'}
        </p>
        <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, textAlign:'center', marginBottom:40 }}>
          {lang==='id' ? 'Launch distribusi dalam 4 langkah' : 'Launch a distribution in 4 steps'}
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {BS.map((s, i) => (
            <div key={i} style={{ padding:22, borderRadius:16, background:'var(--ds-surface)', border:'1px solid var(--ds-border)', position:'relative', overflow:'hidden' }}>
              <div style={{ fontSize:52, fontWeight:900, color:'var(--ds-accent)', opacity:.12, position:'absolute', top:6, right:12, lineHeight:1, userSelect:'none' }}>{i+1}</div>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:8, position:'relative' }}>{s.t}</div>
              <div style={{ fontSize:12, color:'var(--ds-text-dim)', lineHeight:1.6, position:'relative' }}>{s.d}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:28 }}>
          <Link href="/distribute/new" style={{ padding:'12px 28px', borderRadius:12, background:'var(--ds-grad)', color:'#0a0a14', fontWeight:900, fontSize:14, textDecoration:'none' }}>
            {lang==='id' ? 'MULAI DISTRIBUSI' : 'START DISTRIBUTING'}
          </Link>
        </div>
      </section>

      {/* ─── ORACLE ENGAGEMENT LAYER — 8 ACTS ─────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 24px', maxWidth:1100, margin:'0 auto' }}>
        <p style={{ fontSize:11, letterSpacing:'2px', color:'var(--ds-accent)', textAlign:'center', marginBottom:10 }}>
          {lang==='id' ? 'ORACLE LAYER · 8 BABAK · 4.000 LEVEL' : 'ORACLE LAYER · 8 ACTS · 4,000 LEVELS'}
        </p>
        <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, textAlign:'center', marginBottom:16 }}>
          {lang==='id' ? 'Kompetisi sebagai Oracle' : 'Competition as the Oracle'}
        </h2>
        <p style={{ fontSize:14, color:'var(--ds-text-dim)', textAlign:'center', maxWidth:600, margin:'0 auto 32px', lineHeight:1.6 }}>
          {lang==='id'
            ? 'Game adalah lapisan oracle. Pemain naik level → update_proof() menulis tier ke ProofCache PDA → milestone gate terbuka. Bukan game biasa — ini filter manusia untuk distribusi.'
            : 'The game is the oracle layer. Players level up → update_proof() writes tier to ProofCache PDA → milestone gate unlocks. Not a random game — it is the human filter for your distribution.'}
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:12 }}>
          {B.map((name, i) => (
            <Link key={i} href={`/map?act=${i+1}`} style={{ textDecoration:'none' }}>
              <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--ds-surface)', borderLeft:`3px solid ${BIOME_COLORS[i]}`, outline:`1px solid rgba(0,0,0,0)`, transition:'.2s', cursor:'pointer' }}>
                <div style={{ fontSize:11, color:BIOME_COLORS[i], fontWeight:800, letterSpacing:'1px', marginBottom:4 }}>{lang==='id'?`BABAK ${i+1}`:`ACT ${i+1}`}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--ds-text)' }}>{name}</div>
                <div style={{ fontSize:11, color:'var(--ds-text-dim)', marginTop:2 }}>{lang==='id'?`Level ${i*500+1}–${(i+1)*500}`:`Levels ${i*500+1}–${(i+1)*500}`}</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:24 }}>
          <Link href="/game" style={{ padding:'10px 22px', borderRadius:10, background:'transparent', border:'1px solid var(--ds-border)', color:'var(--ds-text)', fontWeight:700, fontSize:13, textDecoration:'none' }}>
            {lang==='id' ? 'MAIN SEKARANG' : 'PLAY NOW'}
          </Link>
        </div>
      </section>

      {/* ─── TOKENOMICS ────────────────────────────────────────────────────────── */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 24px 80px', maxWidth:600, margin:'0 auto', textAlign:'center' }}>
        <p style={{ fontSize:11, letterSpacing:'2px', color:'var(--ds-accent)', marginBottom:10 }}>
          {lang==='id' ? 'TOKENOMIK' : 'TOKENOMICS'}
        </p>
        <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, marginBottom:32 }}>
          {lang==='id' ? 'Pembagian Pendapatan' : 'Revenue Split'}
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {[
            { pct:'70%', c:'#5eead4', t:lang==='id'?'Pool Hadiah':'Prize Pool',  d:lang==='id'?'Dibayar ke pemenang via vault PDA':'Paid to winners via vault PDA' },
            { pct:'15%', c:'#a78bfa', t:lang==='id'?'Tim':'Team',                d:lang==='id'?'Operasional & pemasaran':'Operations & marketing' },
            { pct:'10%', c:'#fbbf24', t:lang==='id'?'Dev':'Dev',                 d:lang==='id'?'Pengembangan protokol':'Protocol development' },
            { pct:'5%',  c:'#f472b6', t:lang==='id'?'Referral':'Referral',       d:lang==='id'?'Langsung ke wallet referrer':'Direct to referrer wallet' },
          ].map((tok, i) => (
            <div key={i} style={{ padding:18, borderRadius:14, background:'var(--ds-surface)', border:'1px solid var(--ds-border)', display:'flex', alignItems:'center', gap:14, textAlign:'left' }}>
              <div style={{ fontSize:26, fontWeight:900, color:tok.c, flexShrink:0 }}>{tok.pct}</div>
              <div><div style={{ fontWeight:800, marginBottom:2 }}>{tok.t}</div><div style={{ fontSize:11, color:'var(--ds-text-dim)' }}>{tok.d}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid var(--ds-border)', padding:'28px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, fontSize:12, color:'var(--ds-text-dim)' }}>
        <div>© 2026 BlockBite · Solana Devnet · {PROGRAM_ID.slice(0,8)}…</div>
        <div style={{ display:'flex', gap:20 }}>
          <a href="https://x.com/blockbite_gg" target="_blank" rel="noopener noreferrer" style={{ color:'var(--ds-text-dim)', textDecoration:'none' }}>Twitter / X</a>
          <a href="https://discord.gg/blockbite" target="_blank" rel="noopener noreferrer" style={{ color:'var(--ds-text-dim)', textDecoration:'none' }}>Discord</a>
          <a href="https://github.com/nayrbryanGaming/blockblast" target="_blank" rel="noopener noreferrer" style={{ color:'var(--ds-text-dim)', textDecoration:'none' }}>GitHub</a>
        </div>
      </footer>

      <style>{`
        @keyframes bbPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        @keyframes bbFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-10px) rotate(5deg)}}
      `}</style>
    </div>
  );
}
