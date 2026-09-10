# System Architecture

This document describes the technical architecture, state model, and zero-knowledge circuit design of Vantage.

---

## 1. State Partitioning & Dual-Ledger Model

Vantage separates public ledger state on Midnight from private borrower witness data held locally in the client application.

### Public On-Chain Ledger
The Compact contract maintains three public state structures:
- `loan_commitments: Set<Bytes<32>>`: Set of 32-byte cryptographic commitments generated during loan registration:
  ```
  commitment = persistentHash([borrower_id, lender_id, amount, nonce])
  ```
- `nullifiers: Set<Bytes<32>>`: Set of spent loan markers published when a loan is closed:
  ```
  nullifier = persistentHash([commitment, nonce])
  ```
- `borrower_portfolios: Map<Bytes<32>, Bytes<32>>`: Mapping of `borrower_id` to the root hash of their registered loan commitments.

### Private Off-Chain State
The borrower's browser vault stores private loan records that are never published in cleartext:
```typescript
interface PrivateLoanRecord {
  lender_id: Uint8Array; // 32 bytes
  amount: bigint;        // Loan principal (INR)
  nonce: Uint8Array;     // 32-byte random entropy salt
  status: number;        // 0: Inactive, 1: Active, 2: Closed
}
```

```
+-----------------------------------------------------------------------------+
|                                Midnight Ledger                              |
|                                                                             |
|   Public Storage:                                                           |
|   - loan_commitments: Set<Bytes<32>>                                        |
|   - nullifiers: Set<Bytes<32>>                                              |
|   - borrower_portfolios: Map<Bytes<32>, Bytes<32>>                          |
|                                                                             |
|   Compact Circuits:                                                         |
|   - register_loan(borrower_id, lender_id, amount, nonce)                    |
|   - close_loan(commitment, nonce)                                           |
|   - prove_exposure_within_limit(max_lenders, max_amount)                    |
+--------------------------------------┬--------------------------------------+
                                       | ZK Verification
+--------------------------------------┴--------------------------------------+
|                         Borrower Local Vault (Browser)                      |
|                                                                             |
|   Private Witness:                                                          |
|   - borrower_id: Bytes<32>                                                  |
|   - loans: Vector<8, PrivateLoanRecord>                                     |
+-----------------------------------------------------------------------------+
```

---

## 2. Circuit Proving Pipeline

Zero-knowledge proving runs in two phases:

### Stage 1: In-Browser ZKIR Evaluation
- Executed in WebAssembly via `@midnight-ntwrk/compact-runtime`.
- Marshals the private witness into `Vector<8, PrivateLoanRecord>`.
- Folds over the witness using `persistentHash([running_root, commitment])` and checks that the reconstructed root matches `borrower_portfolios[borrower_id]`.
- Asserts that all witness commitments exist in `loan_commitments` and are not in `nullifiers`.
- Verifies that `active_lenders <= max_lenders` and `total_exposure <= max_amount`.
- Produces the ZK Intermediate Representation (ZKIR) trace (`prove_exposure_within_limit.bzkir`) and public transcript.

### Stage 2: SNARK Proof Generation
- Sends the ZKIR trace and witness assignment to the Midnight Proof Server (`midnightnetwork/proof-server` on port 6300).
- Produces the final Groth16/Plonk zero-knowledge SNARK proof envelope.
- In standalone web preview mode without Docker running, the client outputs the verified Stage 1 ZKIR constraint result directly.

---

## 3. Accumulator Design & Scalability

### Wave 1 Linear Hash Chain
In the current implementation, anti-omission is enforced by a linear hash chain accumulator over `Vector<8, PrivateLoanRecord>`. The prover must include both active and closed loans in the witness to reproduce the on-chain root.

- **Array Capacity**: `Vector<8>` supports up to 8 lifetime loans per borrower.
- **Microfinance Suitability**: In typical Indian microfinance credit cycles, borrowers carry 1 to 2 concurrent loans and fewer than 6 lifetime credit cycles.

### Wave 2 Sparse Merkle Tree (SMT)
For production deployments exceeding 8 lifetime loans, the linear fold will be replaced with an on-chain Sparse Merkle Tree (depth 32):
1. **Registration**: Lenders insert new commitments into the borrower's SMT leaf at index `k`, updating the root in $O(\log n)$ constraints.
2. **Exposure Proof**: Borrowers only supply active loans along with their $O(\log n)$ Merkle membership paths. Repaid/closed loans do not need to be loaded into the witness vector.
3. **Capacity**: Supports up to $2^{32} \approx 4.29 \times 10^9$ lifetime loans per borrower with constant witness overhead.

---

## 4. Disclaimer

Institution names used in test scenarios and documentation (Bandhan MFI, Fusion Microfinance, CreditAccess Grameen) are illustrative examples to model Indian microfinance regulations. No commercial relationship or affiliation is implied.
