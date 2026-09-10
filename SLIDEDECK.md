# Vantage: Pitch Deck & Presentation

**Zero-Knowledge Credit Exposure Verification for Indian Microfinance on Midnight Network**  
*Midnight Network WaveHack 2026 Submission*

---

## Slide 1: Title & Vision
### **VANTAGE**
### *Eliminating Over-Lending in Indian Microfinance Without Compromising Borrower Privacy*

* **Track**: Midnight Network WaveHack 2026
* **Category**: Privacy-Preserving DeFi / Real-World Regulatory Compliance (RegTech)
* **Core Technology**: Midnight Dual-Ledger, Compact Smart Contracts (v0.31.1), Zero-Knowledge Proofs

---

## Slide 2: The Ground Reality of Indian Microfinance (NBFC-MFIs)
### **The Over-Lending Crisis & Privacy Paradox**

* **Market Scale**: Over **66 million low-income women borrowers** across India with an outstanding microfinance portfolio exceeding **₹4.0 lakh crore ($48B USD)**.
* **The Regulatory Mandate (RBI Directives)**:
  * Maximum **2 active microfinance lenders** per borrower.
  * Maximum **₹1,00,000 total credit exposure** across all institutions.
* **The Broken Current Solution**:
  * Centralized Credit Bureaus (CIBIL, Equifax, CRIF High Mark).
  * Require unencrypted Aadhaar numbers, loan balances, repayment dates, and institution names.
* **The Consequences**:
  * **Surveillance & Data Breaches**: Vulnerable rural borrowers targeted by predatory lenders.
  * **Credit Rejection / Ghosting**: Lack of real-time visibility leads to systemic over-indebtedness and default spirals.

---

## Slide 3: Why Traditional Blockchains Fail Here
### **The Transparency Trap**

* **Public Blockchains (Ethereum, Solana, Polygon)**:
  * Making loan amounts, lender names, and Aadhaar-derived IDs public violates fundamental financial privacy and banking regulations.
* **Private / Permissioned Ledgers (Hyperledger)**:
  * Require trusted consortiums; fragile to collusion, complex to audit, and creates single points of failure.
* **What the Industry Actually Needs**:
  * **Public verification** of mathematical compliance facts ($\le 2$ lenders, $\le ₹1,00,000$).
  * **Private storage** of sensitive loan amounts, nonces, and institution identities.

---

## Slide 4: The Midnight Solution — Vantage Architecture
### **Dual-Ledger Zero-Knowledge State Partitioning**

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MIDNIGHT DUAL-LEDGER                          │
│                                                                        │
│  Public On-Chain State (Midnight Blockchain):                          │
│  ├── loan_commitments: Set<Bytes<32>>   (Cryptographic Hashes)         │
│  ├── nullifiers: Set<Bytes<32>>         (Double-Repayment Guards)      │
│  └── borrower_portfolios: Map<Bytes<32>, Bytes<32>> (Accumulator Root) │
│                                                                        │
│  Compact Circuit Enforcement (exposure-proof.compact):                 │
│  ├── register_loan()                                                   │
│  ├── close_loan()                                                      │
│  └── prove_exposure_within_limit()                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Evaluates ZK Proof & Transcript
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│              OFF-CHAIN BORROWER PRIVATE VAULT (Browser Client)         │
│                                                                        │
│  Private Witness Data (Never leaves device):                           │
│  ├── borrower_id: Bytes<32>                                            │
│  └── loans: Vector<8, PrivateLoanRecord>                               │
│      ├── lender_id, amount (₹ INR), nonce (secret salt), status        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Slide 5: Core Cryptographic Innovations
### **1. Anti-Omission Accumulator Hash Chains**
* **The Vulnerability**: A borrower could attempt to hide active loans from their witness to appear compliant.
* **The Vantage Fix**:
  * On every registration, on-chain state updates: `borrower_portfolios[borrower_id] = persistentHash([current_root, commitment])`.
  * The Compact ZK circuit folds over the borrower's witness: if any loan is omitted or modified, the hash chain diverges and the proof fails.

### **2. Nonce Nullifiers for Loan Closure**
* Repaying a loan generates a spent nullifier `persistentHash([commitment, nonce])`.
* Prevents double-counting while preserving the historical accumulator integrity.

### **3. Zero-PII Mathematical Disclosure**
* Verifiers only learn one boolean truth: *Borrower is compliant with RBI rules*.
* Zero Aadhaar numbers, 0 loan balances, 0 lender names leaked.

---

## Slide 6: The User Experience (Stitch Design System)
### **Enterprise-Grade UI with Emerald Sentinel Design Tokens**

* **1. Issuer View (Disbursement)**:
  * MFI Credit Officer enters loan amount and borrower ID.
  * Midnight circuit registers commitment on-chain and outputs secret 32-byte `loan_nonce` entropy salt.
* **2. Borrower View (Local Vault & ZK Prover)**:
  * Client-side private wallet binds loan records with secret nonces.
  * Direct Compact WASM prover executes in-browser with real-time multi-stage telemetry.
* **3. Verifier View (Audit & Credit Approval)**:
  * 1-click cryptographic audit against Midnight blockchain.
  * Real-time Information Disclosure Audit confirming 0 PII revealed.
* **4. Dual-Ledger Interactive Explainer**:
  * Live visualizer showing what is public on Midnight vs what remains private.

---

## Slide 7: Live Demonstration Scenarios
### **Instant 1-Click Verification for Judges**

| Scenario | Loans Registered | Total Exposure | Compact Circuit Result |
|---|---|---|---|
| **✅ Compliant (2 Loans)** | Bandhan (₹40k) + Fusion (₹50k) | ₹90,000 ($\le ₹1L$) | **PASS** — Cryptographic Proof Synthesized |
| **❌ Exceeds Amount Cap** | Bandhan (₹60k) + Fusion (₹55k) | ₹1,15,000 ($> ₹1L$) | **REJECTED** — Exposure limit exceeded |
| **❌ Exceeds Lenders Cap** | 3 MFIs (₹25k + ₹25k + ₹25k) | 3 Lenders ($> 2$) | **REJECTED** — Max lenders exceeded |
| **🔒 Anti-Omission Attack** | Borrower tries hiding 3rd loan | Diverged Hash Chain | **REJECTED** — Portfolio root mismatch |
| **🔄 Repayment Recovery** | Loan 1 Repaid & Nullified | 2 Active (₹75k) | **PASS** — Restored to compliance |

---

## Slide 8: Technical Rigor & Verification
### **100% Passing Test Matrix**

* **18/18 Vitest Unit & E2E Integration Tests**:
  * `contracts/tests/exposure-proof.test.ts` (17 tests): Pure hash circuits, issuer registration, exact boundary conditions, zero-loan borrowers, anti-omission enforcement, and nullifier tracking.
  * `contracts/tests/e2e-scenario.test.ts` (1 test): Complete 7-step multi-party lifecycle from genesis to repayment.
* **Pinned Toolchain Reproducibility**:
  * Compact Compiler `0.31.1`, Compact Runtime `@midnight-ntwrk/compact-runtime@0.16.0`, Node.js 22 LTS.
  * Verified with zero manual fixups on clean clone.
* **Production Build**:
  * Next.js 15 App Router compiles cleanly with Webpack 5 WASM integration.

---

## Slide 9: Wave 1 Accomplishments & Wave 2 Roadmap

### **Completed in Wave 1**:
* [x] Formally verified Compact smart contract (`exposure-proof.compact`).
* [x] Anti-omission accumulator hash chain & nullifier lifecycle.
* [x] Next.js 15 web application with Emerald Sentinel design system.
* [x] Direct in-browser Compact circuit execution & multi-stage telemetry.
* [x] Docker test harness (`midnightnetwork/proof-server:latest`, `midnight-node`).
* [x] 18/18 Automated unit and E2E integration test suite.

### **Wave 2 Roadmap**:
* [ ] **Sparse Merkle Tree Accumulator**: Replace linear `Vector<8>` fold with depth-32 Sparse Merkle Tree ($O(\log n)$ proofs) supporting $4.29$ billion lifetime loans.
* [ ] **Automated DID Encrypted Messaging**: Replace manual nonce transfer with libp2p / DIDComm mobile wallet push notifications.
* [ ] **Midnight Testnet Contract Deployment**: Live integration with Midnight testnet indexer and wallet extensions.

---

## Slide 10: Conclusion & Call to Action
### **Vantage brings genuine zero-knowledge privacy to 66+ million Indian microfinance borrowers.**

* **Repository**: [https://github.com/your-org/Vantage](https://github.com/your-org/Vantage)
* **License**: Apache 2.0
* **Tags**: `midnightntwrk`, `compact`, `zero-knowledge`, `regtech`, `microfinance`
* **Contact & Team**: Vantage Core Team (Midnight WaveHack 2026)
