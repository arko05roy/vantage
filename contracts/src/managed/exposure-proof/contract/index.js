import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = __compactRuntime.CompactTypeBoolean;

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _ExposureSummary_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment()));
  }
  fromValue(value_0) {
    return {
      running_root: _descriptor_0.fromValue(value_0),
      active_count: _descriptor_2.fromValue(value_0),
      total_exposure: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.running_root).concat(_descriptor_2.toValue(value_0.active_count).concat(_descriptor_3.toValue(value_0.total_exposure)));
  }
}

const _descriptor_4 = new _ExposureSummary_0();

const _descriptor_5 = new __compactRuntime.CompactTypeEnum(2, 1);

class _PrivateLoanRecord_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_0.alignment().concat(_descriptor_5.alignment())));
  }
  fromValue(value_0) {
    return {
      lender_id: _descriptor_0.fromValue(value_0),
      amount: _descriptor_3.fromValue(value_0),
      nonce: _descriptor_0.fromValue(value_0),
      status: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.lender_id).concat(_descriptor_3.toValue(value_0.amount).concat(_descriptor_0.toValue(value_0.nonce).concat(_descriptor_5.toValue(value_0.status))));
  }
}

const _descriptor_6 = new _PrivateLoanRecord_0();

const _descriptor_7 = new __compactRuntime.CompactTypeVector(8, _descriptor_6);

const _descriptor_8 = new __compactRuntime.CompactTypeVector(4, _descriptor_0);

const _descriptor_9 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

class _Either_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_1.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_10 = new _Either_0();

const _descriptor_11 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_12 = new _ContractAddress_0();

const _descriptor_13 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.get_borrower_id) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_borrower_id');
    }
    if (typeof(witnesses_0.get_loan_records) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named get_loan_records');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      get_genesis_root(context, ...args_1) {
        return { result: pureCircuits.get_genesis_root(...args_1), context };
      },
      compute_loan_commitment(context, ...args_1) {
        return { result: pureCircuits.compute_loan_commitment(...args_1), context };
      },
      compute_nullifier(context, ...args_1) {
        return { result: pureCircuits.compute_nullifier(...args_1), context };
      },
      update_portfolio_root(context, ...args_1) {
        return { result: pureCircuits.update_portfolio_root(...args_1), context };
      },
      register_loan: (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`register_loan: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const borrower_id_0 = args_1[1];
        const lender_id_0 = args_1[2];
        const amount_0 = args_1[3];
        const nonce_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('register_loan',
                                     'argument 1 (as invoked from Typescript)',
                                     'exposure-proof.compact line 126 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(borrower_id_0.buffer instanceof ArrayBuffer && borrower_id_0.BYTES_PER_ELEMENT === 1 && borrower_id_0.length === 32)) {
          __compactRuntime.typeError('register_loan',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'exposure-proof.compact line 126 char 1',
                                     'Bytes<32>',
                                     borrower_id_0)
        }
        if (!(lender_id_0.buffer instanceof ArrayBuffer && lender_id_0.BYTES_PER_ELEMENT === 1 && lender_id_0.length === 32)) {
          __compactRuntime.typeError('register_loan',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'exposure-proof.compact line 126 char 1',
                                     'Bytes<32>',
                                     lender_id_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('register_loan',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'exposure-proof.compact line 126 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('register_loan',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'exposure-proof.compact line 126 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(borrower_id_0).concat(_descriptor_0.toValue(lender_id_0).concat(_descriptor_3.toValue(amount_0).concat(_descriptor_0.toValue(nonce_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_0.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._register_loan_0(context,
                                               partialProofData,
                                               borrower_id_0,
                                               lender_id_0,
                                               amount_0,
                                               nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      prove_exposure_within_limit: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`prove_exposure_within_limit: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const max_lender_count_0 = args_1[1];
        const max_total_exposure_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('prove_exposure_within_limit',
                                     'argument 1 (as invoked from Typescript)',
                                     'exposure-proof.compact line 148 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(max_lender_count_0) === 'bigint' && max_lender_count_0 >= 0n && max_lender_count_0 <= 65535n)) {
          __compactRuntime.typeError('prove_exposure_within_limit',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'exposure-proof.compact line 148 char 1',
                                     'Uint<0..65536>',
                                     max_lender_count_0)
        }
        if (!(typeof(max_total_exposure_0) === 'bigint' && max_total_exposure_0 >= 0n && max_total_exposure_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('prove_exposure_within_limit',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'exposure-proof.compact line 148 char 1',
                                     'Uint<0..18446744073709551616>',
                                     max_total_exposure_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(max_lender_count_0).concat(_descriptor_3.toValue(max_total_exposure_0)),
            alignment: _descriptor_2.alignment().concat(_descriptor_3.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._prove_exposure_within_limit_0(context,
                                                             partialProofData,
                                                             max_lender_count_0,
                                                             max_total_exposure_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      close_loan: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`close_loan: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const loan_commitment_0 = args_1[1];
        const nonce_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('close_loan',
                                     'argument 1 (as invoked from Typescript)',
                                     'exposure-proof.compact line 184 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(loan_commitment_0.buffer instanceof ArrayBuffer && loan_commitment_0.BYTES_PER_ELEMENT === 1 && loan_commitment_0.length === 32)) {
          __compactRuntime.typeError('close_loan',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'exposure-proof.compact line 184 char 1',
                                     'Bytes<32>',
                                     loan_commitment_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('close_loan',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'exposure-proof.compact line 184 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(loan_commitment_0).concat(_descriptor_0.toValue(nonce_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._close_loan_0(context,
                                            partialProofData,
                                            loan_commitment_0,
                                            nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      register_loan: this.circuits.register_loan,
      prove_exposure_within_limit: this.circuits.prove_exposure_within_limit,
      close_loan: this.circuits.close_loan
    };
    this.provableCircuits = {
      register_loan: this.circuits.register_loan,
      prove_exposure_within_limit: this.circuits.prove_exposure_within_limit,
      close_loan: this.circuits.close_loan
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('register_loan', new __compactRuntime.ContractOperation());
    state_0.setOperation('prove_exposure_within_limit', new __compactRuntime.ContractOperation());
    state_0.setOperation('close_loan', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(0n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(1n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(2n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_8, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_9, value_0);
    return result_0;
  }
  _get_borrower_id_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_borrower_id(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('get_borrower_id',
                                 'return value',
                                 'exposure-proof.compact line 38 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _get_loan_records_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.get_loan_records(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 8 && result_0.every((t) => typeof(t) === 'object' && t.lender_id.buffer instanceof ArrayBuffer && t.lender_id.BYTES_PER_ELEMENT === 1 && t.lender_id.length === 32 && typeof(t.amount) === 'bigint' && t.amount >= 0n && t.amount <= 18446744073709551615n && t.nonce.buffer instanceof ArrayBuffer && t.nonce.BYTES_PER_ELEMENT === 1 && t.nonce.length === 32 && typeof(t.status) === 'number' && t.status >= 0 && t.status <= 2))) {
      __compactRuntime.typeError('get_loan_records',
                                 'return value',
                                 'exposure-proof.compact line 39 char 1',
                                 'Vector<8, struct PrivateLoanRecord<lender_id: Bytes<32>, amount: Uint<0..18446744073709551616>, nonce: Bytes<32>, status: Enum<LoanStatus, INACTIVE, ACTIVE, CLOSED>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_7.toValue(result_0),
      alignment: _descriptor_7.alignment()
    });
    return result_0;
  }
  _get_genesis_root_0() {
    return new Uint8Array([118, 97, 110, 116, 97, 103, 101, 58, 112, 111, 114, 116, 102, 111, 108, 105, 111, 58, 103, 101, 110, 101, 115, 105, 115, 0, 0, 0, 0, 0, 0, 0]);
  }
  _compute_loan_commitment_0(borrower_id_0, lender_id_0, amount_0, nonce_0) {
    return this._persistentHash_0([borrower_id_0,
                                   lender_id_0,
                                   __compactRuntime.convertFieldToBytes(32,
                                                                        amount_0,
                                                                        'exposure-proof.compact line 56 char 5'),
                                   nonce_0]);
  }
  _compute_nullifier_0(commitment_0, nonce_0) {
    return this._persistentHash_1([commitment_0, nonce_0]);
  }
  _update_portfolio_root_0(current_root_0, commitment_0) {
    return this._persistentHash_1([current_root_0, commitment_0]);
  }
  _process_portfolio_item_0(context,
                            partialProofData,
                            acc_0,
                            loan_0,
                            borrower_id_0)
  {
    if (loan_0.status === 0) {
      return acc_0;
    } else {
      let t_0;
      __compactRuntime.assert((t_0 = loan_0.amount, t_0 > 0n),
                              'Loan amount must be positive');
      const commitment_0 = this._compute_loan_commitment_0(borrower_id_0,
                                                           loan_0.lender_id,
                                                           loan_0.amount,
                                                           loan_0.nonce);
      const next_root_0 = this._update_portfolio_root_0(acc_0.running_root,
                                                        commitment_0);
      if (loan_0.status === 1) {
        const nul_0 = this._compute_nullifier_0(commitment_0, loan_0.nonce);
        __compactRuntime.assert(!_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                           partialProofData,
                                                                                           [
                                                                                            { dup: { n: 0 } },
                                                                                            { idx: { cached: false,
                                                                                                     pushPath: false,
                                                                                                     path: [
                                                                                                            { tag: 'value',
                                                                                                              value: { value: _descriptor_13.toValue(1n),
                                                                                                                       alignment: _descriptor_13.alignment() } }] } },
                                                                                            { push: { storage: false,
                                                                                                      value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(nul_0),
                                                                                                                                                   alignment: _descriptor_0.alignment() }).encode() } },
                                                                                            'member',
                                                                                            { popeq: { cached: true,
                                                                                                       result: undefined } }]).value),
                                'Active loan is marked closed on-chain');
        return { running_root: next_root_0,
                 active_count:
                   ((t1) => {
                     if (t1 > 65535n) {
                       throw new __compactRuntime.CompactError('exposure-proof.compact line 107 char 23: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 65535');
                     }
                     return t1;
                   })(acc_0.active_count + 1n),
                 total_exposure:
                   ((t1) => {
                     if (t1 > 18446744073709551615n) {
                       throw new __compactRuntime.CompactError('exposure-proof.compact line 108 char 25: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                     }
                     return t1;
                   })(acc_0.total_exposure + loan_0.amount) };
      } else {
        const nul_1 = this._compute_nullifier_0(commitment_0, loan_0.nonce);
        __compactRuntime.assert(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                          partialProofData,
                                                                                          [
                                                                                           { dup: { n: 0 } },
                                                                                           { idx: { cached: false,
                                                                                                    pushPath: false,
                                                                                                    path: [
                                                                                                           { tag: 'value',
                                                                                                             value: { value: _descriptor_13.toValue(1n),
                                                                                                                      alignment: _descriptor_13.alignment() } }] } },
                                                                                           { push: { storage: false,
                                                                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(nul_1),
                                                                                                                                                  alignment: _descriptor_0.alignment() }).encode() } },
                                                                                           'member',
                                                                                           { popeq: { cached: true,
                                                                                                      result: undefined } }]).value),
                                'Closed loan has no on-chain nullifier record');
        return { running_root: next_root_0,
                 active_count: acc_0.active_count,
                 total_exposure: acc_0.total_exposure };
      }
    }
  }
  _register_loan_0(context,
                   partialProofData,
                   borrower_id_0,
                   lender_id_0,
                   amount_0,
                   nonce_0)
  {
    __compactRuntime.assert(amount_0 > 0n,
                            'Loan amount must be greater than zero');
    const commitment_0 = this._compute_loan_commitment_0(borrower_id_0,
                                                         lender_id_0,
                                                         amount_0,
                                                         nonce_0);
    __compactRuntime.assert(!_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_13.toValue(0n),
                                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Loan commitment already registered');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_13.toValue(0n),
                                                                  alignment: _descriptor_13.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const current_root_0 = _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                     partialProofData,
                                                                                     [
                                                                                      { dup: { n: 0 } },
                                                                                      { idx: { cached: false,
                                                                                               pushPath: false,
                                                                                               path: [
                                                                                                      { tag: 'value',
                                                                                                        value: { value: _descriptor_13.toValue(2n),
                                                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                                                      { push: { storage: false,
                                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(borrower_id_0),
                                                                                                                                             alignment: _descriptor_0.alignment() }).encode() } },
                                                                                      'member',
                                                                                      { popeq: { cached: true,
                                                                                                 result: undefined } }]).value)
                           ?
                           _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                     partialProofData,
                                                                                     [
                                                                                      { dup: { n: 0 } },
                                                                                      { idx: { cached: false,
                                                                                               pushPath: false,
                                                                                               path: [
                                                                                                      { tag: 'value',
                                                                                                        value: { value: _descriptor_13.toValue(2n),
                                                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                                                      { idx: { cached: false,
                                                                                               pushPath: false,
                                                                                               path: [
                                                                                                      { tag: 'value',
                                                                                                        value: { value: _descriptor_0.toValue(borrower_id_0),
                                                                                                                 alignment: _descriptor_0.alignment() } }] } },
                                                                                      { popeq: { cached: false,
                                                                                                 result: undefined } }]).value)
                           :
                           this._get_genesis_root_0();
    const new_root_0 = this._update_portfolio_root_0(current_root_0,
                                                     commitment_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_13.toValue(2n),
                                                                  alignment: _descriptor_13.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(borrower_id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new_root_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _prove_exposure_within_limit_0(context,
                                 partialProofData,
                                 max_lender_count_0,
                                 max_total_exposure_0)
  {
    const borrower_id_0 = this._get_borrower_id_0(context, partialProofData);
    const loans_0 = this._get_loan_records_0(context, partialProofData);
    const genesis_root_0 = this._get_genesis_root_0();
    const initial_summary_0 = { running_root: genesis_root_0,
                                active_count: 0n,
                                total_exposure: 0n };
    const summary_0 = this._folder_0(context,
                                     partialProofData,
                                     ((context, partialProofData, acc_0, item_0) =>
                                      {
                                        return this._process_portfolio_item_0(context,
                                                                              partialProofData,
                                                                              acc_0,
                                                                              item_0,
                                                                              borrower_id_0);
                                      }),
                                     initial_summary_0,
                                     loans_0);
    if (_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                  partialProofData,
                                                                  [
                                                                   { dup: { n: 0 } },
                                                                   { idx: { cached: false,
                                                                            pushPath: false,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_13.toValue(2n),
                                                                                              alignment: _descriptor_13.alignment() } }] } },
                                                                   { push: { storage: false,
                                                                             value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(borrower_id_0),
                                                                                                                          alignment: _descriptor_0.alignment() }).encode() } },
                                                                   'member',
                                                                   { popeq: { cached: true,
                                                                              result: undefined } }]).value))
    {
      const on_chain_root_0 = _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                        partialProofData,
                                                                                        [
                                                                                         { dup: { n: 0 } },
                                                                                         { idx: { cached: false,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_13.toValue(2n),
                                                                                                                    alignment: _descriptor_13.alignment() } }] } },
                                                                                         { idx: { cached: false,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_0.toValue(borrower_id_0),
                                                                                                                    alignment: _descriptor_0.alignment() } }] } },
                                                                                         { popeq: { cached: false,
                                                                                                    result: undefined } }]).value);
      __compactRuntime.assert(this._equal_0(summary_0.running_root,
                                            on_chain_root_0),
                              'Borrower witness omitted registered loans or does not match portfolio root');
    } else {
      __compactRuntime.assert(this._equal_1(summary_0.running_root,
                                            genesis_root_0),
                              'Borrower has no on-chain loans but non-empty witness was supplied');
    }
    let t_0;
    __compactRuntime.assert((t_0 = summary_0.active_count,
                             t_0 <= max_lender_count_0),
                            'Active loan count exceeds allowed limit');
    let t_1;
    __compactRuntime.assert((t_1 = summary_0.total_exposure,
                             t_1 <= max_total_exposure_0),
                            'Total credit exposure exceeds allowed regulatory cap');
    return [];
  }
  _close_loan_0(context, partialProofData, loan_commitment_0, nonce_0) {
    __compactRuntime.assert(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_13.toValue(0n),
                                                                                                                  alignment: _descriptor_13.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(loan_commitment_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Loan commitment does not exist');
    const nul_0 = this._compute_nullifier_0(loan_commitment_0, nonce_0);
    __compactRuntime.assert(!_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_13.toValue(1n),
                                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(nul_0),
                                                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Loan already closed/nullified');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_13.toValue(1n),
                                                                  alignment: _descriptor_13.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(nul_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _folder_0(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(context, partialProofData, x, a0[i]); }
    return x;
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    loan_commitments: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(0n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(0n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'exposure-proof.compact line 29 char 1',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(0n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map((elem) => _descriptor_0.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    nullifiers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(1n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(1n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'exposure-proof.compact line 32 char 1',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(1n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1];
        return self_0.asMap().keys().map((elem) => _descriptor_0.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    borrower_portfolios: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(2n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(2n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'exposure-proof.compact line 35 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(2n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'exposure-proof.compact line 35 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_13.toValue(2n),
                                                                                                     alignment: _descriptor_13.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  get_borrower_id: (...args) => undefined,
  get_loan_records: (...args) => undefined
});
export const pureCircuits = {
  get_genesis_root: (...args_0) => {
    if (args_0.length !== 0) {
      throw new __compactRuntime.CompactError(`get_genesis_root: expected 0 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    return _dummyContract._get_genesis_root_0();
  },
  compute_loan_commitment: (...args_0) => {
    if (args_0.length !== 4) {
      throw new __compactRuntime.CompactError(`compute_loan_commitment: expected 4 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const borrower_id_0 = args_0[0];
    const lender_id_0 = args_0[1];
    const amount_0 = args_0[2];
    const nonce_0 = args_0[3];
    if (!(borrower_id_0.buffer instanceof ArrayBuffer && borrower_id_0.BYTES_PER_ELEMENT === 1 && borrower_id_0.length === 32)) {
      __compactRuntime.typeError('compute_loan_commitment',
                                 'argument 1',
                                 'exposure-proof.compact line 47 char 1',
                                 'Bytes<32>',
                                 borrower_id_0)
    }
    if (!(lender_id_0.buffer instanceof ArrayBuffer && lender_id_0.BYTES_PER_ELEMENT === 1 && lender_id_0.length === 32)) {
      __compactRuntime.typeError('compute_loan_commitment',
                                 'argument 2',
                                 'exposure-proof.compact line 47 char 1',
                                 'Bytes<32>',
                                 lender_id_0)
    }
    if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('compute_loan_commitment',
                                 'argument 3',
                                 'exposure-proof.compact line 47 char 1',
                                 'Uint<0..18446744073709551616>',
                                 amount_0)
    }
    if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
      __compactRuntime.typeError('compute_loan_commitment',
                                 'argument 4',
                                 'exposure-proof.compact line 47 char 1',
                                 'Bytes<32>',
                                 nonce_0)
    }
    return _dummyContract._compute_loan_commitment_0(borrower_id_0,
                                                     lender_id_0,
                                                     amount_0,
                                                     nonce_0);
  },
  compute_nullifier: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`compute_nullifier: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const commitment_0 = args_0[0];
    const nonce_0 = args_0[1];
    if (!(commitment_0.buffer instanceof ArrayBuffer && commitment_0.BYTES_PER_ELEMENT === 1 && commitment_0.length === 32)) {
      __compactRuntime.typeError('compute_nullifier',
                                 'argument 1',
                                 'exposure-proof.compact line 62 char 1',
                                 'Bytes<32>',
                                 commitment_0)
    }
    if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
      __compactRuntime.typeError('compute_nullifier',
                                 'argument 2',
                                 'exposure-proof.compact line 62 char 1',
                                 'Bytes<32>',
                                 nonce_0)
    }
    return _dummyContract._compute_nullifier_0(commitment_0, nonce_0);
  },
  update_portfolio_root: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`update_portfolio_root: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const current_root_0 = args_0[0];
    const commitment_0 = args_0[1];
    if (!(current_root_0.buffer instanceof ArrayBuffer && current_root_0.BYTES_PER_ELEMENT === 1 && current_root_0.length === 32)) {
      __compactRuntime.typeError('update_portfolio_root',
                                 'argument 1',
                                 'exposure-proof.compact line 73 char 1',
                                 'Bytes<32>',
                                 current_root_0)
    }
    if (!(commitment_0.buffer instanceof ArrayBuffer && commitment_0.BYTES_PER_ELEMENT === 1 && commitment_0.length === 32)) {
      __compactRuntime.typeError('update_portfolio_root',
                                 'argument 2',
                                 'exposure-proof.compact line 73 char 1',
                                 'Bytes<32>',
                                 commitment_0)
    }
    return _dummyContract._update_portfolio_root_0(current_root_0, commitment_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
