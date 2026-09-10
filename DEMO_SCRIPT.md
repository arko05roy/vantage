# Vantage: 3-Minute Video Pitch & Demo Script

**Project**: Vantage — Zero-Knowledge Microfinance Exposure Proof System  
**Track**: Midnight Network WaveHack 2026  
**Target Duration**: 3 minutes (180 seconds)

---

## ⏱️ Video Breakdown

| Timestamp | Segment | Visual Screen | Voiceover / Narration |
|---|---|---|---|
| **0:00 - 0:30** | **The Problem** | Slide 2 (Indian Microfinance Crisis) & Slide 3 (Privacy Paradox) | *"In India, over 66 million low-income women rely on microfinance institutions for livelihood credit. The Reserve Bank of India strictly mandates that no borrower can hold loans with more than 2 lenders, or exceed a total debt of ₹1,00,000. But today, enforcing this requires centralized credit bureaus that harvest unencrypted Aadhaar numbers, loan balances, and bank names—exposing vulnerable borrowers to data leaks and predatory over-indebtedness. Today, we introduce **Vantage**—the zero-knowledge credit exposure verification system built on the Midnight Network."* |
| **0:30 - 0:55** | **Architecture & Dual-Ledger** | Dual-Ledger Explainer Tab (`DualLedgerExplainer.tsx`) | *"Vantage harnesses Midnight's unique dual-ledger architecture. On-chain, the Midnight blockchain only stores 32-byte cryptographic commitments, loan nullifiers, and an anti-omission accumulator root. The borrower's loan amounts, lender identities, and Aadhaar numbers remain strictly in their local browser private vault. Let's see this in action."* |
| **0:55 - 1:25** | **Issuer Loan Disbursement** | Issuer View Tab (`IssuerView.tsx`) | *"We start as Bandhan MFI extending a ₹40,000 microloan to Priya Sharma. When we click 'Register Loan Commitment on Midnight', the Compact smart contract computes a cryptographic commitment and updates the on-chain portfolio root. Notice the secret 32-byte loan nonce generated on the screen. In Wave 1, the borrower simply copies this nonce to link the loan into their private wallet."* |
| **1:25 - 2:05** | **Borrower Vault & ZK Prover** | Borrower View Tab (`BorrowerView.tsx`) | *"Now switching to the Borrower Vault. Priya's local private vault contains her two active loans—₹40,000 from Bandhan and ₹50,000 from Fusion Microfinance, totaling ₹90,000 across 2 institutions. She clicks 'Generate ZK Compliance Proof'. In under 400 milliseconds, the compiled Compact WebAssembly circuit evaluates her private witness, reconstructs the portfolio hash chain, checks on-chain nullifiers, and synthesizes a genuine zero-knowledge proof package."* |
| **2:05 - 2:35** | **Verifier Audit & Over-Lending Check** | Verifier View Tab (`VerifierView.tsx`) & Over-Lending Preset | *"Priya submits this proof to a new lender or credit officer. The Verifier portal checks the proof against the Midnight blockchain in real-time. Result: **COMPLIANCE VERIFIED**. Notice the Information Disclosure Audit: zero loan balances, zero lender names, and zero Aadhaar data revealed! Now, what if a borrower tries to cheat or exceeds limits? Let's click the 'Exceeds Cap (₹1.15L)' preset. The Compact circuit immediately mathematically rejects the proof with an assertion error. And if a borrower tries to omit a loan from their witness, our anti-omission accumulator detects the divergence immediately!"* |
| **2:35 - 3:00** | **Conclusion & Impact** | Slide 10 (Call to Action & Test Matrix) | *"Vantage is backed by 18 fully passing automated tests, a pinned reproducible Compact 0.31.1 toolchain, and a complete Docker test harness. With Midnight, financial inclusion and financial privacy no longer have to be mutually exclusive. Thank you!"* |

---

## 🎯 Key Talking Points to Emphasize

1. **Midnight Dual-Ledger Alignment**: Clearly articulate what is public (commitments, nullifiers, accumulator roots) vs private (witness loan records, amounts, nonces).
2. **Cryptographic Anti-Omission Guarantee**: Mention how `borrower_portfolios` prevents borrowers from cherry-picking loans.
3. **Real Compact 0.31.1 Circuits**: Show that all assertions execute directly via `@midnight-ntwrk/compact-runtime`.
4. **All 6 Stitch UI Corrections**: Highlighting the `₹` INR formatting, 2-lender / ₹1L defaults, copyable nonce, status badges, and dual-ledger explainer.
