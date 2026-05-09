# BlockBite Token Distribution

Week 3 Anchor setup for the BlockBite token distribution program. This repository also contains the existing Next.js game frontend, but the Week 3 grading focus is the reproducible Anchor program setup.

## Week 3 Status

| Requirement | Status |
| --- | --- |
| Anchor project initialized | Done |
| Program compiles from source | Implemented; verify with `anchor build` |
| Required handlers: `create_stream`, `withdraw`, `cancel` | Done |
| Account structs matching the Week 2 architecture | Done |
| README with setup/build/deploy/test steps | Done |
| At least 1 test | Implemented: `tests/deploy-smoke.js` |
| CI builds and tests on push/PR | Implemented: `.github/workflows/ci.yml` |
| Partner verification | Pending: run the steps below on a fresh clone |

## Prerequisites

Install these tools before running the project:

| Tool | Version |
| --- | --- |
| Node.js | 18+ |
| Rust | stable |
| Solana CLI | 1.18.x |
| Anchor CLI | 0.30.1 |

Useful install references:

- Anchor installation: https://www.anchor-lang.com/docs/installation
- Solana CLI installation: https://docs.anza.xyz/cli/install

Verify the tools:

```bash
node --version
rustc --version
solana --version
anchor --version
```

## Setup From Fresh Clone

```bash
git clone https://github.com/nayrbryanGaming/blockblast.git
cd blockblast

npm install
solana config set --url localhost
solana-keygen new --no-bip39-passphrase
anchor build
anchor keys sync
anchor build
```

The first `anchor build` creates a local program keypair if one does not exist yet. `anchor keys sync` then updates `Anchor.toml` and `declare_id!` to match that generated keypair. The second build verifies the synced program ID.

## Build

```bash
anchor build
```

## Test

```bash
anchor test
```

The current smoke test checks that Anchor generated the IDL and that the required Week 3 instructions exist:

- `create_stream`
- `withdraw`
- `cancel`

## Deploy To Devnet

```bash
solana config set --url devnet
solana airdrop 2
anchor build
anchor keys sync
anchor build
anchor deploy --provider.cluster devnet
```

After deployment, copy the deployed program ID from the deploy output into:

- `Anchor.toml` under `[programs.devnet]`
- `programs/blockbite-vesting/src/lib.rs` in `declare_id!(...)`
- `.env.local` as `NEXT_PUBLIC_VESTING_PROGRAM_ID`, if the frontend needs it

Then rebuild:

```bash
anchor build
```

## CI

GitHub Actions workflow:

```text
.github/workflows/ci.yml
```

The CI pipeline runs on pushes to `main`/`master` and on pull requests. It installs Rust, Solana CLI, Anchor CLI, creates a temporary wallet, creates/syncs the local program keypair, then executes:

```bash
anchor build
anchor test
```

The separate Vercel workflow only handles frontend deployment and is not used as the Week 3 Anchor CI.

## Program Structure

```text
blockblast/
|-- Anchor.toml
|-- Cargo.toml
|-- programs/
|   `-- blockbite-vesting/
|       |-- Cargo.toml
|       `-- src/
|           `-- lib.rs
|-- tests/
|   `-- deploy-smoke.js
`-- .github/
    `-- workflows/
        |-- ci.yml
        `-- vercel.yml
```

## Anchor Program

Required Week 3 handlers:

| Handler | Current behavior |
| --- | --- |
| `create_stream` | Empty handler that compiles and initializes the stream account shape through Anchor constraints |
| `withdraw` | Empty handler that compiles |
| `cancel` | Empty handler that compiles |

Account structs currently defined:

| Account | Purpose |
| --- | --- |
| `StreamAccount` | Stores stream authority, beneficiary, mint, vault, timing, and withdrawal state |
| `BeneficiaryProfile` | Tracks beneficiary-level stream metadata |
| `TreasuryVault` | Tracks protocol vault metadata |
| `ProtocolConfig` | Stores admin/configuration state |
| `WithdrawalRecord` | Stores withdrawal audit data |

Business logic is intentionally minimal for Week 3. Transfers, validation, cancellation rules, vesting math, and SPL token constraints belong in Week 4.

## Frontend

Run the existing Next.js app:

```bash
npm run dev
```

Then open http://localhost:3000.

## Known Notes

- Devnet deployment is not claimed until `anchor deploy --provider.cluster devnet` succeeds and the real program ID is committed.
- Partner verification should be updated only after a teammate confirms they can clone, build, test, and deploy by following this README.
