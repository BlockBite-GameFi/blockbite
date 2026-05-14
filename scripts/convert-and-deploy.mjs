import bs58 from 'bs58';
import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir, homedir } from 'os';
import { join } from 'path';

const SOLANA = join(homedir(), '.local/share/solana/install/active_release/bin/solana');

const PRIVATE_KEY_B58 = '4pJNqbTrNXxquFE8RnBFE2coYLLsKaBCtVpJTW2uFkuengxsdRqrCzx17uZ5EKWKWCT726C6wsTQq5jihMu6UfGv';
const PROGRAM_SO = 'programs\\blockbite-vesting\\target\\deploy\\blockbite_vesting.so';

const keypairPath = join(tmpdir(), 'deploy-keypair.json');

try {
  // Decode base58 -> 64-byte buffer -> JSON array
  const decoded = bs58.decode(PRIVATE_KEY_B58);
  writeFileSync(keypairPath, JSON.stringify(Array.from(decoded)));
  console.log('Keypair written to temp path.');

  // Set cluster to devnet
  execSync(`"${SOLANA}" config set --url devnet`, { stdio: 'inherit' });

  // Check balance
  const balance = execSync(`"${SOLANA}" balance --keypair "${keypairPath}"`, { encoding: 'utf8' }).trim();
  console.log('Balance:', balance);

  // Airdrop if needed (2 SOL) — skip if rate limited
  console.log('Requesting airdrop (optional)...');
  try {
    execSync(`"${SOLANA}" airdrop 2 --keypair "${keypairPath}" --url devnet`, { stdio: 'inherit' });
  } catch {
    console.log('Airdrop rate-limited or failed — continuing with existing balance.');
  }

  // Deploy program
  console.log('Deploying program...');
  execSync(
    `"${SOLANA}" program deploy "${PROGRAM_SO}" --keypair "${keypairPath}" --url devnet`,
    { stdio: 'inherit', cwd: 'e:/000VSCODE PROJECT MULAI DARI DESEMBER 2025/blockblast' }
  );
} finally {
  // Always remove the temp keypair file
  try { unlinkSync(keypairPath); } catch {}
  console.log('Temp keypair removed.');
}
