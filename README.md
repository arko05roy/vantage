# Vantage — Privacy-Preserving Credit Exposure Verification on Midnight

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Midnight Network](https://img.shields.io/badge/Midnight-Dual--Ledger-purple.svg)](https://docs.midnight.network/)
[![Compact Version](https://img.shields.io/badge/Compact%20Compiler-0.31.1-green.svg)](https://docs.midnight.network/)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%20LTS-brightgreen.svg)](https://nodejs.org/)

**Vantage** resolves the systemic over-lending challenge in India's microfinance sector (NBFC-MFIs) by enabling borrowers to cryptographically prove compliance with regulatory exposure limits without revealing their loan amounts, lender identities, or personal financial history.

---

## 📌 Problem & Zero-Knowledge Solution

In Indian microfinance, multiple lenders extend credit to the same low-income borrowers without cross-lender exposure visibility. Current regulatory compliance relies on centralized Credit Information Companies (CICs), creating large honeypots of sensitive borrower PII.

**Vantage implements a zero-knowledge dual-ledger model on Midnight Network:**
$$\text{active\_loan\_count} \le \text{MAX\_LENDERS} \quad \land \quad \text{total\_exposure} \le \text{REGULATORY\_CAP}$$

* **On-Chain Public State**: Only 32-byte cryptographic commitments (`persistentHash([borrower_id, lender_id, amount, nonce])`) and spent loan nullifiers.
* **Off-Chain Private Witness**: Raw loan records `{ lender_id, amount, nonce, status }` remain strictly on the borrower's local client device.

---

## 🛠️ Pinned Toolchain & Environment

| Component | Pinned Version | Purpose |
|---|---|---|
| **Compact CLI** (`compact`) | `0.5.2` | CLI tool for toolchain management |
| **Compact Compiler** (`compactc`) | `0.31.1` | ZK circuit & TypeScript code generation |
| **Compact Language Pragma** | `>= 0.20` | Supported language specification |
| **Node.js** | `v22.14.0` (LTS) | Runtime for Midnight JS and Vitest test runner |
| **Compact Runtime** | `@midnight-ntwrk/compact-runtime@0.16.0` | Execution library for off-chain circuits |

---

## 🚀 Quickstart & Reproduction

### 1. Prerequisites
* Linux / macOS or Windows with WSL2 (Ubuntu 24.04).
* Node.js 22 LTS (`nvm use` reads `.nvmrc`).
* Compact Compiler `0.31.1`.

### 2. Install Compact Toolchain (if not already installed)
```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
source ~/.local/bin/env
compact update 0.31.1
```

### 3. Install Dependencies & Run Tests
```bash
# Clone the repository
git clone <repo-url>
cd Vantage

# Install contract workspace dependencies
npm --prefix contracts install

# Compile the Compact smart contract
compact compile contracts/src/exposure-proof.compact contracts/src/managed/exposure-proof

# Run the 13-test boundary and circuit test suite
npm --prefix contracts test
```

---

## 🧪 Test Matrix Summary

The Vitest test suite (`contracts/tests/exposure-proof.test.ts`) verifies:
1. **Pure Circuits**: Deterministic 32-byte commitment hashes and nullifier generation.
2. **Issuer Registration**: On-chain commitment insertion, non-positive amount rejection, duplicate prevention.
3. **Borrower Exposure Circuits**:
   * ✅ **Happy Path**: Borrower strictly within limit (1 loan of ₹30,000 against ₹1,00,000 cap).
   * 🎯 **Exact Boundary Pass**: Exactly at threshold boundary (2 loans totaling ₹1,00,000 against max 2 loans & ₹1,00,000 cap).
   * ❌ **Amount Exceeded Failure**: Total exposure ₹1,10,000 against ₹1,00,000 cap (Throws expected assert).
   * ❌ **Lender Count Exceeded Failure**: 3 active lenders against max 2 cap (Throws expected assert).
   * 🔒 **Fake Loan Rejection**: Uncommitted witness loan rejected by on-chain membership assertion.
4. **Loan Repayment & Nullifiers**: Closed loans nullified and dropped from active exposure, preventing replay.

---

## 📄 License
This project is licensed under the [Apache 2.0 License](LICENSE).
