# Vantage — Privacy-Preserving Credit Exposure Verification on Midnight

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Midnight Network](https://img.shields.io/badge/Midnight-Dual--Ledger-purple.svg)](https://docs.midnight.network/)
[![Compact Version](https://img.shields.io/badge/Compact%20Compiler-0.31.1-green.svg)](https://docs.midnight.network/)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%20LTS-brightgreen.svg)](https://nodejs.org/)

**Vantage** resolves the systemic over-lending challenge in India's microfinance sector (NBFC-MFIs) by enabling borrowers to cryptographically prove compliance with Reserve Bank of India (RBI) exposure limits without revealing their loan amounts, lender identities, or personal financial history.

---

## 📌 Problem & Zero-Knowledge Dual-Ledger Architecture

Under RBI regulations, microfinance borrowers cannot exceed:
1. **Total outstanding exposure cap**: $\le ₹1,00,000$ (or MFI credit policy limit).
2. **Concurrent active lenders cap**: $\le 2$ microfinance institutions.

Existing credit bureaus (CIBIL, CRIF High Mark, Equifax) centralize unencrypted Aadhaar numbers, loan balances, repayment dates, and institution names—exposing low-income borrowers to surveillance and predatory cross-selling.

**Vantage implements a zero-knowledge dual-ledger model on Midnight Network:**
$$\text{active\_loan\_count} \le \text{MAX\_LENDERS} \quad \land \quad \text{total\_exposure} \le \text{REGULATORY\_CAP}$$

* **On-Chain Public State**:
  * `loan_commitments: Set<Bytes<32>>` — Cryptographic Pedersen-like hashes (`persistentHash([borrower_id, lender_id, amount, nonce])`).
  * `nullifiers: Set<Bytes<32>>` — Double-repayment prevention guards.
  * `borrower_portfolios: Map<Bytes<32>, Bytes<32>>` — Anti-omission accumulator hash chain roots.
* **Off-Chain Private Witness**:
  * Raw loan records `{ lender_id, amount, nonce, status }` remain strictly inside the borrower's local browser vault.

---

## 🛠️ Pinned Toolchain & Environment

| Component | Pinned Version | Purpose |
|---|---|---|
| **Compact CLI** (`compact`) | `0.5.2` | CLI tool for toolchain management |
| **Compact Compiler** (`compactc`) | `0.31.1` | ZK circuit & TypeScript code generation |
| **Compact Language Pragma** | `>= 0.20` | Supported language specification |
| **Node.js** | `v22.14.0` (LTS) | Runtime for Midnight JS and Vitest test runner |
| **Compact Runtime** | `@midnight-ntwrk/compact-runtime@0.16.0` | Execution library for off-chain circuits |
| **Frontend Framework** | Next.js 15 App Router | React 19, Tailwind CSS (Emerald Sentinel theme) |

---

## 🚀 Quickstart & Reproduction

### 1. Install Dependencies & Build
```bash
# Clone the repository
git clone https://github.com/your-org/Vantage.git
cd Vantage

# Install all workspace dependencies
npm install

# Run the 18-test unit and circuit test suite
npm test

# Run the automated 7-step multi-party E2E lifecycle test
npm run test:e2e
```

### 2. Launch Development Web App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the Vantage dashboard.

### 3. Deploy Standalone Contract Simulation
```bash
npm run deploy:contracts
```

### 4. Run Midnight Proof Server & Local Node (Docker)
```bash
docker compose up -d
```

---

## ⚡ Proving Pipeline & Telemetry Latency

When the borrower clicks **"Generate ZK Compliance Proof"**, the application executes a two-stage zero-knowledge proving pipeline:

1. **Stage 1 (Client-Side Witness Synthesis & ZKIR Trace)** (~300–450ms):
   * Executed directly in-browser using `@midnight-ntwrk/compact-runtime` WebAssembly.
   * Evaluates all mathematical circuit assertions (`assert`, `persistentHash`, `member`, `isEmpty`, accumulator folding, and exposure inequalities).
   * Generates the Zero-Knowledge Intermediate Representation (ZKIR) byte buffer (`prove_exposure_within_limit.bzkir`) and `publicTranscript`.
2. **Stage 2 (Proving Key SNARK Proof Generation)**:
   * Submits the ZKIR byte buffer and proving key to the local Midnight Proof Server container (`midnightnetwork/proof-server:latest` on port 6300) to produce the final Groth16/Plonk SNARK proof envelope.

---

## 🔒 Security Properties & Anti-Omission Guarantee

1. **Cryptographic Completeness & Anti-Omission**:
   * A malicious borrower cannot hide registered loans to artificially lower their reported exposure.
   * In `register_loan`, Midnight updates `borrower_portfolios[borrower_id]` to `persistentHash([current_root, commitment])`.
   * In `prove_exposure_within_limit`, the circuit strictly enforces `running_root == borrower_portfolios.lookup(borrower_id)`. If any loan is omitted, the hash chain diverges and the proof fails.
2. **Zero-Loan Borrowers**:
   * Borrowers with no prior registered loans match `get_genesis_root()` on-chain and cleanly pass compliance with 0 active loans and ₹0 exposure.
3. **Double-Repayment Prevention via Nullifiers**:
   * When a loan is settled, `close_loan` records `persistentHash([commitment, nonce])` in the on-chain `nullifiers` set, ensuring repaid loans cannot be double-counted or re-nullified.

---

## 🎨 6 Stitch Design Corrections Implemented

Vantage incorporates all 6 mandatory UX/UI design corrections from the Stitch visual audit:
1. **Fix 1: Nonce Output in Issuer View** — Displays 32-byte secret `loan_nonce` entropy salt alongside commitment with a 1-click **"Copy Nonce"** button.
2. **Fix 2: Dedicated Nonce Input in Borrower Vault** — Manual `Loan Nonce (Hex)` input with **"Paste Nonce"** and **"Import Last Issued Loan"** buttons (aligned with PRD §8.1).
3. **Fix 3: Indian Rupee (`₹` INR) Formatting** — Replaced all generic `$` currency symbols with Indian Rupee formatting (`₹35,000`, `₹40,000`, `₹1,00,000`) and Indian number grouping.
4. **Fix 4: RBI Regulatory Defaults** — Default threshold parameters set to **Max 2 Lenders** & **₹1,00,000 Cap**.
5. **Fix 5: Dual-Ledger Interactive Explainer Panel** — 3-column live architectural visualizer comparing Public On-Chain Ledger, Compact ZK Circuits, and Private Off-Chain Vault.
6. **Fix 6: Explicit Status Badges & Repayment Actions** — Shows `ACTIVE` vs `REPAID / CLOSED` badges with a 1-click "Repay & Close Loan" action that executes `close_loan` on-chain.

---

## 📖 Known Wave 1 Limitations & Wave 2 Roadmap

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for full technical details:
* **The `Vector<8, ...>` Witness Cap**: Wave 1 witness uses a fixed-capacity array of 8 elements. In Wave 2, Vantage will transition from a linear hash chain ($O(n)$ witness fold) to a **Sparse Merkle Tree (SMT)** of depth 32 ($O(\log n)$ membership proofs), supporting up to $4.29$ billion lifetime loans per borrower.
* **Automated Encrypted Nonce Transfer**: Wave 2 will replace manual nonce copying with automated off-chain encrypted messaging via DID Comm / libp2p.

---

## ⚖️ Institutional Disclaimer

*Note: MFI institution names used in test scenarios, presets, and demonstrations (Bandhan MFI, Fusion Microfinance, CreditAccess Grameen) are used strictly for illustrative and contextual purposes to reflect real-world Indian microfinance regulations. No commercial partnership, endorsement, or formal institutional affiliation is implied.*

---

## 📄 License
This project is licensed under the [Apache 2.0 License](LICENSE).
