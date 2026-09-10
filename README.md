# Vantage

Privacy-preserving credit exposure verification on the Midnight Network.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Midnight Network](https://img.shields.io/badge/Midnight-Dual--Ledger-purple.svg)](https://docs.midnight.network/)
[![Compact Compiler](https://img.shields.io/badge/Compact-0.31.1-green.svg)](https://docs.midnight.network/)
[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-brightgreen.svg)](https://nodejs.org/)

Vantage is a zero-knowledge compliance oracle for microfinance institutions (NBFC-MFIs). It allows borrowers to prove compliance with statutory credit exposure limits (such as RBI rules in India) without disclosing their individual loan amounts, lender identities, or personal financial history.

- **Demo Video**: [YouTube Walkthrough](https://www.youtube.com/watch?v=fjpweqd8ntU)
- **Slide Deck**: [Google Slides Presentation](https://docs.google.com/presentation/d/1FWppOp8hFJ8qjXGI31EL0wIbHy5VHDlIs0LvuDmvWDc/edit?usp=sharing)

---

## Overview

In microfinance lending, regulatory frameworks restrict concurrent debt exposure to prevent systemic over-indebtedness. In India, for example, RBI guidelines cap borrower exposure:
- **Maximum concurrent lenders**: 2 institutions
- **Maximum total exposure**: ₹1,00,000 INR

Traditional credit bureaus (CIBIL, CRIF High Mark, Equifax) require centralizing unencrypted borrower identity records (Aadhaar numbers), loan balances, and payment schedules. Centralized credit registries expose low-income borrowers to surveillance, data leakage, and predatory cross-selling.

Vantage uses Midnight's dual-ledger architecture to verify borrower compliance off-chain:
- **On-chain public ledger**: Stores 32-byte cryptographic commitments, repayment nullifiers, and borrower portfolio accumulator roots.
- **Off-chain private state**: Raw loan amounts, secret nonces, and lender identifiers remain inside the borrower's local client environment.

```
                    Vantage State Architecture

  +-------------------------------------------------------------+
  |              Midnight Public On-Chain Ledger                |
  |                                                             |
  |  - loan_commitments : Set<Bytes<32>>   (Pedersen hashes)    |
  |  - nullifiers       : Set<Bytes<32>>   (Settlement markers) |
  |  - borrower_portfolios : Map<Bytes<32>, Bytes<32>> (Roots)  |
  +------------------------------+------------------------------+
                                 |
                 ZK Proofs & On-Chain Audit
                                 |
  +------------------------------+------------------------------+
  |             Borrower Private State (Client / Browser)       |
  |                                                             |
  |  - borrower_id : Bytes<32>                                  |
  |  - loans       : Vector<8, PrivateLoanRecord>               |
  |    { lender_id, amount, nonce, status }                     |
  +-------------------------------------------------------------+
```

---

## Toolchain & Versions

| Package | Version | Usage |
|---|---|---|
| Compact Compiler (`compactc`) | `0.31.1` | Smart contract compilation and ZK circuit generation |
| Compact CLI (`compact`) | `0.5.2` | Compiler toolchain manager |
| Node.js | `v22.14.0` (LTS) | Runtime and Vitest test runner |
| Compact Runtime | `@midnight-ntwrk/compact-runtime@0.16.0` | In-browser and Node.js circuit execution |
| Frontend | Next.js 15 App Router | User interface (React 19, Tailwind CSS) |

---

## Cryptographic Design

1. **Anti-Omission Portfolio Accumulator**:
   When a lender registers a loan on-chain, Midnight updates `borrower_portfolios[borrower_id]` using a hash chain: `persistentHash([current_root, commitment])`.
   During proof generation, the circuit folds over the borrower's witness vector and checks `running_root == borrower_portfolios.lookup(borrower_id)`. A borrower cannot omit an existing loan from their witness without causing the hash chain to diverge.

2. **Zero-Loan Borrowers**:
   Borrowers with no prior registered loans match `get_genesis_root()` on-chain and pass validation with 0 active loans and ₹0 exposure.

3. **Repayment via Nullifiers**:
   When a loan is closed, the lender registers a nullifier `persistentHash([commitment, nonce])` in the on-chain `nullifiers` set. Settled loans are excluded from active exposure calculations while preserving the historical portfolio accumulator root.

4. **Information Disclosure Matrix**:
   - Borrower Identity / Aadhaar: Kept private (0 bytes revealed)
   - Individual Loan Balances: Kept private (0 bytes revealed)
   - Lender Names & Locations: Kept private (0 bytes revealed)
   - Regulatory Compliance Fact: Publicly verified on-chain

---

## Proving Pipeline

Vantage implements a two-stage proving workflow:

1. **Stage 1: Witness Synthesis & ZKIR Trace Evaluation** (~150–350ms):
   Runs in the browser using `@midnight-ntwrk/compact-runtime` WebAssembly. It evaluates circuit assertions, accumulator folding, and inequality constraints, outputting the Zero-Knowledge Intermediate Representation (ZKIR) trace and `publicTranscript`.

2. **Stage 2: SNARK Proving Key Execution**:
   Submits the ZKIR trace to the Midnight Proof Server (`http://localhost:6300/prove` via Docker) to synthesize the full Groth16/Plonk SNARK proof envelope. When running without the Docker proof server attached, the client operates in standalone mode using verified Stage 1 ZKIR constraint outputs.

---

## Getting Started

### Prerequisites
- Node.js 22 LTS (`nvm use` reads `.nvmrc`)
- Docker (optional, for local proof server)

### Installation & Testing
```bash
# Clone the repository
git clone https://github.com/igabhix001/vantage.git
cd vantage

# Install workspace dependencies
npm install

# Run contract circuit tests
npm test

# Run the 7-step multi-party E2E lifecycle test
npm run test:e2e
```

### Running the Web Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploying Contract Simulation
```bash
npm run deploy:contracts
```

### Running Local Proof Server & Node (Docker)
```bash
docker compose up -d
```

---

## Test Suite

The test suite contains 18 tests across unit, circuit, and multi-party lifecycle suites (`vitest`):

```
Test Files  2 passed (2)
Tests       18 passed (18)
```

- **Pure Circuits**: Deterministic commitment hashing, nullifier derivation, genesis root generation, and hash chain folding.
- **Issuer Circuits**: Commitment registration, non-positive amount rejection, duplicate prevention, and root tracking.
- **Borrower Circuits**:
  - Valid proof under regulatory limits (₹30,000 vs ₹1,00,000 cap).
  - Exact boundary conditions (2 loans totaling ₹1,00,000).
  - Exposure cap violation rejection (₹1,10,000 vs ₹1,00,000 cap).
  - Lender count cap violation rejection (3 lenders vs 2 cap).
  - Anti-omission rejection (omitted witness loans fail on-chain root check).
  - Uncommitted fake loan rejection.
  - Falsified closed status rejection.
  - Zero-loan borrower validation.
- **Multi-Party E2E Lifecycle**: Full simulation covering Genesis deployment → Loan 1 disbursement → Loan 2 disbursement → Compliant proof generation → Verifier audit → Loan 3 over-lending rejection → Loan 1 repayment & nullification → Re-proving compliance.

---

## Disclaimer

Institution names used in test scenarios and demonstration data (Bandhan MFI, Fusion Microfinance, CreditAccess Grameen) are illustrative examples based on real-world Indian microfinance regulations. No commercial relationship, endorsement, or institutional affiliation is implied.

---

## License

Apache 2.0. See [LICENSE](LICENSE) for details.
