/**
 * lib/i18n.ts — Bilingual-compatible shape, but locked to English.
 *
 * Kept in case translations are re-introduced. The export shape is now
 * English-only (no `[lang]` lookup); all pages use the English strings
 * directly. Switch `I18N.streams.title` instead of `I18N[lang].streams.title`.
 */

const common = {
  connectWallet:    'Connect Wallet',
  connectWalletCta: 'Connect Wallet →',
  loading:          'Loading…',
  retry:            'Retry',
  viewDemo:         'View Demo →',
  createStream:     'Create Stream',
  viewAllStreams:   'View all streams →',
  demo:             'Demo ↗',
  refresh:          '↻ Refresh',
  cancel:           'Cancel',
  back:             '←',
  playGame:         '▶ Play Game',
  viewExplorer:     'View on Explorer ↗',
  tdpProtocol:      'TDP Protocol · Devnet',
} as const;

const streams = {
  badge:       'TDP Protocol · Devnet',
  title:       'Token Streams',
  subtitle:    'Cliff · linear · milestone vesting streams. Each stream is a PDA vault on Solana devnet.',
  createBtn:   '+ Create Stream',
  demoBtn:     '◈ View Demo',
  kpi: {
    streams:    'Your Streams',
    streamsSub: 'as creator or recipient',
    active:     'Active',
    activeSub:  'currently streaming',
    locked:     'Total Locked',
    lockedSub:  'across your streams',
    claimed:    'Total Claimed',
    claimedSub: 'all-time withdrawn',
  },
  walletTitle: 'Connect wallet to see your streams',
  walletSub:   "Your streams will appear here — streams you created and streams you're a beneficiary of.",
  connectBtn:  'Connect Wallet',
  orDemo:      'Or explore the demo →',
  loadingMsg:  'Loading streams from Solana devnet…',
  filterAll:       'All',
  filterActive:    'Active',
  filterPending:   'Pending',
  filterCompleted: 'Completed',
  filterCancelled: 'Cancelled',
  streamCount: (n: number) => `${n} stream${n !== 1 ? 's' : ''} · click a row to view details`,
  noMatch:     'No streams match this filter.',
  createFirst: 'Create your first stream →',
  headers:     ['STREAM / ROLE', 'TYPE', 'TOTAL TOKENS', 'CREATOR / TEAM', 'DATE CREATED', 'STATUS'],
  youCreated:  'You created',
  youReceive:  'You receive',
  milestone:   (n: number) => `${n} milestone${n !== 1 ? 's' : ''}`,
  tableFooter: 'Live on-chain data · Solana devnet · Click any row to view details, claim, or cancel',
  quickTitle:  'Quick Actions',
  quickItems: [
    { label: 'Create New Stream',  desc: 'Lock tokens into a PDA vault',     href: '/streams/new' },
    { label: 'Claim Tokens',       desc: 'Withdraw vested tokens',            href: '/claim' },
    { label: 'Verify Milestone',   desc: 'Unlock milestone allocation',       href: '/milestones' },
    { label: 'Vesting Calculator', desc: 'Model distribution schedule',       href: '/calculator' },
    { label: 'View Demo',          desc: 'Simulated data walkthrough',        href: '/demo' },
  ],
} as const;

const claim = {
  badge:         'TDP · Claim Portal',
  title:         'Claim Vested Tokens',
  subtitle:      'Withdraw your vested tokens from on-chain PDA vaults. Amounts are calculated from the live blockchain state.',
  demoLink:      'Explore demo mode →',
  walletTitle:   'Connect wallet to claim',
  walletSub:     'Connect the wallet that is the beneficiary of a stream to see your claimable tokens.',
  connectBtn:    'Connect Wallet',
  loadingMsg:    'Loading your streams from Solana devnet…',
  noStreamsTitle: 'No streams found',
  noStreamsSub:  'No vesting streams where this wallet is the beneficiary were found on devnet.',
  createStream:  'Create a stream',
  viewDemo:      'View demo',
  progressLabel: 'Progress',
  unlockedPct:   (p: number) => `${p.toFixed(1)}% unlocked`,
  statsLabels: {
    total:     'Total Locked',
    withdrawn: 'Withdrawn',
    claimable: 'Claimable Now',
  },
  cliffLabel: 'Cliff',
  endLabel:   'End',
  pendingWarning: (date: string) => `⏱ Cliff has not passed yet. Tokens will begin unlocking on ${date}.`,
  claimedSuccess: '✓ Claimed successfully!',
  gameGateWarning: '⚠ Play the game first to claim tokens',
  btnApproving:   'Waiting for wallet approval…',
  btnConfirming:  'Confirming on chain…',
  btnGameGate:    'Play game to unlock claim',
  btnCliffNotMet: 'Cliff not reached',
  btnNoClaim:     'Nothing to claim',
  btnClaim:       (amt: string) => `Claim ${amt} TOKEN`,
  footerNote:     'Solana devnet · Tokens released directly to your wallet',
  unlocked:       'Unlocked',
  claimed:        'Claimed',
} as const;

const milestones = {
  badge:       'TDP · Verification Layer',
  title:       'Milestone Verification Layer',
  subtitle:    'Projects choose their verification method. All methods enforceable on-chain via the TDP smart contract.',
  backStreams:  '← Streams',
  sectionHeader: 'Select Verification Method',
  walletTitle: 'Connect Wallet to View Your Streams',
  walletSub:   'Milestone verification is available to stream creators. Connect to see the streams you manage.',
  connectBtn:  'Connect Wallet',
  loadingMsg:  'Fetching your streams from Solana devnet…',
  noStreamsTitle: 'No Streams Found',
  noStreamsSub:  "You haven't created any streams yet.",
  upgradeTitle: 'Milestone Gates — Awaiting Program Upgrade (devnet v0.1.0)',
  upgradeSub:   'The deployed devnet program uses linear vesting only. configure_milestones / verify_milestone deploy in the next release.',
  streamDetails: 'Stream Details',
  claimFormula:  'Claimable Formula',
  noMilestonesTitle: 'No Milestone Gates Configured',
  noMilestonesSub:   'This stream uses linear vesting only. Milestone gates are added via configure_milestones after the program upgrade deploys.',
  related:       'Related',
  relatedLinks: [
    { href: '/claim',     label: 'Claim Portal' },
    { href: '/streams',   label: 'All Streams' },
    { href: '/analytics', label: 'Protocol Analytics' },
    { href: '/audit',     label: 'Audit Trail' },
    { href: '/game',      label: 'Play & Verify' },
  ],
  statusLabels: { cancelled: 'Cancelled', active: 'Active', ended: 'Ended' },
  streamLabels: {
    status: 'Status', start: 'Start', cliff: 'Cliff', end: 'End', streamId: 'Stream ID',
  },
  milestoneLabel: (i: number) => `Milestone ${i + 1}`,
  pendingVerif: 'Pending verification',
  verifiedOnChain: '✓ Verified on-chain',
  awaitingUpgrade: 'Awaiting upgrade',
  viewAuditTrail: 'View Audit Trail ↗',
  seeDemo:        'See Demo →',
  viewAudit:      'View Audit Trail ↗',
} as const;

const campaigns = {
  badge:       'TDP · Recipient Dashboard',
  title:       'My Campaigns',
  subtitle:    'Campaigns you have been added to as a token recipient.',
  createBtn:   '+ Create Campaign',
  walletTitle: 'Connect Your Wallet',
  walletSub:   'Connect your Solana wallet to see campaigns you have been invited to as a recipient.',
  connectBtn:  'Connect Wallet →',
  noCampaigns: 'No campaigns found for this wallet. Ask your campaign creator to add your address.',
  viewStreams:  'View all streams →',
  yourAlloc:   'Your Allocation',
  allocProgress: 'Allocation progress',
  verified:    'Verified — ready to claim',
  pendingVerif: 'Pending game verification',
  viewDetails: 'View details →',
} as const;

const analytics = {
  badge:      'TDP · Protocol Analytics',
  title:      'Protocol Analytics',
  subtitle:   'On-chain metrics aggregated across all vesting streams on Solana devnet.',
  exportCsv:  '↓ Export CSV',
  methodology:'Single Source of Truth — Internal Tracker',
  noWallet:   'Connect wallet to see your personal analytics.',
  loading:    'Loading on-chain data…',
} as const;

const audit = {
  badge:     'TDP · Audit Trail',
  title:     'Audit Trail',
  subtitle:  'Immutable event log. Every on-chain action is recorded and verifiable on Solana devnet.',
  exportCsv: '↓ Export CSV',
  loading:   'Loading on-chain events…',
  noEvents:  'No on-chain events found for this wallet.',
  connectMsg: 'Connect wallet to see your audit trail.',
  eventTypes: {
    created:   'Stream Created',
    withdrawn: 'Tokens Withdrawn',
    cancelled: 'Stream Cancelled',
    milestone: 'Milestone Verified',
  },
} as const;

const calculator = {
  badge:    'TDP · Vesting Calculator',
  title:    'Vesting Calculator',
  subtitle: 'Model your token distribution schedule before creating a stream on-chain.',
  calculate: 'Calculate',
  reset:     'Reset',
  schedule:  'Vesting Schedule',
  fields: {
    total:       'Total Token Amount',
    cliff:       'Cliff Period (days)',
    vest:        'Vesting Duration (days)',
    type:        'Vesting Type',
    milestones:  'Number of Milestones',
  },
  types: { linear: 'Linear', cliff: 'Cliff Only', milestone: 'Milestone', hybrid: 'Hybrid' },
  results: {
    atCliff:    'Tokens at Cliff',
    perDay:     'Tokens per Day',
    perMonth:   'Tokens per Month',
    fullVest:   'Full Vest Date',
  },
  createFromCalc: 'Create Stream with These Settings →',
} as const;

const protocol = {
  badge:    'TDP · Protocol Overview',
  title:    'Token Distribution Protocol',
  subtitle: 'BlockBite is the unified engine for automated token logistics.',
  launchApp: 'Launch App →',
  readDocs:  'Read Docs',
  features: [
    { title: 'Modular Verification Layers',    desc: 'Choose game-based, oracle, multisig, or manual verification per stream.' },
    { title: 'Adaptive Tokenomics Logic',      desc: 'Cliff, linear, and milestone schedules — fully configurable on-chain.' },
    { title: 'Eliminate Manual Overhead',      desc: 'Automated release logic removes the need for manual token distributions.' },
    { title: 'Active Clawback Control',        desc: 'Cancel or claw back unvested tokens at any time via signed transaction.' },
    { title: 'Professional Standard Security', desc: 'PDA vaults with program-derived authority. No admin key required.' },
  ],
} as const;

const streamsNew = {
  badge:    'TDP · Create Stream',
  title:    'Create Vesting Stream',
  subtitle: 'Lock tokens into a PDA vault on Solana devnet. Configure cliff, schedule, and optional milestone gates.',
  submitBtn:  'Create Stream on Devnet',
  submitting: 'Creating stream…',
  successTitle: 'Stream Created!',
  successSub:   'Your vesting stream is live on Solana devnet.',
  viewStream:   'View Stream →',
  createAnother: 'Create Another',
  fields: {
    recipient:   'Recipient Address',
    amount:      'Token Amount',
    cliff:       'Cliff Date',
    end:         'End Date',
    vestType:    'Vesting Type',
    milestones:  'Milestone Count',
    gameGate:    'Game Verification Gate',
    requiredTier:'Required Game Tier',
  },
  types: { linear: 'Linear', cliff: 'Cliff', milestone: 'Milestone', hybrid: 'Hybrid' },
  walletTitle: 'Connect Wallet to Create a Stream',
  walletSub:   'You need a connected wallet to sign the create_stream transaction on Solana devnet.',
} as const;

const streamsDetail = {
  backBtn:     '← All Streams',
  badge:       'Stream Detail',
  claimBtn:    'Claim Vested Tokens',
  cancelBtn:   'Cancel Stream',
  detailsTitle:'Stream Details',
  activityTitle:'On-Chain Activity',
  milestonesTitle: 'Milestone Gates',
  statsLabels: {
    total:     'Total Locked',
    withdrawn: 'Withdrawn',
    claimable: 'Claimable Now',
    cliff:     'Cliff',
    start:     'Start',
    end:       'End',
    type:      'Type',
    status:    'Status',
    recipient: 'Recipient',
    creator:   'Creator',
  },
  authorityBadges: {
    solo:       '⚠ SOLO AUTHORITY',
    restricted: '🔒 RESTRICTED',
  },
  cancelModal: {
    title:   'Cancel this stream?',
    sub:     'Unvested tokens will be returned to the stream creator. This action is irreversible.',
    confirm: 'Yes, Cancel Stream',
    abort:   'Keep Stream',
  },
} as const;

const waitlist = {
  badge:    'COMING SOON',
  title:    'Join the BlockBite Waitlist',
  subtitle: "Be first in line when BlockBite's Token Distribution Protocol goes live.",
  placeholder: 'Enter your email address',
  submitBtn:   'Join Waitlist',
  submitting:  'Joining…',
  successTitle:"You're on the list!",
  successSub:  "We'll notify you when BlockBite launches.",
  privacyNote: 'No spam. Unsubscribe anytime.',
  features: {
    kicker: 'WHY JOIN EARLY',
    title:  'The complete TDP toolkit',
    items: [
      { title: 'Modular Verification Layers',    desc: 'Game, oracle, multisig, or manual verification — pick the layer that fits your security model.' },
      { title: 'Adaptive Tokenomics Logic',      desc: 'Linear, cliff, milestone, and hybrid schedules that auto-execute on-chain without human intervention.' },
      { title: 'Eliminate Manual Overhead',      desc: 'Replace spreadsheets and manual transfers with trustless smart-contract automation.' },
      { title: 'Active Clawback Control',        desc: 'Retain the right to reclaim unvested tokens via instant on-chain cancellation.' },
      { title: 'Professional Standard Security', desc: 'PDA vaults with program-derived authority — no admin keys, no custodial risk.' },
    ],
  },
  steps: {
    kicker: 'HOW IT WORKS',
    title:  '3 steps to automated token distribution',
    items: [
      { n: '01', title: 'Connect your wallet',         desc: 'Link your Solana wallet to the TDP dashboard. No account creation needed.' },
      { n: '02', title: 'Configure your stream',       desc: 'Set the recipient, token amount, cliff date, and vesting schedule in one form.' },
      { n: '03', title: 'Choose your verification',    desc: 'Choose between a simple direct claim for maximum ease, or gamified verification to act as an anti-bots filter.' },
    ],
  },
} as const;

const howToPlay = {
  badge:    'BLOCKBITE TDP',
  title:    'How the Token Distribution Protocol Works',
  subtitle: 'A step-by-step guide to vesting, claiming, and verification on Solana.',
  steps: [
    { title: 'Connect Your Wallet',       desc: 'Link your Solana wallet to sign transactions on devnet. Use Phantom, Backpack, or any Wallet Adapter-compatible wallet.' },
    { title: 'Create a Vesting Stream',   desc: 'Lock tokens into a PDA vault by setting a recipient, cliff date, end date, and vesting type (linear, milestone, hybrid).' },
    { title: 'Choose Verification',       desc: 'Choose between a simple direct claim for maximum ease, or gamified verification to act as an anti-bots filter.' },
    { title: 'Claim Vested Tokens',       desc: 'Once past the cliff, the beneficiary can withdraw unlocked tokens any time from the Claim Portal.' },
    { title: 'Manage & Audit',            desc: 'Cancel streams, verify milestones, and view the full immutable audit trail on-chain.' },
  ],
  faqTitle: 'Frequently Asked Questions',
} as const;

export const I18N = {
  common, streams, claim, milestones, campaigns,
  analytics, audit, calculator, protocol,
  streamsNew, streamsDetail, waitlist, howToPlay,
};
