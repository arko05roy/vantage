# Vantage — Demo Walkthrough & Video Recording Script

**Target Duration**: 3 Minutes (180 Seconds)  
**Hackathon**: Midnight Network WaveHack 2026  
**Project**: Vantage (Zero-Knowledge Microfinance Credit Exposure Verification)

---

## 🎬 Video Recording Plan & Screen-by-Screen Narrative

### Scene 1: The Problem (0:00 – 0:35)
* **Visual**: Show Vantage Header & Hero Screen on `http://localhost:3000` with the RBI NBFC-MFI Regulatory parameters highlighted.
* **Audio Voiceover**:
  > *"In India, over 65 million microfinance borrowers rely on small loans to fund rural livelihoods. Under Reserve Bank of India (RBI) regulations, borrowers cannot exceed ₹1,00,000 in total exposure or borrow from more than 2 microfinance institutions concurrently.*
  >
  > *Today, verifying this requires centralized credit bureaus like CIBIL and CRIF High Mark to collect raw Aadhaar numbers, loan amounts, and repayment schedules in cleartext. This centralizes massive honey pots of low-income citizen financial data and enables predatory cross-selling.*
  >
  > *Meet **Vantage** — a privacy-preserving credit exposure oracle built on Midnight's dual-ledger architecture. Borrowers mathematically prove regulatory compliance in zero-knowledge without revealing their loan amounts, lender identities, or Aadhaar numbers."*

---

### Scene 2: Dual-Ledger Architecture Explainer (0:35 – 1:05)
* **Visual**: Click on the **"Dual-Ledger Architecture"** tab (`DualLedgerExplainer.tsx`).
* **Audio Voiceover**:
  > *"Vantage leverages Midnight's dual-ledger model:
  > 1. **Public On-Chain Ledger**: Stores only 32-byte cryptographic commitments (`loan_commitments`), double-repayment nullifiers (`nullifiers`), and anti-omission accumulator roots (`borrower_portfolios`).
  > 2. **Private Off-Chain Vault**: The borrower's raw loan amounts, secret nonces, and MFI identities remain strictly client-side on their local device.
  > 3. **Compact Smart Contract**: Evaluates private witness constraints in zero knowledge using Compact circuits."*

---

### Scene 3: Loan Disbursement & Commitment (1:05 – 1:40)
* **Visual**: Switch to **"Issuer Portal"** tab (`IssuerView.tsx`).
  - Show Issuer disbursing a loan of **₹40,000** from *Bandhan MFI* to borrower *Priya Sharma*.
  - Click **"Register Loan On-Chain"**.
  - Show the newly published on-chain commitment and the 32-byte secret `loan_nonce` entropy salt.
  - Click **"Copy Nonce"** button (Fix 1).
  - Register a second loan of **₹50,000** from *Fusion Microfinance*.
* **Audio Voiceover**:
  > *"When an MFI disburses a loan, the contract registers an un-linkable cryptographic commitment on Midnight.
  >
  > Under our Wave 1 design, the issuer provides the borrower with their secret 32-byte loan nonce. The borrower binds this nonce into their local vault, making them the sole owner of their financial witness."*

---

### Scene 4: Borrower Vault & Zero-Knowledge Prover (1:40 – 2:20)
* **Visual**: Switch to **"Borrower Vault"** tab (`BorrowerView.tsx`).
  - Show the 2 active loans: Bandhan (₹40,000) and Fusion (₹50,000). Total active exposure = ₹90,000 across 2 lenders.
  - Set limits: **Max 2 Lenders** & **₹1,00,000 Exposure Cap** (RBI defaults).
  - Click **"Generate ZK Compliance Proof"**.
  - Watch the live 4-stage execution animation and Telemetry Card showing Stage 1 WASM ZKIR evaluation (~250ms), Stage 2 Proof Server connectivity, and 27 verified circuit constraints.
  - Demonstrate Anti-Omission: Click the preset **"Exceeds Cap (₹1.15L)"** or **"3 Lenders Cap"** to demonstrate that the Compact circuit mathematically rejects over-lending and catches any attempts to omit loans!
* **Audio Voiceover**:
  > *"In the Borrower Vault, the borrower clicks 'Generate ZK Compliance Proof'. The compiled Compact WebAssembly circuit executes locally in the browser, checking on-chain commitments, folding over the portfolio accumulator to ensure no loans are omitted, and asserting that total exposure is within the ₹1,00,000 cap.
  >
  > The prover outputs a cryptographic proof package without sending any private financial data over the network."*

---

### Scene 5: Verifier Portal & Zero-PII Audit (2:20 – 2:45)
* **Visual**: Switch to **"Verifier Portal"** tab (`VerifierView.tsx`).
  - Click **"Verify Cryptographic Proof"**.
  - Show the **"COMPLIANCE VERIFIED — ELIGIBLE FOR CREDIT"** status badge.
  - Highlight the **Information Disclosure Audit Matrix**:
    - Borrower Aadhaar / Name: `0 Revealed (Private)`
    - Individual Loan Amounts: `0 Revealed (Private)`
    - Lender Identities: `0 Revealed (Private)`
    - Compliance Fact: `Mathematical Truth (Public)`
* **Audio Voiceover**:
  > *"The credit officer or regulator verifies the proof against the Midnight blockchain in milliseconds.
  >
  > As shown in the Information Disclosure Matrix: Zero Aadhaar numbers, Zero loan amounts, and Zero lender identities are disclosed. The lender only learns the mathematical truth: the borrower is fully eligible for credit."*

---

### Scene 6: Conclusion & Wave 2 Roadmap (2:45 – 3:00)
* **Visual**: Return to dashboard overview with preset buttons and GitHub repo link.
* **Audio Voiceover**:
  > *"Vantage demonstrates how Midnight's dual-ledger and Compact smart contracts bring mathematical privacy to real-world financial infrastructure.
  >
  > Thank you — explore the code and full 18-test suite in the repository."*

---

## 📋 Pre-Recording Checklist

- [x] Web server running on `http://localhost:3000` via `npm run dev`.
- [x] Contract compiled with `compactc 0.31.1`.
- [x] All 18 unit & E2E tests passing (`npm test`).
- [x] Browser zoom set to 100%, 1920x1080 resolution.
- [x] Quick-switcher scenario buttons tested and working in Header.
