# Deployment Guide — BLOCKBITE TDP

Step-by-step instructions to build, test, and deploy the vesting smart contract to Solana devnet.

**Program ID:** `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`

---

## Prerequisites

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup component add rust-src
rustup target add sbpf-solana-solana  # SBPF target for Solana BPF
```

Verify: `rustc --version`

### 2. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"
```

Add to PATH (follow installer instructions), then verify: `solana --version`

### 3. Install Anchor CLI

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.32.1
avm use 0.32.1
```

Verify: `anchor --version` (should show 0.32.1)

### 4. Install Node.js dependencies

```bash
npm install   # or yarn install
```

---

## Step 1: Configure Solana for Devnet

```bash
solana config set --url devnet
solana config get   # verify URL shows devnet
```

### Create or use existing keypair

```bash
# Create new keypair (skip if you have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Check your pubkey
solana address

# Check balance
solana balance
```

### Fund with devnet SOL (airdrop)

```bash
solana airdrop 2
solana airdrop 2   # run twice — 2 SOL max per request
solana balance     # should show ~4 SOL
```

If airdrop fails (rate limited), use the faucet at https://faucet.solana.com

---

## Step 2: Build the Program

```bash
anchor build
```

This:
- Compiles `programs/blockbite-vesting/src/lib.rs` to `target/deploy/blockbite_vesting.so`
- Generates IDL at `target/idl/blockbite_vesting.json`
- Generates TypeScript types at `target/types/blockbite_vesting.ts`

Expected output: `Build successful. target/deploy/blockbite_vesting.so exists`

If build fails with `sbpf target not found`:
```bash
rustup target add sbpf-solana-solana
```

---

## Step 3: Run Tests on Localnet

```bash
anchor test
```

This:
1. Starts a local Solana validator
2. Deploys the program to localnet
3. Runs all 30+ tests in `tests/vesting.ts`
4. Shuts down the validator

All tests should pass (green). If any fail, do NOT deploy to devnet.

To run specific tests:
```bash
anchor test --grep "W5.6"   # runs only the W5.6 test
```

---

## Step 4: Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

This uploads `target/deploy/blockbite_vesting.so` to devnet.
The program ID in `Anchor.toml` and `lib.rs` must match: `DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`

Expected output:
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: <your-wallet-pubkey>
Deploying program "blockbite_vesting"...
Program Id: DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf
Deploy success
```

**Save the deploy transaction signature** — needed for the PR.

---

## Step 5: Upload IDL to Devnet

```bash
anchor idl init \
  --filepath target/idl/blockbite_vesting.json \
  DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf \
  --provider.cluster devnet
```

This writes the IDL on-chain so frontends and tools can discover the program interface.

---

## Step 6: Verify Deployment

### Check program exists
```bash
solana program show DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf --url devnet
```

### Fetch IDL
```bash
anchor idl fetch DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf --provider.cluster devnet
```

### View on Explorer
https://explorer.solana.com/address/DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf?cluster=devnet

---

## Step 7: Run Integration Test on Devnet (Optional)

Create a minimal test script `scripts/smoke-test-devnet.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function main() {
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
  const info = await connection.getAccountInfo(
    new PublicKey("DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf")
  );
  console.log("Program exists:", info !== null);
  console.log("Executable:", info?.executable);
}

main().catch(console.error);
```

Run:
```bash
npx ts-node scripts/smoke-test-devnet.ts
```

Expected: `Program exists: true` and `Executable: true`

---

## Troubleshooting

### `Error: insufficient funds for rent`
Your wallet doesn't have enough SOL. Run `solana airdrop 2` again or use https://faucet.solana.com

### `Error: program id does not match`
The declared program ID in `lib.rs` and `Anchor.toml` must match exactly:
`DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf`

### `anchor build` fails with sbpf error
```bash
rustup target add sbpf-solana-solana
rustup update
```

### `anchor test` hangs
Kill the local validator if it's still running:
```bash
pkill -f solana-test-validator
```
Then re-run `anchor test`.

### IDL upload fails
The IDL account may already exist. Use `anchor idl upgrade` instead of `anchor idl init`:
```bash
anchor idl upgrade \
  --filepath target/idl/blockbite_vesting.json \
  DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf \
  --provider.cluster devnet
```

---

## Environment Variables (Frontend)

After deploy, set in Vercel dashboard or `.env.local`:

```
NEXT_PUBLIC_VESTING_PROGRAM_ID=DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

---

## Deploy History

| Date | Version | Deploy Tx | Notes |
|---|---|---|---|
| W4 (prior) | create/withdraw/fund_vault/update_proof | `3q6KHe...XiM` | Initial deploy |
| W5 (pending) | + cancel/milestone/cliff | TBD | Needs redeployment |
