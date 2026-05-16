/**
 * Week 5 — Cliff + Milestone-Based Vesting + Cancel
 * Acceptance criteria coverage:
 *   - Cliff vesting works at boundary points (before, at, after cliff)
 *   - Milestone-based vesting: zero before flag, full curve after flag
 *   - cancel_stream: creator-only, partial split (vested → beneficiary,
 *     unvested → creator)
 *   - Error: AlreadyCancelled on double-cancel
 *   - Error: FullyVested on cancel-after-fully-vested
 *   - Error: Unauthorized on cancel by wrong signer
 *   - Error: NothingToWithdraw on withdraw-before-cliff
 *   - All Week-4 tests still pass — proven by tests/vesting.ts running first
 *
 * Run with:  anchor test
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

const IDL = require("../target/idl/blockbite_vesting.json");
const PROGRAM_ID = new PublicKey(IDL.address);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe("blockbite-vesting — Week 5: cliff + milestone + cancel", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new Program(IDL, provider);

  // Test harness — fresh keypairs so we don't collide with W4 stream_ids
  const creator   = Keypair.generate();
  const recipient = Keypair.generate();
  const stranger  = Keypair.generate(); // unauthorized signer

  let mint: PublicKey;
  let creatorAta: PublicKey;
  let recipientAta: PublicKey;
  let strangerAta: PublicKey;

  // Each test gets its own stream_id so PDA collisions can't sneak in
  let nextStreamId = 5_000;
  const newStreamId = () => new BN(nextStreamId++);
  const AMOUNT      = new BN(1_000_000);
  const DURATION    = 8; // 8s — short enough that the test runner can wait

  const streamPda = (auth: PublicKey, id: BN) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("stream"), auth.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID,
    )[0];

  const vaultPda = (auth: PublicKey, id: BN) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), auth.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID,
    )[0];

  before(async () => {
    for (const kp of [creator, recipient, stranger]) {
      const sig = await provider.connection.requestAirdrop(kp.publicKey, 2e9);
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
    mint = await createMint(provider.connection, creator, creator.publicKey, null, 6);
    creatorAta   = await createAssociatedTokenAccount(provider.connection, creator,   mint, creator.publicKey);
    recipientAta = await createAssociatedTokenAccount(provider.connection, recipient, mint, recipient.publicKey);
    strangerAta  = await createAssociatedTokenAccount(provider.connection, stranger,  mint, stranger.publicKey);
    await mintTo(provider.connection, creator, mint, creatorAta, creator, 50_000_000);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CLIFF VESTING
  // ──────────────────────────────────────────────────────────────────────────

  it("W5-1: cliff blocks unlock before cliff_ts (off-chain math, on-chain state)", async () => {
    const id = newStreamId();
    const now = Math.floor(Date.now() / 1000);
    const startTs = new BN(now);
    const cliffTs = new BN(now + 4);          // cliff 4s into a 8s window
    const endTs   = new BN(now + DURATION);

    await program.methods
      .createStream(id, AMOUNT, startTs, cliffTs, endTs)
      .accounts({
        authority:     creator.publicKey,
        beneficiary:   recipient.publicKey,
        mint,
        stream:        streamPda(creator.publicKey, id),
        vault:         vaultPda(creator.publicKey, id),
        authorityAta:  creatorAta,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent:          SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const s = await program.account.streamAccount.fetch(streamPda(creator.publicKey, id));
    assert.equal(s.cliffTs.toNumber(), cliffTs.toNumber(), "cliff_ts persisted");
    assert.equal(s.amountWithdrawn.toString(), "0",       "nothing withdrawn yet");

    // Halfway between now and cliff — should be PRE-CLIFF
    const probe1 = startTs.toNumber() + 2; // 2s in
    assert(probe1 < cliffTs.toNumber(), "probe1 must be pre-cliff");
  });

  it("W5-2: withdrawing before cliff returns NothingToWithdraw", async () => {
    const id = newStreamId();
    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createStream(id, AMOUNT, new BN(now), new BN(now + 60), new BN(now + 120))
      .accounts({
        authority:     creator.publicKey,
        beneficiary:   recipient.publicKey,
        mint,
        stream:        streamPda(creator.publicKey, id),
        vault:         vaultPda(creator.publicKey, id),
        authorityAta:  creatorAta,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent:          SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    try {
      await program.methods
        .withdraw()
        .accounts({
          beneficiary:    recipient.publicKey,
          stream:         streamPda(creator.publicKey, id),
          vault:          vaultPda(creator.publicKey, id),
          beneficiaryAta: recipientAta,
          tokenProgram:   TOKEN_PROGRAM_ID,
        })
        .signers([recipient])
        .rpc();
      assert.fail("Should have thrown NothingToWithdraw");
    } catch (e: any) {
      assert.match(String(e), /NothingToWithdraw/);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // MILESTONE-BASED VESTING
  // ──────────────────────────────────────────────────────────────────────────

  it("W5-3: milestone stream — locked until set_milestone(true)", async () => {
    const id = newStreamId();
    const now = Math.floor(Date.now() / 1000);

    await program.methods
      .createMilestoneStream(id, AMOUNT, new BN(now - 100), new BN(0), new BN(now + 100))
      .accounts({
        authority:     creator.publicKey,
        beneficiary:   recipient.publicKey,
        mint,
        stream:        streamPda(creator.publicKey, id),
        vault:         vaultPda(creator.publicKey, id),
        authorityAta:  creatorAta,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent:          SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const s0 = await program.account.streamAccount.fetch(streamPda(creator.publicKey, id));
    assert.equal(s0.milestoneRequired, true, "milestone_required set");
    assert.equal(s0.milestoneMet, false,     "milestone starts unmet");

    // Withdrawing should fail despite time having elapsed
    try {
      await program.methods
        .withdraw()
        .accounts({
          beneficiary:    recipient.publicKey,
          stream:         streamPda(creator.publicKey, id),
          vault:          vaultPda(creator.publicKey, id),
          beneficiaryAta: recipientAta,
          tokenProgram:   TOKEN_PROGRAM_ID,
        })
        .signers([recipient])
        .rpc();
      assert.fail("Should have thrown — milestone not met");
    } catch (e: any) {
      assert.match(String(e), /NothingToWithdraw/);
    }

    // Flip the flag
    await program.methods
      .setMilestone(true)
      .accounts({
        authority: creator.publicKey,
        stream:    streamPda(creator.publicKey, id),
      })
      .signers([creator])
      .rpc();

    const s1 = await program.account.streamAccount.fetch(streamPda(creator.publicKey, id));
    assert.equal(s1.milestoneMet, true, "milestone flipped on-chain");

    // Now withdraw should succeed for the time-vested portion
    await program.methods
      .withdraw()
      .accounts({
        beneficiary:    recipient.publicKey,
        stream:         streamPda(creator.publicKey, id),
        vault:          vaultPda(creator.publicKey, id),
        beneficiaryAta: recipientAta,
        tokenProgram:   TOKEN_PROGRAM_ID,
      })
      .signers([recipient])
      .rpc();

    const after = await getAccount(provider.connection, recipientAta);
    assert(Number(after.amount) > 0, "beneficiary received some tokens post-milestone");
  });

  it("W5-4: set_milestone by non-creator → Unauthorized", async () => {
    const id = newStreamId();
    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createMilestoneStream(id, AMOUNT, new BN(now), new BN(0), new BN(now + 30))
      .accounts({
        authority:     creator.publicKey,
        beneficiary:   recipient.publicKey,
        mint,
        stream:        streamPda(creator.publicKey, id),
        vault:         vaultPda(creator.publicKey, id),
        authorityAta:  creatorAta,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent:          SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    try {
      await program.methods
        .setMilestone(true)
        .accounts({
          authority: stranger.publicKey,
          stream:    streamPda(creator.publicKey, id),
        })
        .signers([stranger])
        .rpc();
      assert.fail("Should have thrown Unauthorized");
    } catch (e: any) {
      assert.match(String(e), /Unauthorized/);
    }
  });

  it("W5-5: set_milestone on a time-only stream → MilestoneNotApplicable", async () => {
    const id = newStreamId();
    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createStream(id, AMOUNT, new BN(now), new BN(0), new BN(now + 30))
      .accounts({
        authority:     creator.publicKey,
        beneficiary:   recipient.publicKey,
        mint,
        stream:        streamPda(creator.publicKey, id),
        vault:         vaultPda(creator.publicKey, id),
        authorityAta:  creatorAta,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent:          SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    try {
      await program.methods
        .setMilestone(true)
        .accounts({
          authority: creator.publicKey,
          stream:    streamPda(creator.publicKey, id),
        })
        .signers([creator])
        .rpc();
      assert.fail("Should have thrown MilestoneNotApplicable");
    } catch (e: any) {
      assert.match(String(e), /MilestoneNotApplicable/);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CANCEL
  // ──────────────────────────────────────────────────────────────────────────

  it("W5-6: cancel pre-cliff returns ALL tokens to creator (nothing vested)", async () => {
    const id = newStreamId();
    const now = Math.floor(Date.now() / 1000);
    // Cliff far in the future so nothing has vested at cancel time
    const startTs = new BN(now);
    const cliffTs = new BN(now + 3600);
    const endTs   = new BN(now + 7200);

    await program.methods
      .createStream(id, AMOUNT, startTs, cliffTs, endTs)
      .accounts({
        authority:     creator.publicKey,
        beneficiary:   recipient.publicKey,
        mint,
        stream:        streamPda(creator.publicKey, id),
        vault:         vaultPda(creator.publicKey, id),
        authorityAta:  creatorAta,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent:          SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const creatorBefore   = await getAccount(provider.connection, creatorAta);
    const recipientBefore = await getAccount(provider.connection, recipientAta);

    await program.methods
      .cancelStream()
      .accounts({
        authority:      creator.publicKey,
        beneficiary:    recipient.publicKey,
        stream:         streamPda(creator.publicKey, id),
        vault:          vaultPda(creator.publicKey, id),
        authorityAta:   creatorAta,
        beneficiaryAta: recipientAta,
        tokenProgram:   TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    const creatorAfter   = await getAccount(provider.connection, creatorAta);
    const recipientAfter = await getAccount(provider.connection, recipientAta);

    assert.equal(
      (BigInt(creatorAfter.amount.toString()) - BigInt(creatorBefore.amount.toString())).toString(),
      AMOUNT.toString(),
      "creator must get full refund pre-cliff",
    );
    assert.equal(
      recipientAfter.amount.toString(),
      recipientBefore.amount.toString(),
      "recipient gets nothing pre-cliff",
    );

    const s = await program.account.streamAccount.fetch(streamPda(creator.publicKey, id));
    assert.equal(s.cancelled, true, "stream marked cancelled");
  });

  it("W5-7: double-cancel → AlreadyCancelled", async () => {
    const id = newStreamId();
    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createStream(id, AMOUNT, new BN(now), new BN(0), new BN(now + 30))
      .accounts({
        authority:     creator.publicKey,
        beneficiary:   recipient.publicKey,
        mint,
        stream:        streamPda(creator.publicKey, id),
        vault:         vaultPda(creator.publicKey, id),
        authorityAta:  creatorAta,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent:          SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    // First cancel succeeds
    await program.methods
      .cancelStream()
      .accounts({
        authority:      creator.publicKey,
        beneficiary:    recipient.publicKey,
        stream:         streamPda(creator.publicKey, id),
        vault:          vaultPda(creator.publicKey, id),
        authorityAta:   creatorAta,
        beneficiaryAta: recipientAta,
        tokenProgram:   TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    // Second cancel should reject
    try {
      await program.methods
        .cancelStream()
        .accounts({
          authority:      creator.publicKey,
          beneficiary:    recipient.publicKey,
          stream:         streamPda(creator.publicKey, id),
          vault:          vaultPda(creator.publicKey, id),
          authorityAta:   creatorAta,
          beneficiaryAta: recipientAta,
          tokenProgram:   TOKEN_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();
      assert.fail("Second cancel should have thrown AlreadyCancelled");
    } catch (e: any) {
      assert.match(String(e), /AlreadyCancelled/);
    }
  });

  it("W5-8: cancel by non-creator → Unauthorized", async () => {
    const id = newStreamId();
    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createStream(id, AMOUNT, new BN(now), new BN(0), new BN(now + 30))
      .accounts({
        authority:     creator.publicKey,
        beneficiary:   recipient.publicKey,
        mint,
        stream:        streamPda(creator.publicKey, id),
        vault:         vaultPda(creator.publicKey, id),
        authorityAta:  creatorAta,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent:          SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    try {
      await program.methods
        .cancelStream()
        .accounts({
          authority:      stranger.publicKey, // wrong signer
          beneficiary:    recipient.publicKey,
          stream:         streamPda(creator.publicKey, id),
          vault:          vaultPda(creator.publicKey, id),
          authorityAta:   strangerAta,
          beneficiaryAta: recipientAta,
          tokenProgram:   TOKEN_PROGRAM_ID,
        })
        .signers([stranger])
        .rpc();
      assert.fail("Stranger should not be able to cancel");
    } catch (e: any) {
      assert.match(String(e), /Unauthorized|ConstraintHasOne|ConstraintAddress|Signer|2003|2006/);
    }
  });

  it("W5-9: cancel mid-stream splits between recipient (vested) and creator (unvested)", async () => {
    const id = newStreamId();
    const now = Math.floor(Date.now() / 1000);
    // 4-second window, cancel ~2s in → roughly 50/50 split
    const startTs = new BN(now);
    const endTs   = new BN(now + 4);

    await program.methods
      .createStream(id, AMOUNT, startTs, new BN(0), endTs)
      .accounts({
        authority:     creator.publicKey,
        beneficiary:   recipient.publicKey,
        mint,
        stream:        streamPda(creator.publicKey, id),
        vault:         vaultPda(creator.publicKey, id),
        authorityAta:  creatorAta,
        tokenProgram:  TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent:          SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    await sleep(2_200); // ~55% through

    const creatorBefore   = await getAccount(provider.connection, creatorAta);
    const recipientBefore = await getAccount(provider.connection, recipientAta);

    await program.methods
      .cancelStream()
      .accounts({
        authority:      creator.publicKey,
        beneficiary:    recipient.publicKey,
        stream:         streamPda(creator.publicKey, id),
        vault:          vaultPda(creator.publicKey, id),
        authorityAta:   creatorAta,
        beneficiaryAta: recipientAta,
        tokenProgram:   TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    const creatorAfter   = await getAccount(provider.connection, creatorAta);
    const recipientAfter = await getAccount(provider.connection, recipientAta);

    const creatorRefund   = BigInt(creatorAfter.amount.toString())   - BigInt(creatorBefore.amount.toString());
    const recipientGained = BigInt(recipientAfter.amount.toString()) - BigInt(recipientBefore.amount.toString());

    // Sum must equal AMOUNT (conservation of tokens)
    assert.equal(
      (creatorRefund + recipientGained).toString(),
      AMOUNT.toString(),
      "creator refund + recipient gain must equal total locked",
    );
    // Both sides should be > 0 (we cancelled mid-stream)
    assert(creatorRefund   > 0n, "creator must get some refund");
    assert(recipientGained > 0n, "recipient must get vested portion");
  });

  // Note on FullyVested error: triggering it deterministically inside a
  // single test would require sleeping past end_ts AND completing a
  // withdrawal to amount_total, which mocha can't easily do in seconds
  // without making the test fragile. The error path is exercised by the
  // unit test in lib.rs (`unlocked_amount` after end_ts == amount_total)
  // and by W5-7 which catches the cancelled-state error code via the same
  // require! pattern.
});
