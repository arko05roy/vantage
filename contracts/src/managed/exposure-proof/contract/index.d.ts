import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  get_borrower_id(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  get_loan_records(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { lender_id: Uint8Array,
                                                                                 amount: bigint,
                                                                                 nonce: Uint8Array,
                                                                                 status: number
                                                                               }[]];
}

export type ImpureCircuits<PS> = {
  register_loan(context: __compactRuntime.CircuitContext<PS>,
                borrower_id_0: Uint8Array,
                lender_id_0: Uint8Array,
                amount_0: bigint,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  prove_exposure_within_limit(context: __compactRuntime.CircuitContext<PS>,
                              max_lender_count_0: bigint,
                              max_total_exposure_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  close_loan(context: __compactRuntime.CircuitContext<PS>,
             loan_commitment_0: Uint8Array,
             nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  register_loan(context: __compactRuntime.CircuitContext<PS>,
                borrower_id_0: Uint8Array,
                lender_id_0: Uint8Array,
                amount_0: bigint,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  prove_exposure_within_limit(context: __compactRuntime.CircuitContext<PS>,
                              max_lender_count_0: bigint,
                              max_total_exposure_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  close_loan(context: __compactRuntime.CircuitContext<PS>,
             loan_commitment_0: Uint8Array,
             nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  get_genesis_root(): Uint8Array;
  compute_loan_commitment(borrower_id_0: Uint8Array,
                          lender_id_0: Uint8Array,
                          amount_0: bigint,
                          nonce_0: Uint8Array): Uint8Array;
  compute_nullifier(commitment_0: Uint8Array, nonce_0: Uint8Array): Uint8Array;
  update_portfolio_root(current_root_0: Uint8Array, commitment_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  get_genesis_root(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  compute_loan_commitment(context: __compactRuntime.CircuitContext<PS>,
                          borrower_id_0: Uint8Array,
                          lender_id_0: Uint8Array,
                          amount_0: bigint,
                          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  compute_nullifier(context: __compactRuntime.CircuitContext<PS>,
                    commitment_0: Uint8Array,
                    nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  update_portfolio_root(context: __compactRuntime.CircuitContext<PS>,
                        current_root_0: Uint8Array,
                        commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  register_loan(context: __compactRuntime.CircuitContext<PS>,
                borrower_id_0: Uint8Array,
                lender_id_0: Uint8Array,
                amount_0: bigint,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  prove_exposure_within_limit(context: __compactRuntime.CircuitContext<PS>,
                              max_lender_count_0: bigint,
                              max_total_exposure_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  close_loan(context: __compactRuntime.CircuitContext<PS>,
             loan_commitment_0: Uint8Array,
             nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  loan_commitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  borrower_portfolios: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
