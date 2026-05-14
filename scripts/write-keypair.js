// Converts base58 private key → Solana JSON keypair file
const bs58 = require('../node_modules/bs58');
const fs   = require('fs');
const path = require('path');

const B58_KEY = '4pJNqbTrNXxquFE8RnBFE2coYLLsKaBCtVpJTW2uFkuengxsdRqrCzx17uZ5EKWKWCT726C6wsTQq5jihMu6UfGv';

const dec   = bs58.default ?? bs58;
const bytes = dec.decode(B58_KEY);
const arr   = Array.from(bytes);

const outPath = path.join(process.env.USERPROFILE || 'C:\\Users\\arche', 'deploy-key.json');
fs.writeFileSync(outPath, JSON.stringify(arr));
console.log('Written to:', outPath);
console.log('Length:', arr.length, '(expect 64)');
console.log('Public key bytes (last 32):', arr.slice(32).join(','));
