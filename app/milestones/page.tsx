'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Navbar from '@/components/Navbar';
import { getStreamsByAuthority, StreamInfo } from '@/lib/anchor/vesting-client';
import { BN } from '@coral-xyz/anchor';

const DS = {
  bg0: '#05040d', bg1: '#09071a',
  accent: '#a78bff', gold: '#f5c66a', green: '#5fd07a',
  red: '#ff3b6b', blue: '#7ad7ff', purple: '#c084fc',
  muted: 'rgba(232,225,248,.38)', border: 'rgba(167,139,255,.13)',
  card: 'rgba(255,255,255,.042)',
  cinzel: "'Space Grotesk', system-ui, sans-serif",
  sora: "'Sora', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

type VerifyMethod = 'game' | 'oracle' | 'multisig' | 'manual';

const VERIFY_METHODS: {
  id: VerifyMethod; label: string; icon: string; color: string;
  title: string; desc: string; badge: string; detail: string; action: string;
}[] = [
  { id: 'game',     label: 'Game',     icon: '◈', color: DS.purple,
    title: 'Play to Unlock',       badge: 'Sybil-Resistant', action: 'Play & Verify',
    desc:   'Score thresholds trigger on-chain milestone verification. Gamified, sybil-resistant.',
    detail: 'Score ≥ 1,000 pts → signed proof submitted to TDP ProofCache PDA.' },
  { id: 'oracle',   label: 'Oracle',   icon: '⬡', color: DS.blue,
    title: 'Chainlink Automated',  badge: 'Fully Automated', action: 'Connect Feed',
    desc:   'KPI thresholds (user count, revenue, TVL) trigger milestone unlock automatically.',
    detail: 'Configure an oracle endpoint and threshold. TDP polls on a schedule and auto-verifies.' },
  { id: 'multisig', label: 'MultiSig', icon: '◉', color: DS.gold,
    title: 'Multi-Sig Approval',   badge: 'DAO Native',      action: 'Collect Signatures',
    desc:   '3-of-5 designated signers approve milestone completion. Ideal for DAO governance.',
    detail: '3 of 5 configured signers co-sign a verify_milestone instruction. Signer list locked at creation.' },
  { id: 'manual',   label: 'Manual',   icon: '✦', color: DS.green,
    title: 'Creator Signs',        badge: 'Permissioned',    action: 'Creator Verify',
    desc:   'Stream creator manually verifies KPI completion with a signed transaction.',
    detail: 'Stream creator submits a signed verify_milestone transaction. Simple and auditable.' },
];

function fmtTs(ts: BN | undefined): string {
  if (!ts) return '—';
  const sec = Number(ts.toString());
  if (sec === 0) return 'No cliff';
  return new Date(sec * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtAmt(n: BN | undefined): string {
  if (!n) return '—';
  const raw = BigInt(n.toString());
  return (raw / 1_000_000n).toLocaleString();
}

export default function MilestonesPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [streams, setStreams]   = useState<StreamInfo[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [selIdx,  setSelIdx]    = useState(0);
  const [selMethod, setMethod]  = useState<VerifyMethod>('game');

  const load = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true); setError(null);
    try {
      setStreams(await getStreamsByAuthority(connection, publicKey));
      setSelIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'RPC error');
    } finally { setLoading(false); }
  }, [connection, publicKey]);

  useEffect(() => { if (connected) load(); else setStreams([]); }, [connected, load]);

  const method = VERIFY_METHODS.find(v => v.id === selMethod)!;
  const stream = streams[selIdx];
  const nowSec = Math.floor(Date.now() / 1000);
  const mCount = (stream as any)?.milestoneCount ?? 0;
  const isActive = stream && !stream.cancelled && Number(stream.endTs.toString()) > nowSec;

  return (
    <main style={{ minHeight: '100vh', background: DS.bg0, color: '#f0ecff', fontFamily: DS.sora }}>
      <Navbar />

      {/* Header */}
      <div style={{ padding: '80px 24px 40px', background: `linear-gradient(180deg,${DS.bg1} 0%,${DS.bg0} 100%)`, borderBottom: `1px solid ${DS.border}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', color: DS.blue, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>TDP · Verification Layer</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h1 style={{ fontFamily: DS.cinzel, fontSize: 'clamp(26px,5vw,42px)', fontWeight: 900, marginBottom: 10 }}>Milestone Verification Layer</h1>
              <p style={{ fontSize: 14, color: DS.muted, maxWidth: 580, lineHeight: 1.65 }}>
                Projects choose their verification method. All methods enforceable on-chain via the TDP smart contract.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/streams" style={{ fontSize: 12, color: DS.muted, textDecoration: 'none' }}>← Streams</Link>
              <Link href="/demo#milestones" style={{ fontSize: 12, color: DS.accent, textDecoration: 'none' }}>Demo ↗</Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 100px' }}>

        {/* Verification method selector — product documentation, not live data */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: '1.8px', color: DS.accent, fontWeight: 700, marginBottom: 18, textTransform: 'uppercase' }}>Select Verification Method</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            {VERIFY_METHODS.map(m => {
              const on = selMethod === m.id;
              return (
                <button key={m.id} onClick={() => setMethod(m.id)} style={{
                  padding: '20px 18px', borderRadius: 18, textAlign: 'left', cursor: 'pointer',
                  background: on ? `${m.color}14` : DS.card,
                  border: `1.5px solid ${on ? m.color + '55' : DS.border}`,
                  color: '#f0ecff', fontFamily: DS.sora, transition: 'all .18s',
                  boxShadow: on ? `0 0 24px ${m.color}22` : 'none',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${m.color}18`, border: `1px solid ${m.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: m.color, marginBottom: 12 }}>{m.icon}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 700, letterSpacing: '1.4px', marginBottom: 4 }}>{m.label.toUpperCase()}</div>
                  <div style={{ fontFamily: DS.cinzel, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{m.title}</div>
                  <div style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.5 }}>{m.desc}</div>
                  <div style={{ marginTop: 12, display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 700, background: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30` }}>{m.badge}</div>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 16, padding: '18px 22px', borderRadius: 14, background: `${method.color}0a`, border: `1px solid ${method.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: method.color, fontWeight: 700, marginBottom: 4 }}>{method.icon} {method.label} — {method.title}</div>
              <div style={{ fontSize: 13, color: DS.muted }}>{method.detail}</div>
            </div>
            {method.id === 'game'
              ? <Link href="/game" style={{ padding: '9px 20px', borderRadius: 10, background: `linear-gradient(135deg,${DS.purple}cc,#6b21a8cc)`, color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>{method.action} →</Link>
              : <button style={{ padding: '9px 20px', borderRadius: 10, cursor: 'pointer', background: `${method.color}22`, border: `1px solid ${method.color}44`, color: method.color, fontWeight: 700, fontSize: 13, fontFamily: DS.sora }}>{method.action} →</button>
            }
          </div>
        </div>

        {/* Wallet gate */}
        {!connected && (
          <div style={{ padding: '52px 24px', textAlign: 'center', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 18 }}>
            <div style={{ fontSize: 36, marginBottom: 16, color: DS.gold }}>◉</div>
            <div style={{ fontFamily: DS.cinzel, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connect Wallet to View Your Streams</div>
            <p style={{ color: DS.muted, fontSize: 13, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Milestone verification is available to stream creators. Connect to see the streams you manage.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setVisible(true)} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${DS.accent}cc,#7c3aedcc)`, color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: DS.sora }}>Connect Wallet</button>
              <Link href="/demo#milestones" style={{ padding: '12px 24px', borderRadius: 12, border: `1px solid ${DS.border}`, color: DS.muted, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>View Demo →</Link>
            </div>
          </div>
        )}

        {connected && loading && <div style={{ padding: '48px', textAlign: 'center', color: DS.muted, fontSize: 13 }}>Fetching your streams from Solana devnet…</div>}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#f871711a', border: '1px solid #f8717144', fontSize: 12, color: DS.red, marginBottom: 16 }}>
            RPC error: {error} · <button onClick={load} style={{ background: 'none', border: 'none', color: DS.accent, cursor: 'pointer', fontSize: 12 }}>Retry</button>
          </div>
        )}

        {connected && !loading && streams.length === 0 && !error && (
          <div style={{ padding: '52px 24px', textAlign: 'center', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 18 }}>
            <div style={{ fontFamily: DS.cinzel, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Streams Found</div>
            <p style={{ color: DS.muted, fontSize: 13, marginBottom: 20 }}>You haven't created any streams yet.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/streams/new" style={{ padding: '10px 22px', borderRadius: 10, background: `linear-gradient(135deg,${DS.accent}cc,#7c3aedcc)`, color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Create Stream</Link>
              <Link href="/demo#milestones" style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${DS.border}`, color: DS.muted, fontSize: 12, textDecoration: 'none' }}>View Demo</Link>
            </div>
          </div>
        )}

        {connected && !loading && streams.length > 0 && (
          <>
            {/* Program upgrade notice */}
            <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 24, background: `${DS.gold}0d`, border: `1px solid ${DS.gold}33`, display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 20, color: DS.gold, flexShrink: 0 }}>◉</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: DS.gold, marginBottom: 3 }}>Milestone Gates — Awaiting Program Upgrade (devnet v0.1.0)</div>
                <div style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.6 }}>
                  The deployed devnet program uses linear vesting only.{' '}
                  <code style={{ fontFamily: DS.mono, fontSize: 10.5, color: DS.blue }}>configure_milestones</code> /{' '}
                  <code style={{ fontFamily: DS.mono, fontSize: 10.5, color: DS.blue }}>verify_milestone</code>{' '}
                  deploy in the next release. Your streams below are live on-chain now.
                </div>
              </div>
            </div>

            {/* Stream tabs */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {streams.map((s, i) => (
                <button key={s.pubkey.toBase58()} onClick={() => setSelIdx(i)} style={{
                  padding: '9px 16px', borderRadius: 11, cursor: 'pointer',
                  border: `1.5px solid ${selIdx === i ? DS.blue : 'rgba(255,255,255,.08)'}`,
                  background: selIdx === i ? `${DS.blue}14` : DS.card,
                  color: selIdx === i ? DS.blue : DS.muted,
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all .15s', fontFamily: DS.sora,
                }}>
                  {s.pubkey.toBase58().slice(0, 8)}…
                  <span style={{ marginLeft: 8, fontFamily: DS.mono, fontSize: 10, color: s.cancelled ? DS.red : Number(s.endTs.toString()) < nowSec ? DS.muted : DS.green }}>
                    {s.cancelled ? 'cancelled' : Number(s.endTs.toString()) < nowSec ? 'ended' : 'active'}
                  </span>
                </button>
              ))}
            </div>

            {stream && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
                <div>
                  {/* Stream info bar */}
                  <div style={{ padding: '14px 18px', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 14, marginBottom: 18, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                      { l: 'PDA',         v: stream.pubkey.toBase58().slice(0,12)+'…',     c: DS.accent },
                      { l: 'Total',       v: fmtAmt(stream.amountTotal)+' tokens',          c: '#fff'    },
                      { l: 'Withdrawn',   v: fmtAmt(stream.amountWithdrawn)+' tokens',      c: DS.blue   },
                      { l: 'Beneficiary', v: stream.beneficiary.toBase58().slice(0,10)+'…', c: DS.muted  },
                    ].map(r => (
                      <div key={r.l}>
                        <div style={{ fontSize: 9.5, color: DS.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 2 }}>{r.l}</div>
                        <div style={{ fontFamily: DS.mono, fontSize: 11.5, color: r.c }}>{r.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Milestone state */}
                  {mCount === 0 ? (
                    <div style={{ padding: '36px 24px', borderRadius: 14, textAlign: 'center', background: DS.card, border: `1px solid ${DS.border}` }}>
                      <div style={{ fontSize: 32, marginBottom: 14, color: DS.gold }}>◉</div>
                      <div style={{ fontFamily: DS.cinzel, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>No Milestone Gates Configured</div>
                      <p style={{ color: DS.muted, fontSize: 12.5, lineHeight: 1.7, maxWidth: 440, margin: '0 auto 22px' }}>
                        This stream uses linear vesting only. Milestone gates are added via{' '}
                        <code style={{ fontFamily: DS.mono, color: DS.blue, fontSize: 11 }}>configure_milestones</code>{' '}
                        after the program upgrade deploys. Pick a method above to learn how each works.
                      </p>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/audit" style={{ padding: '8px 18px', borderRadius: 10, background: `${DS.blue}18`, border: `1px solid ${DS.blue}33`, color: DS.blue, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View Audit Trail ↗</Link>
                        <Link href="/demo#milestones" style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${DS.border}`, color: DS.muted, fontSize: 12, textDecoration: 'none' }}>See Demo →</Link>
                      </div>
                    </div>
                  ) : Array.from({ length: mCount }).map((_, idx) => {
                    const done = ((stream as any).milestonesVerified?.[idx]) ?? false;
                    const pct  = ((stream as any).milestonePct?.[idx]) ?? 0;
                    return (
                      <div key={idx} style={{ background: done ? `${DS.green}06` : DS.card, border: `1px solid ${done ? DS.green+'33' : DS.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DS.mono, fontSize: 14, fontWeight: 700, background: done ? `${DS.green}20` : 'rgba(255,255,255,.06)', border: `2px solid ${done ? DS.green : 'rgba(255,255,255,.1)'}`, color: done ? DS.green : DS.muted }}>
                            {done ? '✓' : idx}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Milestone {idx + 1}</div>
                            <div style={{ fontFamily: DS.mono, fontSize: 11.5, color: done ? DS.green : DS.muted }}>{pct}% allocation · {done ? '✓ Verified on-chain' : 'Pending verification'}</div>
                          </div>
                          {!done && <span style={{ padding: '6px 14px', borderRadius: 9, fontSize: 11, background: `${DS.gold}12`, border: `1px solid ${DS.gold}33`, color: DS.gold, fontWeight: 600 }}>Awaiting upgrade</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Side panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 16, padding: '18px 20px' }}>
                    <div style={{ fontFamily: DS.cinzel, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Stream Details</div>
                    {[
                      { l: 'Status',    v: stream.cancelled ? 'Cancelled' : isActive ? 'Active' : 'Ended', c: stream.cancelled ? DS.red : isActive ? DS.green : DS.muted },
                      { l: 'Start',     v: fmtTs(stream.startTs),  c: '#fff'   },
                      { l: 'Cliff',     v: fmtTs(stream.cliffTs),  c: DS.gold  },
                      { l: 'End',       v: fmtTs(stream.endTs),    c: '#fff'   },
                      { l: 'Stream ID', v: stream.streamId.toString(), c: DS.muted },
                    ].map((r, i, a) => (
                      <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < a.length-1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                        <span style={{ fontSize: 11, color: DS.muted }}>{r.l}</span>
                        <span style={{ fontFamily: DS.mono, fontSize: 11, color: r.c, fontWeight: 600 }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: `${DS.blue}08`, border: `1px solid ${DS.blue}22`, borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ fontSize: 10, color: DS.blue, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Claimable Formula</div>
                    <pre style={{ fontFamily: DS.mono, fontSize: 10, color: 'rgba(255,255,255,.75)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{`claimable(t) = min(\n  unlocked(t),\n  total × Σ pct[i]\n  where verified[i]=true\n)`}</pre>
                  </div>
                  <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 10, color: DS.muted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Related</div>
                    {[
                      { href: '/claim',     label: 'Claim Portal',        col: DS.gold   },
                      { href: '/streams',   label: 'All Streams',         col: DS.accent },
                      { href: '/analytics', label: 'Protocol Analytics',  col: DS.green  },
                      { href: '/audit',     label: 'Audit Trail',         col: DS.blue   },
                      { href: '/game',      label: 'Play & Verify',       col: DS.purple },
                    ].map(l => (
                      <Link key={l.href} href={l.href} style={{ fontSize: 12.5, color: l.col, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: l.col, flexShrink: 0 }} />
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
