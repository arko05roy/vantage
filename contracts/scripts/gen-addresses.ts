/**
 * Vantage — Midnight preprod test-address generator.
 * Derives N unshielded preprod addresses (mn_addr_preprod1…) from freshly
 * generated random HD seeds. Fully offline — no indexer or node calls.
 *
 * Outputs:
 *   PREPROD-ADDRESSES.md                      – public address list (repo root)
 *   contracts/preprod-addresses.secrets.json  – address → seed map (gitignored)
 *
 * Usage:  npm run gen:addresses          (default COUNT=50)
 *         COUNT=100 npm run gen:addresses
 */
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { HDWallet, Roles, createKeystore } from '@midnightntwrk/wallet-sdk';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

const count = Number(process.env.COUNT ?? '50');
if (!Number.isInteger(count) || count <= 0) {
  throw new Error('COUNT must be a positive integer');
}

setNetworkId('preprod');

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const contractsDir = path.resolve(scriptsDir, '..');
const repoRoot = path.resolve(contractsDir, '..');
const markdownPath = path.join(repoRoot, 'PREPROD-ADDRESSES.md');
const secretsPath = path.join(contractsDir, 'preprod-addresses.secrets.json');

const rows: Array<{ index: number; address: string }> = [];
const secrets: Array<{ index: number; address: string; seed: string }> = [];

for (let i = 0; i < count; i++) {
  const seed = randomBytes(32);
  const hdWallet = HDWallet.fromSeed(seed);
  if (hdWallet.type !== 'seedOk') throw new Error(`HD restore failed at index ${i}`);
  const derivation = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.NightExternal])
    .deriveKeysAt(0);
  if (derivation.type !== 'keysDerived') {
    throw new Error(`Key derivation failed at index ${i}`);
  }
  hdWallet.hdWallet.clear();

  const address = String(
    createKeystore(derivation.keys[Roles.NightExternal], getNetworkId()).getBech32Address(),
  );
  rows.push({ index: i + 1, address });
  secrets.push({ index: i + 1, address, seed: seed.toString('hex') });
}

const table = rows.map((r) => `| ${r.index} | \`${r.address}\` |`).join('\n');
const markdown = `# Midnight Preprod Test Addresses

${count} unshielded Midnight **preprod** addresses (\`mn_addr_preprod1…\`), generated
by [\`contracts/scripts/gen-addresses.ts\`](contracts/scripts/gen-addresses.ts).

- **Network**: \`preprod\`
- **Type**: unshielded (NIGHT/tNIGHT) Bech32 addresses, HD account 0 / index 0
- **Seeds**: \`contracts/preprod-addresses.secrets.json\` (gitignored, mode 0600)
- **Regenerate**: \`npm run gen:addresses\` (or \`COUNT=100 npm run gen:addresses\`)
- **Generated**: ${new Date().toISOString()}

| # | Address |
|---|---------|
${table}
`;

await writeFile(markdownPath, markdown);
await writeFile(secretsPath, JSON.stringify(secrets, null, 2) + '\n', { mode: 0o600 });

console.log(`Generated ${count} preprod addresses`);
console.log(`  Addresses → ${path.relative(repoRoot, markdownPath)}`);
console.log(`  Seeds     → ${path.relative(repoRoot, secretsPath)} (gitignored)`);
