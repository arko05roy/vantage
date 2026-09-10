# Vantage: 5-Minute Judge Evaluation Guide & Runbook

**Track**: Midnight Network WaveHack 2026  
**Project**: Vantage (Zero-Knowledge Microfinance Exposure Proof System)  
**Target Evaluation Time**: 5 minutes

---

## ⚡ Quick 1-Minute Automated Verification

To immediately verify that the entire cryptographic core and end-to-end integration pass with 100% test coverage:

```bash
# Clone the repository
git clone https://github.com/your-org/Vantage.git
cd Vantage

# Install dependencies (workspaces: contracts & frontend)
npm install

# Run the 18-test Vitest suite (17 contract unit tests + 1 full E2E lifecycle test)
npm test

# Run the standalone deployment script
npm run deploy:contracts
```

Expected Output:
```
✓ tests/e2e-scenario.test.ts (1 test)
✓ tests/exposure-proof.test.ts (17 tests)
Test Files  2 passed (2)
Tests       18 passed (18)
```

---

## 🖥️ Live Web Application Walkthrough

### 1. Launch the Frontend
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 2. Fast Evaluation via Header Scenario Presets

At the top of the Vantage dashboard, use the preset quick-switcher buttons to test all major regulatory scenarios in seconds:

#### **Preset 1: ✅ Compliant (2 Loans)**
1. Click **`✅ Compliant (2 Loans)`** in the header.
2. Observe the Borrower Vault:
   * Loan 1: Bandhan MFI (₹40,000, ACTIVE)
   * Loan 2: Fusion Microfinance (₹50,000, ACTIVE)
   * Total Exposure: ₹90,000 across 2 institutions.
3. Click **"Generate ZK Compliance Proof"**.
4. In ~300ms, the Compact circuit evaluates the private witness, reconstructs the portfolio hash chain, and synthesizes the ZK proof package.
5. Click **"Submit to Verifier"** (or switch to the Verifier tab).
6. Click **"Verify Cryptographic Proof"**.
7. **Result**: `COMPLIANCE VERIFIED` — Zero PII disclosed!

---

#### **Preset 2: ❌ Exceeds Cap (₹1.15L)**
1. Click **`❌ Exceeds Cap (₹1.15L)`** in the header.
2. Observe: Bandhan (₹60k) + Fusion (₹55k) = ₹1,15,000 ($> ₹1,00,000$ limit).
3. Click **"Generate ZK Compliance Proof"**.
4. **Result**: **REJECTED** with exact Compact circuit error:  
   `"Total active exposure exceeds regulatory limit"`.

---

#### **Preset 3: ❌ 3 Lenders Cap**
1. Click **`❌ 3 Lenders Cap`** in the header.
2. Observe: 3 microloans from 3 different MFIs (Bandhan ₹25k, Fusion ₹25k, CreditAccess ₹25k).
3. Click **"Generate ZK Compliance Proof"**.
4. **Result**: **REJECTED** with Compact circuit error:  
   `"Active loan count exceeds allowed limit"`.

---

#### **Preset 4: 🔄 Repay & Restore Compliance (Nullifier Lifecycle)**
1. Load **`❌ Exceeds Cap (₹1.15L)`**.
2. On Loan 1 (Bandhan MFI, ₹60,000), click **"Repay & Close"**.
3. Notice:
   * Loan status updates to `REPAID / CLOSED`.
   * Active exposure drops to ₹55,000 across 1 active lender.
   * On-chain nullifier is published to prevent replay.
4. Click **"Generate ZK Compliance Proof"**.
5. **Result**: **PASSES!** Proof is synthesized and verified successfully.

---

### 3. Manual Step-by-Step Role Walkthrough

If you wish to test the full lifecycle manually from scratch:

1. **Reset**: Click **"Reset All"** in the header.
2. **Issuer Tab**:
   * Select **Lender**: "Bandhan MFI", **Amount**: ₹40,000.
   * Click **"Register Loan Commitment on Midnight"**.
   * Note the generated 32-byte on-chain commitment and the secret `Loan Nonce`.
   * Click **"Copy Nonce"**.
3. **Borrower Tab**:
   * In the manual loan entry card, click **"Import Last Issued Loan"** (or paste the copied nonce).
   * Click **"Add Loan to Private Witness"**.
   * Register a second loan: Fusion Microfinance, ₹50,000.
   * Click **"Generate ZK Compliance Proof"**.
4. **Verifier Tab**:
   * Click **"Verify Cryptographic Proof"**.
   * Confirm compliance and inspect the **Information Disclosure Audit** matrix.
5. **Dual-Ledger Tab**:
   * Explore the interactive 3-column architecture diagram showing Public On-Chain Ledger vs Compact Circuits vs Private Vault.

---

## 🔒 Verification of Cryptographic Security Invariants

| Security Property | Test Location | Assertion Verified |
|---|---|---|
| **Anti-Omission** | `contracts/tests/exposure-proof.test.ts` (Test 15) & `e2e-scenario.test.ts` | Reject omitted active loans from witness |
| **Exact Boundaries** | `contracts/tests/exposure-proof.test.ts` (Test 5) | Exact boundary pass ($\le 2$ loans, $\le ₹100,000$) |
| **Zero Loans** | `contracts/tests/exposure-proof.test.ts` (Test 8) | Genesis root validation with 0 exposure |
| **Nullifier Protection** | `contracts/tests/exposure-proof.test.ts` (Test 12) | Closed loans omitted from active exposure |
| **Commitment Authenticity** | `contracts/tests/exposure-proof.test.ts` (Test 14) | Unregistered fake commitments rejected |
