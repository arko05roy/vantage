# Vantage — Privacy-Preserving Credit Exposure Oracle on Midnight

[![CI](https://github.com/arko05roy/vantage/actions/workflows/ci.yml/badge.svg)](https://github.com/arko05roy/vantage/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black.svg?logo=vercel)](https://vantage-midnightwrk.vercel.app/)
[![Midnight Network](https://img.shields.io/badge/Midnight-Dual--Ledger-purple.svg)](https://docs.midnight.network/)
[![Compact Version](https://img.shields.io/badge/Compact%20Compiler-0.31.1-green.svg)](https://docs.midnight.network/)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%20LTS-brightgreen.svg)](https://nodejs.org/)
[![YouTube Demo](https://img.shields.io/badge/Demo%20Video-YouTube-red.svg?logo=youtube)](https://www.youtube.com/watch?v=fjpweqd8ntU)
[![Presentation Deck](https://img.shields.io/badge/Slide%20Deck-Google%20Slides-orange.svg?logo=googleslides)](https://docs.google.com/presentation/d/1FWppOp8hFJ8qjXGI31EL0wIbHy5VHDlIs0LvuDmvWDc/edit?usp=sharing)

**Vantage** is an on-chain zero-knowledge regulatory oracle built on Midnight Network that enables microfinance borrowers to prove compliance with statutory exposure limits without disclosing their loan balances, lender identities, or personal identifiable information (PII).

---

## 📺 Project Resources & Live Demo

* 🌐 **Live Web Application**: [https://vantage-midnightwrk.vercel.app/](https://vantage-midnightwrk.vercel.app/)
* 🎥 **Video Demo Walkthrough**: [Watch on YouTube](https://www.youtube.com/watch?v=fjpweqd8ntU)
* 📊 **Presentation Slide Deck**: [View on Google Slides](https://docs.google.com/presentation/d/1FWppOp8hFJ8qjXGI31EL0wIbHy5VHDlIs0LvuDmvWDc/edit?usp=sharing)

---

## 🌐 | Contract | Address | Transaction / block |
|----------|---------|---------------------|
| **Exposure Proof** (`exposure.compact`) | [`b3b8f32f51d28ca2265e29da8be2d08cd5c20ae4152adfdd452bdee9fc6242e3`](https://preprod.midnightexplorer.com/contracts/0xb3b8f32f51d28ca2265e29da8be2d08cd5c20ae4152adfdd452bdee9fc6242e3) | `c5a9d20d3719b1cfb1ee471999c47c382d370cbe860b0a99bac9a641495d6bbd` / `1784908` |




---

## 📌 Problem & Zero-Knowledge Architecture

In microfinance lending (NBFC-MFIs), regulatory guidelines (such as Reserve Bank of India directives) mandate strict limits on borrower exposure:
* **Concurrent Lender Cap**: Maximum of **2 active lending institutions**.
* **Total Exposure Cap**: Maximum outstanding indebtedness of **₹1,00,000 INR**.

Traditional credit bureaus require centralizing raw borrower identities (Aadhaar numbers), loan balances, and payment schedules in unencrypted databases. This exposes low-income borrowers to surveillance, aggressive cross-selling, and data breaches.

```
                  VANTAGE DUAL-LEDGER ARCHITECTURE
                  
  +-----------------------------------------------------------------+
  |                  PUBLIC ON-CHAIN LEDGER (Midnight)              |
  |                                                                 |
  |  • loan_commitments: Set<Bytes<32>>   (Pedersen commitments)    |
  |  • nullifiers: Set<Bytes<32>>         (Repayment double-spend)  |
  |  • borrower_portfolios: Map<Bytes<32>, Bytes<32>> (Accumulator) |
  +--------------------------------+--------------------------------+
                                   |
                     ZK Proof & On-Chain Audit
                                   |
  +--------------------------------+--------------------------------+
  |              PRIVATE OFF-CHAIN VAULT (Client Browser)           |
  |                                                                 |
  |  • borrower_id: Bytes<32>                                       |
  |  • loans: Vector<8, PrivateLoanRecord>                          |
  |    { lender_id, amount, nonce, status }                         |
  +-----------------------------------------------------------------+
```

### Core Invariant
The borrower proves in zero-knowledge:
```
active_lenders_count ≤ 2  AND  total_active_exposure ≤ ₹1,00,000
```
While guaranteeing **zero disclosure** of individual loan amounts or institutional lenders.

---

## 🛠️ Pinned Toolchain

| Component | Version | Purpose |
|---|---|---|
| **Compact Compiler** (`compactc`) | `0.31.1` | ZK circuit & contract compilation |
| **Compact CLI** (`compact`) | `0.5.2` | Toolchain environment management |
| **Node.js** | `v22.14.0` (LTS) | Execution runtime & test runner |
| **Compact Runtime** | `@midnight-ntwrk/compact-runtime@0.16.0` | Off-chain circuit evaluation library |
| **Frontend** | Next.js 15 App Router | React 19, Tailwind CSS |

---

## 🔐 Privacy Model — What an Observer Can and Cannot Learn

Vantage uses Midnight's dual-ledger model: the public ledger stores only
cryptographic artifacts (commitments, nullifiers, accumulator roots), while all
sensitive inputs live exclusively in the borrower's client-side private vault
and are consumed as ZK witnesses.

| Data | Observer on-chain / verifier CAN learn | Observer CANNOT learn |
|---|---|---|
| **Regulatory eligibility** | `active_lenders ≤ 2` and `total_exposure ≤ ₹1,00,000` — proven and publicly verifiable | — |
| **Borrower identity** | Only `borrower_id` (a 32-byte pseudonymous identifier) | Name, Aadhaar, or any PII |
| **Loan amounts** | Nothing | Individual amounts and the exact total (only that it is ≤ cap) |
| **Lender identities** | Nothing | Which institutions hold the loans, or how many distinct names map to commitments |
| **Loan lifecycle** | That *some* commitment was created/closed (set membership events) | Which borrower/lender/amount a commitment encodes |
| **Portfolio completeness** | The accumulator root match proves no registered loan was omitted | The contents folded into that root |

**Observable privacy behavior in the dApp:** the Issuer tab's on-chain feed
shows only `persistentHash` commitments and nullifiers; the Verifier tab
receives a proof result containing *only* the compliance boolean and public
transcript — the borrower's loan records never leave the browser's private
state. A lender or regulator watching the chain sees hash sets and roots, never
amounts or identities.

---

## 🔒 Cryptographic Soundness & Guarantees

1. **Anti-Omission Portfolio Accumulator**:
   * When an institution registers a loan, Midnight updates `borrower_portfolios[borrower_id]` using a cryptographic hash chain: `persistentHash([current_root, commitment])`.
   * When proving exposure, the circuit folds over the borrower's witness and strictly asserts `running_root == borrower_portfolios.lookup(borrower_id)`.
   * A borrower **cannot omit or hide** a loan to artificially lower their reported exposure.
2. **Zero-Loan Borrowers**:
   * Borrowers with no prior registered loans match `get_genesis_root()` on-chain and pass verification with 0 active loans and ₹0 exposure.
3. **Double-Spend & Repayment Nullifiers**:
   * When a loan is repaid, the institution registers a nullifier `persistentHash([commitment, nonce])` in the public `nullifiers` set.
   * Settled loans are excluded from active exposure calculations while preserving the integrity of the portfolio accumulator hash chain.
4. **Information Disclosure Audit**:
   * Borrower Aadhaar / Identity: **0 Revealed (Private)**
   * Individual Loan Amounts: **0 Revealed (Private)**
   * Lender Identities & Locations: **0 Revealed (Private)**
   * Regulatory Eligibility: **Cryptographic Verification (Public)**

---

## ⚡ Proving Pipeline & Telemetry

When generating a compliance proof, Vantage executes a two-stage proving pipeline:

1. **Stage 1 (Client-Side WASM ZKIR Evaluation)** (~150–350ms):
   * Executed locally in-browser via `@midnight-ntwrk/compact-runtime` WebAssembly.
   * Evaluates all mathematical circuit assertions, accumulator folding, and inequality constraints.
   * Synthesizes the Zero-Knowledge Intermediate Representation (ZKIR) trace and `publicTranscript`.
2. **Stage 2 (Proof Server SNARK Envelope Generation)**:
   * Submits the ZKIR byte buffer to the local/remote Midnight Proof Server container (`http://localhost:6300/prove` via `docker-compose.yml`) to produce the final Groth16/Plonk zero-knowledge SNARK proof artifact.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
* Node.js 22 LTS (run `nvm use` to load `.nvmrc`)
* Docker & Docker Compose (optional, for local proof server)

### 2. Install & Run Tests
```bash
# Clone the repository
git clone https://github.com/arko05roy/vantage.git
cd vantage

# Install workspace dependencies
npm install

# Run the 18-test unit and circuit test suite
npm test

# Run the automated 7-step multi-party E2E lifecycle test
npm run test:e2e
```

### 3. Launch Web Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser, or test the production deployment directly at [https://vantage-midnightwrk.vercel.app/](https://vantage-midnightwrk.vercel.app/).

### 4. Deploy Standalone Contract Simulation
```bash
npm run deploy:contracts
```

### 5. Run Local Proof Server & Node (Docker)
```bash
docker compose up -d
```

---

## 🧪 Test Matrix Summary (18/18 Passing)

```
Test Files  2 passed (2)
Tests       18 passed (18)
```

* **Pure Circuits**: Deterministic commitment generation, nullifier derivation, and portfolio accumulator folding.
* **Issuer Circuit**: Loan commitment registration, non-positive amount rejection, and portfolio root updates.
* **Borrower Exposure Proofs**:
  * Pass: Active exposure strictly below limit (₹30,000 vs ₹1,00,000 cap).
  * Pass: Exact boundary condition (2 loans totaling ₹1,00,000).
  * Fail: Exposure exceeds cap (₹1,10,000 vs ₹1,00,000 cap).
  * Fail: Lender count exceeds limit (3 active lenders vs 2 cap).
  * Fail: Malicious loan omission (hash chain divergence).
  * Fail: Uncommitted fake loan injection.
  * Fail: Falsified loan status modification.
  * Pass: Zero-loan borrower (empty portfolio matching genesis root).
* **Multi-Party 7-Step E2E Lifecycle**: Full simulation from Genesis initialization → Disbursement 1 → Disbursement 2 → Compliant ZK Proving → Verifier Audit → Over-Lending Rejection → Repayment & Nullifier Recovery → Compliant Re-Proving.

---

## ⚖️ Disclaimer

*Institution names used in test scenarios and demonstrations (e.g., Bandhan MFI, Fusion Microfinance, CreditAccess Grameen) are referenced strictly for illustrative purposes to contextualize microfinance regulations. No formal partnership, commercial endorsement, or institutional affiliation is implied.*

---

## 📄 License

This project is licensed under the [Apache 2.0 License](LICENSE).
