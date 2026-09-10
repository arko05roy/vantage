# Vantage: Technical Architecture & System Design

**Project**: Vantage — Zero-Knowledge Microfinance Exposure Proof System  
**Network**: Midnight Blockchain (WaveHack 2026)  
**Smart Contract Language**: Compact v0.31.1 (`@midnight-ntwrk/compact-runtime` v0.16.0)

---

## 1. Executive Summary & Dual-Ledger Model

Vantage implements a zero-knowledge regulatory compliance oracle for Indian NBFC-Microfinance Institutions (NBFC-MFIs). Under Reserve Bank of India (RBI) directives, a microfinance borrower must not exceed:
1. **Total outstanding exposure cap**: $\le ₹1,00,000$ (or MFI policy limit).
2. **Concurrent active lenders cap**: $\le 2$ microfinance institutions.

Traditional credit bureaus (CIBIL, CRIF High Mark, Equifax) require centralizing cleartext Aadhaar numbers, loan balances, repayment dates, and institution names—exposing vulnerable rural borrowers to predatory cross-selling and surveillance. Vantage resolves this tension by partitioning state across Midnight's dual-ledger model:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MIDNIGHT BLOCKCHAIN                              │
│                                                                             │
│   Public On-Chain Ledger:                                                   │
│   ├── loan_commitments: Set<Bytes<32>>   (Cryptographic loan commitments)   │
│   ├── nullifiers: Set<Bytes<32>>         (Repayment double-spend guards)    │
│   └── borrower_portfolios: Map<Bytes<32>, Bytes<32>> (Accumulator roots)    │
│                                                                             │
│   Compact Smart Contract Circuits:                                          │
│   ├── register_loan(borrower_id, lender_id, amount, nonce)                  │
│   ├── close_loan(commitment, nonce)                                         │
│   └── prove_exposure_within_limit(max_lenders, max_amount)                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ ZK Proof & Transcript Verification
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                    OFF-CHAIN BORROWER PRIVATE VAULT (Browser)               │
│                                                                             │
│   Private Witness State:                                                    │
│   ├── borrower_id: Bytes<32>                                                │
│   └── loans: Vector<8, PrivateLoanRecord>                                   │
│       ├── lender_id: Bytes<32>                                              │
│       ├── amount: Uint<64> (₹ INR)                                          │
│       ├── nonce: Bytes<32> (Secret entropy salt)                            │
│       └── status: Uint<8>  (0=Inactive, 1=Active, 2=Closed)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Proving Pipeline & Telemetry Breakdown

### What Happens During Circuit Execution (~300–450ms Latency)

In the Vantage client and Midnight architecture, proof generation operates in two distinct stages:

```
+-------------------------------------------------------------------------------+
| STAGE 1: Client-Side Witness Synthesis & ZKIR Evaluation (~300-450ms)         |
| Executed directly in-browser via @midnight-ntwrk/compact-runtime WASM         |
+-------------------------------------------------------------------------------+
  1. Witness Marshaling: Packages private loans into Vector<8, PrivateLoanRecord>.
  2. Cryptographic Folding: Folds over witness to compute portfolio root via
     persistentHash([running_root, commitment]).
  3. Anti-Omission Assertion: Verifies calculated running_root == on_chain_root.
  4. Constraint Evaluation: Verifies on-chain commitment existence, nullifier
     non-membership, active lender count <= max_lenders, and total active
     exposure <= max_amount.
  5. Transcript Synthesis: Generates the Zero-Knowledge Intermediate Representation
     (ZKIR) byte buffer (prove_exposure_within_limit.bzkir) and publicTranscript.
                                     │
                                     ▼
+-------------------------------------------------------------------------------+
| STAGE 2: Proving Key SNARK Envelope Synthesis (Proof Server / Docker)         |
| Executed via midnightnetwork/proof-server:latest on port 6300                 |
+-------------------------------------------------------------------------------+
  - Ingests the ZKIR byte buffer and proving key (prove_exposure_within_limit.prover).
  - Synthesizes the final Groth16/Plonk zero-knowledge SNARK proof envelope.
```

> **Technical Honesty Note**: The ~300–450ms latency measured in the Telemetry Card represents **Stage 1 (in-browser Compact ZKIR constraint synthesis, witness binding, and cryptographic hash evaluation)** via the compiled WebAssembly Compact runtime. In standalone client mode, Stage 1 evaluates every genuine circuit assertion and cryptographic primitive. When connected to the local Docker test harness (`midnightnetwork/proof-server:latest`), the resulting ZKIR is submitted to Stage 2 to synthesize the complete SNARK proof artifact.

---

## 3. Known Wave 1 Limitations & Wave 2 Architecture Roadmap

### A. The `Vector<8, ...>` Witness Cap & The 9th Lifetime Loan

* **Current Wave 1 Implementation**:
  In `contracts/src/exposure-proof.compact`, the borrower witness is defined as `Vector<8, PrivateLoanRecord>`. To enforce anti-omission and verify that no active loans are hidden, the circuit folds over the historical sequence of all registered loans (both `ACTIVE` and `CLOSED`) and asserts that `running_root == borrower_portfolios[borrower_id]`.
* **The 9th Loan Boundary**:
  Because `Vector<8, ...>` is a fixed-capacity compile-time array in Compact 0.31.1, a borrower taking their 9th lifetime loan will exceed the array bounds if attempting to pass all 9 lifetime loans in the linear fold.
* **Why This Was Chosen for Wave 1**:
  Indian microfinance borrowers typically have 1–2 concurrent active loans and under 5 lifetime credit cycles in initial onboarding phases. Vector<8> fits within Compact compile-time constraints while keeping circuit synthesis times under 500ms.
* **Wave 2 Architectural Fix (Sparse Merkle Tree Accumulator)**:
  In Wave 2, Vantage will transition from a linear hash-chain accumulator ($O(n)$ witness size) to a **Sparse Merkle Tree (SMT)** or **Poseidon Merkle Tree** of depth 32:
  1. **On Registration**: The issuing MFI inserts the loan commitment into the borrower's on-chain Sparse Merkle Tree leaf at index $k$, updating the Merkle root in $O(\log n)$ constraints.
  2. **In `prove_exposure_within_limit`**: The borrower only needs to supply their **active loans** plus their $O(\log n)$ Merkle membership proofs (siblings). Repaid/closed loans do not need to be loaded into the witness vector at all.
  3. **Capacity**: Supports $2^{32} \approx 4.29\times 10^9$ lifetime loans per borrower with constant witness overhead.

### B. Wave 1 Nonce Transfer Simplification

* **Wave 1 (Current)**:
  As documented in PRD §8.1, the borrower manually copies the 32-byte secret `loan_nonce` entropy salt from the Issuer result panel into their local browser vault (or uses the 1-click import button).
* **Wave 2**:
  Implementation of automated off-chain encrypted messaging via DID Comm / libp2p or Midnight private state channels, delivering encrypted nonces directly into the borrower's mobile wallet upon loan disbursement.

---

## 4. Institutional Disclaimer

* **Illustrative Scenario Data**:
  MFI institution names used in test suites, preset demonstration scenarios, and documentation (e.g., *Bandhan MFI*, *Fusion Microfinance*, *CreditAccess Grameen*) are referenced strictly for illustrative and educational purposes to reflect real-world Indian microfinance lending regulations. No commercial partnership, endorsement, or institutional affiliation is implied.
