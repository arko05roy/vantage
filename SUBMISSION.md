# Vantage — Midnight Network WaveHack 2026 Submission

**Track**: Privacy-Preserving Applications / Real-World Zero-Knowledge Oracles  
**Repository**: [https://github.com/your-org/Vantage](https://github.com/your-org/Vantage)  
**Smart Contract Language**: Compact v0.31.1 (`@midnight-ntwrk/compact-runtime` v0.16.0)  
**Frontend**: Next.js 15 App Router (TypeScript, Tailwind CSS — Stitch *Emerald Sentinel* theme)

---

## 💡 Project Inspiration & The Real-World Crisis

In India's ₹4.5 Lakh Crore ($54B) microfinance sector, over **65 million low-income women borrowers** rely on joint-liability loans for agriculture, livestock, and small enterprises. 

To prevent predatory lending and debt traps, the **Reserve Bank of India (RBI)** mandates strict microfinance credit guidelines:
1. **Total outstanding exposure cap**: Maximum **₹1,00,000 INR** across all lenders.
2. **Concurrent lender limit**: Maximum **2 active microfinance institutions (NBFC-MFIs)**.

### The Privacy Problem
Today, verifying compliance requires centralizing raw Aadhaar numbers, loan balances, repayment dates, and institution names across credit bureaus like CIBIL and CRIF High Mark. This creates centralized honey pots of sensitive citizen financial data, enabling predatory cross-selling, borrower poaching, and surveillance.

### The Vantage Solution
**Vantage** is an on-chain zero-knowledge regulatory oracle that enables borrowers to mathematically prove compliance with RBI exposure limits **without disclosing a single rupee of loan balances, institution names, or Aadhaar credentials**.

$$\text{active\_loan\_count} \le 2 \quad \land \quad \sum \text{active\_loans} \le ₹1,00,000$$

---

## 🏗️ Technical Architecture & Midnight Dual-Ledger Implementation

Vantage partitions state cleanly across Midnight's dual-ledger paradigm:

### 1. Public On-Chain Ledger (`contracts/src/exposure-proof.compact`)
* `loan_commitments: Set<Bytes<32>>` — 32-byte cryptographic commitments computed via `persistentHash([borrower_id, lender_id, amount, nonce])`.
* `nullifiers: Set<Bytes<32>>` — Double-repayment prevention nullifiers computed via `persistentHash([commitment, nonce])`.
* `borrower_portfolios: Map<Bytes<32>, Bytes<32>>` — Anti-omission accumulator hash chain roots ensuring borrowers cannot omit loans from their private witness.

### 2. Private Off-Chain Vault (Browser Client)
* Stores raw loan records `{ lender_id, amount, nonce, status }` strictly inside the borrower's local browser memory (`localStorage` / encrypted indexedDB).
* Disbursing MFIs transmit the 32-byte secret `loan_nonce` entropy salt to the borrower upon loan approval.

### 3. Compact Smart Contract Circuits
* `register_loan`: Registers new commitments and updates the borrower portfolio root hash chain.
* `close_loan`: Publishes nullifier on-chain and marks loan settled.
* `prove_exposure_within_limit`: Executes zero-knowledge inequality and anti-omission assertions over the borrower's private witness vector.

---

## 🔒 Cryptographic Soundness & Security Properties

1. **Anti-Omission Guarantee**:
   In `register_loan`, Midnight updates `borrower_portfolios[borrower_id]` to `persistentHash([current_root, commitment])`. In `prove_exposure_within_limit`, the circuit strictly verifies `running_root == on_chain_root`. If a borrower attempts to hide an active loan to appear under the limit, the hash chain diverges and proof generation fails immediately.
2. **Zero-Loan Borrowers**:
   Borrowers with no prior registered loans match `get_genesis_root()` on-chain and pass compliance with 0 active loans and ₹0 exposure.
3. **Double-Spend & Repayment Nullifiers**:
   Repaid loans are nullified on-chain, allowing borrowers to borrow again while retaining their historical portfolio root consistency.
4. **Zero PII Disclosure**:
   Credit officers and regulators verify compliance with 0 bytes of financial or identity PII leaked.

---

## 🧪 Comprehensive Verification & Test Suite

The test suite covers 18 automated tests in Vitest:
```bash
# Run all 18 contract and E2E lifecycle tests
npm test

# Run multi-party 7-step E2E lifecycle test
npm run test:e2e
```

### Test Matrix Breakdown (18/18 Passing):
* **Pure Circuits**: Deterministic commitment hashing, nullifier derivation, genesis root generation, and portfolio hash chain folding.
* **Issuer Circuit**: Loan registration, non-positive amount rejection, duplicate prevention, and portfolio root updates.
* **Borrower Compliance Prover**:
  * ✅ Compliant borrower (₹30k $\le$ ₹100k cap).
  * 🎯 Exact boundary borrower (2 loans totaling ₹1,00,000 $\le$ 2 lenders & ₹100k cap).
  * ❌ Amount exceeded rejection (₹1,10,000 $>$ ₹100k cap).
  * ❌ Lender count exceeded rejection (3 active lenders $>$ 2 cap).
  * 🔒 Anti-omission rejection (borrower attempting to omit a registered loan).
  * 🔒 Uncommitted fake loan rejection.
  * 🔒 Falsified `CLOSED` status rejection.
  * 🌟 Zero-loan borrower pass (empty portfolio matches genesis root).
* **Multi-Party 7-Step E2E Lifecycle**: Full simulation from Genesis $\rightarrow$ Bandhan Loan 1 $\rightarrow$ Fusion Loan 2 $\rightarrow$ Compliant ZK Proving $\rightarrow$ Verifier Audit $\rightarrow$ CreditAccess Loan 3 Over-lending Rejection $\rightarrow$ Bandhan Loan Repayment & Nullifier Recovery $\rightarrow$ Compliant Re-Proving.

---

## 🚀 Quickstart & Reproduction Guide

### Prerequisites
* Node.js 22 LTS (`.nvmrc` pinned)
* Compact Compiler `0.31.1` (`compactc`)
* Compact Runtime `@midnight-ntwrk/compact-runtime@0.16.0`

### Step 1: Install & Build
```bash
git clone https://github.com/your-org/Vantage.git
cd Vantage
npm install
npm run build
```

### Step 2: Run Web Application
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### Step 3: Run Docker Local Test Harness
```bash
docker compose up -d
```

---

## 🎨 6 Stitch UI Design Fixes Implemented

1. **Fix 1 (Issuer View)**: 32-byte secret `loan_nonce` output with 1-click "Copy Nonce" button.
2. **Fix 2 (Borrower View)**: Dedicated `Loan Nonce (Hex)` input field with "Paste Nonce" and "Import Last Issued Loan" actions.
3. **Fix 3 (Currency Standardization)**: Pinned Indian Rupee (`₹` INR) formatting across all screens.
4. **Fix 4 (Regulatory Limit Defaults)**: Aligned to RBI norms (Max 2 Lenders & ₹1,00,000 Exposure Cap).
5. **Fix 5 (Dual-Ledger Interactive Explainer)**: 3-column live visualizer comparing Public On-Chain Ledger, Compact ZK Circuits, and Private Off-Chain Vault.
6. **Fix 6 (Explicit Status Badges & Repayment Actions)**: Visual `ACTIVE` vs `REPAID / CLOSED` badges with on-chain `close_loan` nullifier execution.

---

## ⚖️ Institutional Disclaimer
*Institution names used in test scenarios and demonstrations (e.g., Bandhan MFI, Fusion Microfinance, CreditAccess Grameen) are referenced strictly for illustrative purposes to contextualize real-world Indian microfinance regulations. No formal partnership, commercial endorsement, or institutional affiliation is implied.*

---

## 📄 License
Licensed under the [Apache 2.0 License](LICENSE).
