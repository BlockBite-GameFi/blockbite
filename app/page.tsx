'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useApp } from '@/lib/useApp';
import Navbar from '@/components/Navbar';
import { MascotSVG, BRAND_MASCOTS, PALETTES } from '@/components/Mascot';

const BLOCK_COLORS = ['#a78bfa','#5eead4','#fbbf24','#f472b6','#7dd3fc','#fb923c'];
const BLOCK_ICONS  = ['◆','◈','◉','✦','⬡','◇'];

const FEATURES = {
  en: [
    { ic:'◆', t:'On-chain Proofs',       d:'Every Act completion writes a ProofCache PDA to Solana. Your progress is permanent and verifiable.' },
    { ic:'⛁', t:'Real USDC Rewards',      d:'70% of ticket revenue goes to the prize pool. Claim USDC directly to your wallet — no intermediaries.' },
    { ic:'▦', t:'Skill-Based Match-3',     d:'4,000 levels across 8 biomes. Boards seeded by keccak256 — same level, identical for every player.' },
    { ic:'◷', t:'Vesting Cooldown',        d:'24-hour on-chain cooldown between claims. Enforced by the Solana program — not just a UI check.' },
    { ic:'◈', t:'Transparent Tokenomics',  d:'70% prize · 15% team · 10% dev · 5% referral. All splits happen atomically on-chain.' },
    { ic:'⛨', t:'Squads Multisig',         d:'Admin actions require 2-of-3 Squads v4 signatures. The vault is PDA-owned — not a team wallet.' },
  ],
  id: [
    { ic:'◆', t:'Bukti On-chain',          d:'Setiap Babak selesai menulis ProofCache PDA ke Solana. Progresmu permanen.' },
    { ic:'⛁', t:'Hadiah USDC Nyata',       d:'70% pendapatan tiket masuk ke pool hadiah. Klaim USDC langsung ke wallet.' },
    { ic:'▦', t:'Match-3 Berbasis Skill',   d:'4.000 level di 8 bioma. Papan diacak oleh keccak256.' },
    { ic:'◷', t:'Cooldown Vesting',         d:'Cooldown 24 jam on-chain dipaksa oleh program Solana.' },
    { ic:'◈', t:'Tokenomik Transparan',     d:'Pembagian 70/15/10/5 terjadi secara atomik on-chain.' },
    { ic:'⛨', t:'Multisig Squads',          d:'Aksi admin memerlukan tanda tangan 2-dari-3 Squads v4.' },
  ],
};

const STEPS = {
  en: [
    { t:'Connect Wallet',  d:'Phantom, Solflare, Backpack, or any Solana wallet.' },
    { t:'Buy Tickets',     d:'From $1 USDC. Tickets fuel gameplay and unlock reward tiers.' },
    { t:'Clear Acts',      d:'Complete 500 levels to finish an Act and write your proof on-chain.' },
    { t:'Claim USDC',      d:'After the 24h cooldown, claim your tier reward directly to your wallet.' },
  ],
  id: [
    { t:'Hubungkan Wallet',  d:'Phantom, Solflare, Backpack, atau wallet Solana apapun.' },
    { t:'Beli Tiket',        d:'Mulai dari $1 USDC. Tiket untuk bermain dan membuka tingkat hadiah.' },
    { t:'Selesaikan Babak',  d:'Selesaikan 500 level untuk menyelesaikan Babak dan tulis bukti on-chain.' },
    { t:'Klaim USDC',        d:'Setelah cooldown 24 jam, klaim hadiahmu langsung ke wallet.' },
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

  const F = FEATURES[lang] ?? FEATURES.en;
  const S = STEPS[lang]    ?? STEPS.en;
  const B = BIOMES[lang]   ?? BIOMES.en;

  return (
    <div style={{ minHeight:'100vh', background:'var(--ds-bg)', color:'var(--ds-text)', fontFamily:'var(--font-sg)', overflowX:'hidden', transition:'background .25s,color .25s' }}>
      <canvas ref={cvs} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:.18 }} />
      <Navbar />

      {/* HERO */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'100px 24px 60px', textAlign:'center', gap:28 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:999, border:'1px solid var(--ds-accent)', background:'rgba(167,139,250,.12)', fontSize:12, fontWeight:800, color:'var(--ds-accent)', letterSpacing:'1.5px' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--ds-accent)', display:'inline-block', animation:'bbPulse 2s infinite' }} />
          {lang==='id' ? 'SEGERA HADIR · SOLANA DEVNET' : 'COMING SOON · SOLANA DEVNET'}
        </div>

        <h1 style={{ fontSize:'clamp(38px,9vw,92px)', fontWeight:900, lineHeight:.95, letterSpacing:'-2px', margin:0 }}>
          {lang==='id' ? <>Main Blok.<br/><span style={{ background:'var(--ds-grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Dapat USDC Asli.</span></>
                       : <>Play Blocks.<br/><span style={{ background:'var(--ds-grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Earn Real USDC.</span></>}
        </h1>

        <p style={{ fontSize:'clamp(14px,2vw,18px)', color:'var(--ds-text-dim)', maxWidth:520, lineHeight:1.65, margin:0 }}>
          {lang==='id'
            ? 'BlockBite adalah game puzzle match-3 on-chain di Solana. Selesaikan Babak, tulis bukti on-chain, dan klaim hadiah USDC nyata.'
            : 'BlockBite is an on-chain match-3 puzzle game on Solana. Clear Acts, write proofs on-chain, and claim real USDC rewards.'}
        </p>

        {/* Brand mascots */}
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap', alignItems:'flex-end' }}>
          {BRAND_MASCOTS.map((m, i) => (
            <Link key={m.id} href="/mascots" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, textDecoration:'none', animation:`bbFloat ${2.6+i*.35}s ease-in-out infinite`, animationDelay:`${i*.22}s` }}>
              <MascotSVG cfg={m} size={90}/>
              <span style={{ fontSize:10, fontWeight:800, color: PALETTES[m.palKey][0], letterSpacing:'.5px' }}>{m.name}</span>
            </Link>
          ))}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          {BLOCK_COLORS.map((c,i) => (
            <div key={i} style={{ width:42, height:42, borderRadius:11, background:c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:'#0a0a14', animation:`bbFloat ${2.5+i*.3}s ease-in-out infinite`, animationDelay:`${i*.18}s` }}>
              {BLOCK_ICONS[i]}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:36, flexWrap:'wrap', justifyContent:'center' }}>
          {[{v:'4,000',l:lang==='id'?'LEVEL':'LEVELS'},{v:'8',l:lang==='id'?'BABAK':'ACTS'},{v:'100%',l:'ON-CHAIN'}].map((s,i)=>(
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900 }}>{s.v}</div>
              <div style={{ fontSize:11, color:'var(--ds-text-dim)', letterSpacing:'1.5px', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          <Link href="/game" style={{ padding:'14px 32px', borderRadius:12, background:'var(--ds-grad)', color:'#0a0a14', fontWeight:900, fontSize:16, textDecoration:'none', boxShadow:'0 0 28px rgba(167,139,250,.45)' }}>
            ▶ {lang==='id'?'MAIN SEKARANG':'PLAY NOW'}
          </Link>
          <Link href="/waitlist" style={{ padding:'14px 28px', borderRadius:12, background:'transparent', border:'1px solid var(--ds-border)', color:'var(--ds-text)', fontWeight:700, fontSize:16, textDecoration:'none' }}>
            {lang==='id'?'✉ DAFTAR WAITLIST':'✉ JOIN WAITLIST'}
          </Link>
          <Link href="/map" style={{ padding:'14px 28px', borderRadius:12, background:'transparent', border:'1px solid var(--ds-border)', color:'var(--ds-text)', fontWeight:700, fontSize:16, textDecoration:'none' }}>
            {lang==='id'?'LIHAT PETA':'VIEW MAP'}
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 24px', maxWidth:1100, margin:'0 auto' }}>
        <p style={{ fontSize:11, letterSpacing:'2px', color:'var(--ds-accent)', textAlign:'center', marginBottom:10 }}>{lang==='id'?'FITUR UTAMA':'CORE FEATURES'}</p>
        <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, textAlign:'center', marginBottom:40 }}>{lang==='id'?'Kenapa BlockBite?':'Why BlockBite?'}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
          {F.map((f,i)=>(
            <div key={i} style={{ padding:24, borderRadius:20, background:'var(--ds-surface)', border:'1px solid var(--ds-border)', transition:'.2s' }}
              onMouseEnter={e=>{const d=e.currentTarget as HTMLElement;d.style.borderColor='var(--ds-accent)';d.style.background='rgba(167,139,250,.08)';}}
              onMouseLeave={e=>{const d=e.currentTarget as HTMLElement;d.style.borderColor='var(--ds-border)';d.style.background='var(--ds-surface)';}}>
              <div style={{ fontSize:32, marginBottom:14 }}>{f.ic}</div>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>{f.t}</div>
              <div style={{ fontSize:13, color:'var(--ds-text-dim)', lineHeight:1.6 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 24px', maxWidth:1100, margin:'0 auto' }}>
        <p style={{ fontSize:11, letterSpacing:'2px', color:'var(--ds-accent)', textAlign:'center', marginBottom:10 }}>{lang==='id'?'CARA KERJA':'HOW IT WORKS'}</p>
        <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, textAlign:'center', marginBottom:40 }}>{lang==='id'?'Mulai dalam 4 langkah':'Start in 4 steps'}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {S.map((s,i)=>(
            <div key={i} style={{ padding:22, borderRadius:16, background:'var(--ds-surface)', border:'1px solid var(--ds-border)', position:'relative', overflow:'hidden' }}>
              <div style={{ fontSize:52, fontWeight:900, color:'var(--ds-accent)', opacity:.12, position:'absolute', top:6, right:12, lineHeight:1, userSelect:'none' }}>{i+1}</div>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:8, position:'relative' }}>{s.t}</div>
              <div style={{ fontSize:12, color:'var(--ds-text-dim)', lineHeight:1.6, position:'relative' }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 8 BIOMES */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 24px', maxWidth:1100, margin:'0 auto' }}>
        <p style={{ fontSize:11, letterSpacing:'2px', color:'var(--ds-accent)', textAlign:'center', marginBottom:10 }}>{lang==='id'?'8 BIOMA · 4.000 LEVEL':'8 BIOMES · 4,000 LEVELS'}</p>
        <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, textAlign:'center', marginBottom:40 }}>{lang==='id'?'Dunia Petualangan':'Worlds to Conquer'}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:12 }}>
          {B.map((name,i)=>(
            <Link key={i} href={`/map?act=${i+1}`} style={{ textDecoration:'none' }}>
              <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--ds-surface)', border:`1px solid rgba(0,0,0,0)`, borderLeft:`3px solid ${BIOME_COLORS[i]}`, outline:`1px solid rgba(${BIOME_COLORS[i]},0.25)`, transition:'.2s', cursor:'pointer' }}>
                <div style={{ fontSize:11, color:BIOME_COLORS[i], fontWeight:800, letterSpacing:'1px', marginBottom:4 }}>{lang==='id'?`BABAK ${i+1}`:`ACT ${i+1}`}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--ds-text)' }}>{name}</div>
                <div style={{ fontSize:11, color:'var(--ds-text-dim)', marginTop:2 }}>{lang==='id'?`Level ${i*500+1}–${(i+1)*500}`:`Levels ${i*500+1}–${(i+1)*500}`}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TOKENOMICS */}
      <section style={{ position:'relative', zIndex:1, padding:'60px 24px 80px', maxWidth:600, margin:'0 auto', textAlign:'center' }}>
        <p style={{ fontSize:11, letterSpacing:'2px', color:'var(--ds-accent)', marginBottom:10 }}>{lang==='id'?'TOKENOMIK':'TOKENOMICS'}</p>
        <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, marginBottom:32 }}>{lang==='id'?'Pembagian Pendapatan':'Revenue Split'}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {[
            {pct:'70%',c:'#5eead4',t:lang==='id'?'Pool Hadiah':'Prize Pool',   d:lang==='id'?'Dibayar ke pemenang via vault PDA':'Paid to winners via vault PDA'},
            {pct:'15%',c:'#a78bfa',t:lang==='id'?'Tim':'Team',                 d:lang==='id'?'Operasional & pemasaran':'Operations & marketing'},
            {pct:'10%',c:'#fbbf24',t:lang==='id'?'Dev':'Dev',                  d:lang==='id'?'Pengembangan protokol':'Protocol development'},
            {pct:'5%', c:'#f472b6',t:lang==='id'?'Referral':'Referral',        d:lang==='id'?'Langsung ke wallet referrer':'Direct to referrer wallet'},
          ].map((tok,i)=>(
            <div key={i} style={{ padding:18, borderRadius:14, background:'var(--ds-surface)', border:'1px solid var(--ds-border)', display:'flex', alignItems:'center', gap:14, textAlign:'left' }}>
              <div style={{ fontSize:26, fontWeight:900, color:tok.c, flexShrink:0 }}>{tok.pct}</div>
              <div><div style={{ fontWeight:800, marginBottom:2 }}>{tok.t}</div><div style={{ fontSize:11, color:'var(--ds-text-dim)' }}>{tok.d}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid var(--ds-border)', padding:'28px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, fontSize:12, color:'var(--ds-text-dim)' }}>
        <div>© 2026 BlockBite · Solana Devnet</div>
        <div style={{ display:'flex', gap:20 }}>
          {['Twitter / X','Discord','GitHub'].map(lnk=>(
            <a key={lnk} href="#" style={{ color:'var(--ds-text-dim)', textDecoration:'none' }}
              onMouseEnter={e=>(e.currentTarget.style.color='var(--ds-accent)')}
              onMouseLeave={e=>(e.currentTarget.style.color='var(--ds-text-dim)')}
            >{lnk}</a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes bbPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        @keyframes bbFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-10px) rotate(5deg)}}
      `}</style>
    </div>
  );
}
