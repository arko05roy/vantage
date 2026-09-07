# Vantage — Privacy-Preserving Credit Exposure Verification on Midnight
### Product Requirements Document & Technical Blueprint — v2
### AKINDO "Build Privacy-First Apps on Midnight" WaveHack — Aug 27 – Nov 27, 2026

Confirmed product name: **Vantage**. Logo is being redesigned separately (v1 automotive-badge mark flagged as off-tone for a fintech/regulatory product — see design notes below) — treat the logo as pending, not final, when building.

---

## 0. How to use this document (read this first — for the AI build agent)

This document is the single source of truth for building Vantage. It is written so an AI coding agent (Antigravity) can pick up any section and know exactly what to build, why it exists, and how "done" is defined — without guessing.

Rules for the agent while building:
1. **Never invent scope.** If a feature isn't in the Wave you're currently building, don't build it, even if it seems easy or related. Out-of-scope items are listed explicitly per Wave — treat that list as a hard boundary.
2. **Privacy is the point, not a feature flag.** Every design decision should ask "does this leak data that doesn't need to be public?" before "does this work?" If a shortcut would work but leaks private data onto the public ledger, it is wrong, even if faster to build.
3. **Compact syntax evolves.** Do not assume the exact Compact API calls in this document are final syntax — treat them as the *intended logic*, and verify current syntax against https://docs.midnight.network/ before implementing. If docs and this PRD conflict on syntax, docs win; if they conflict on product logic, this PRD wins and flag it to Abhi.
4. **Every Wave must compile.** A submission with a Compact contract that doesn't compile is auto-disqualified, no partial credit. Treat "does it compile" as a blocking CI gate, checked before any other work continues.
5. **Write code like it will be read by a stranger, not just run by a judge.** See Section 11 for the actual standard — it is not optional polish, it is directly scored (Backend Engineering: Code Quality & Structure, 5 pts; Documentation in Codebase, 5 pts).
6. **Stop and ask when a decision changes user-facing behavior or data exposure**, not for internal implementation details (variable names, file layout). Abhi is the product owner; the agent is the engineering team, not the decision-maker on scope or privacy trade-offs.

---

## 1. Executive Summary

India's microfinance sector has a well-documented, currently unresolved over-lending problem: borrowers take loans from multiple lenders who cannot see each other's exposure, because the existing fix — reporting every loan to a centralized Credit Information Company — requires every lender and bureau to hold full financial and identity data on the country's most financially vulnerable borrowers. That centralization is itself a privacy and data-breach liability, and it still misses informal lenders entirely.

**Vantage lets a borrower cryptographically prove "I am within my regulatory borrowing limit" to a new lender — without revealing which other lenders they have, how much they owe each one, or any other personal financial detail.** The new lender gets a yes/no answer they can trust; the borrower's financial history stays theirs.

This is a direct, narrow application of Midnight's core capability (prove a fact, not the data behind it) to a real, current, named problem with an identifiable first customer (NBFC-MFIs) and a live regulatory tailwind (RBI's own multiple-lender caps).

---

## 2. Problem & Why Now

- Borrowers who take small loans from several microfinance lenders in parallel — a common, well-documented pattern — often exceed what they can realistically repay, because no single lender can see the borrower's total exposure across others.
- RBI has directly regulated this: rules exist capping how many microfinance lenders can serve the same borrower at once and how much total exposure is allowed. Enforcement today depends on lenders uploading borrower data to centralized Credit Information Companies (CICs).
- That model has two structural weaknesses: (1) it creates a large, centralized store of financial and identity data on low-income borrowers — a serious privacy and breach risk for the people least able to absorb the fallout of a leak; and (2) informal, unregistered lenders are invisible to it entirely, so the picture is always incomplete.
- The industry is under active regulatory pressure right now (2025–2026) to fix over-lending without simply expanding surveillance. That's the opening: a system that enforces the exposure cap *without* creating a new honeypot.

---

## 3. Users & Customer Segments

| Persona | Who they are | What they want from Vantage |
|---|---|---|
| **Lending Institution (Issuer)** | NBFC-MFI loan officer / system, e.g. a microfinance lender | Register a disbursed loan against a borrower's private exposure ledger, without exposing that data to competitors |
| **Borrower** | A microfinance borrower with an existing loan or loans | Prove they're within their allowed borrowing limit to a *new* lender, without that lender (or anyone) learning who their current lenders are or how much they owe |
| **Verifying Lender** | A different NBFC-MFI considering a new loan to the same borrower | Get a trustworthy yes/no on "is this borrower within their exposure cap" before disbursing, with cryptographic assurance, not a self-declaration |

Wave 1 targets a **single borrower flow end-to-end**, with lenders represented as mocked/seeded institutions — see Section 5.

---

## 4. Product Principles (non-negotiable, apply to every Wave)

1. **Nothing sensitive touches public state.** No loan amount, no lender identity, no borrower PII is ever written to a publicly readable field. Only commitments (hashes) and proof outputs are public.
2. **The borrower controls proof generation.** The borrower's device/client generates the ZK proof from their own private data — the system should never require sending raw private data to a server to generate a proof on the borrower's behalf, even "just for the demo," because that defeats the entire premise.
3. **One feature, done completely, beats three features half-built.** This is explicit buildathon guidance from Midnight's own judges and it matches the rubric: Backend Engineering rewards "functional depth... real logic... not mockups," not breadth.
4. **Every Wave must demonstrably improve on the last**, not just restate it — resubmissions that don't show meaningful new progress are explicitly ineligible per the Official Rules.

---

## 5. Scope Across Waves

### Wave 1 — Aug 27 – Sep 16, 2026 (build) — "Prove the core primitive works"

**Goal:** one compiling Compact contract implementing the exposure-cap proof, a minimal working frontend that takes it end-to-end, and tests. This is the technical gate — nothing else matters if this doesn't compile and run.

In scope:
- Compact contract: register a loan commitment for a borrower (private state), track count + total exposure privately, expose a circuit that proves `active_loan_count <= N AND total_exposure <= LIMIT` without revealing the underlying values.
- A simple identity representation for the borrower (a private key / commitment-based ID — **not** real Aadhaar or any real government ID integration in Wave 1).
- Mocked lender registration (2–3 seeded "lender" entities in the UI, no real institutional onboarding).
- Frontend, 3 screens (see Section 9): Issuer registers a loan → Borrower generates a proof → Verifier checks the proof.
- Unit tests for the contract's core logic (threshold pass/fail cases, edge cases at exactly the limit).
- README covering setup, architecture, and how a judge can run/test it locally.

Explicitly out of scope for Wave 1 (do not build, even partially):
- Real lender onboarding, auth, or institutional accounts.
- Any real financial transaction or money movement.
- Mobile app — web only.
- Real-world identity verification (Aadhaar, KYC providers, etc.).
- Multi-jurisdiction or multi-currency support.
- Anything related to Scholar Quest or LiteCrave — this project is fully standalone.

### Wave 2 — Sep 27 – Oct 17, 2026 (build) — "Make it usable by more than one borrower and show real integration depth"

Planned direction (to be refined after Wave 1 judge feedback, per the program's own design — teams are expected to absorb feedback between Waves):
- Multiple concurrent borrowers and lenders with realistic seeded data, not just one demo path.
- Selective disclosure extension: allow a borrower to optionally reveal *more* than pass/fail in specific cases (e.g., an audit/dispute flow), demonstrating deeper use of Midnight's private/public state model — this maps directly to "Integration & Decentralization" and "Product Fit with Network" rubric lines.
- Basic persistence/indexing layer so lenders can query proof history without re-deriving state each time.
- Expanded test coverage: integration tests across the full loan lifecycle (issue → repay → close), not just the threshold circuit.

### Wave 3 — Oct 27 – Nov 16, 2026 (build) — "Make the business case real"

Planned direction:
- A believable go-to-market narrative made concrete: e.g. a pilot-partner conversation started with a real (even small) NBFC-MFI, or a clear integration path with an existing SRO/CIC-adjacent workflow.
- Polish pass on UI/UX and demo flow for judged presentation.
- Documentation aimed at a non-technical reader (regulators, MFI ops teams) explaining what problem this solves and why it's safe — this is what "Educational Clarity" and "Messaging Clarity" score.

*(Wave 2 and 3 scope will be revisited after Wave 1 feedback — do not over-plan these yet; the program explicitly rewards responding to judge feedback over executing a rigid pre-written roadmap.)*

---

## 6. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
│  ┌─────────────┐   ┌─────────────────┐   ┌───────────────────┐  │
│  │ Issuer View │   │  Borrower View   │   │  Verifier View    │  │
│  │ (register   │   │ (generate proof  │   │ (submit + check   │  │
│  │  loan)      │   │  client-side)    │   │  proof)           │  │
│  └──────┬──────┘   └────────┬─────────┘   └─────────┬─────────┘  │
└─────────┼───────────────────┼───────────────────────┼────────────┘
          │                   │                       │
          ▼                   ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Midnight Wallet / dApp Connector (Lace)        │
│           handles keys, signs transactions, holds private state  │
└─────────────────────────────────────────────────────────────────┘
          │                   │                       │
          ▼                   ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Compact Smart Contract                       │
│  ┌───────────────────────┐        ┌───────────────────────────┐ │
│  │   PUBLIC LEDGER STATE  │        │   PRIVATE STATE (witness)  │ │
│  │  - loan commitments    │        │  - actual loan amounts     │ │
│  │    (hashes only)       │        │  - lender identities        │ │
│  │  - proof verification  │◄───────┤  - borrower's real exposure│ │
│  │    results (pass/fail) │  ZK    │    count/total              │ │
│  │  - nullifiers (prevent │  proof │                             │ │
│  │    double-counting)    │        │                             │ │
│  └───────────────────────┘        └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**

| Layer | Tech | Responsibility |
|---|---|---|
| Frontend | Next.js + Tailwind (matches Abhi's existing stack) | 3 role-based views, wallet connection, proof-request UX |
| Wallet | Lace (Midnight-compatible) | Key management, transaction signing, holds the borrower's private witness data locally |
| Contract | Compact → compiles to JS + TypeScript bindings | Public commitments, nullifiers, and the exposure-cap circuit |
| Off-chain client | **Node.js 22+ LTS** | Not a stack choice — this is Midnight's own required runtime. Compiling a contract produces JS/TS output, and `midnight-js` (the SDK for deploying, calling, and reading contract state) is a Node library. Any backend/indexer work here is Node by necessity, which happens to also match what Abhi already knows |
| Indexer (Wave 2+) | Node.js service using `@midnight-ntwrk/midnight-js-indexer-public-data-provider` | Lets a verifier look up "has this borrower got a valid recent proof" without redoing ZK computation each time |

**Why the dual-ledger model matters here specifically:** the *count* and *total exposure* are values only the borrower's own client should ever compute from their own private loan records. The chain only ever sees a commitment (so a loan can't be silently deleted or a duplicate double-counted via nullifiers) and a proof result (true/false against the threshold). This is not a cosmetic use of privacy — the product breaks if this isn't done correctly, which is exactly what "Product Fit with Network: deeply aligned" (5 pts) is scoring for.

---

## 7. Compact Contract Design (Wave 1)

### 7.1 Entities

- **Borrower identity commitment** — a hash derived from a borrower-held secret (not a real ID). Used to link private loan records to a public commitment without revealing the borrower's identity.
- **Loan commitment** — `hash(borrower_id_commitment, lender_id, amount, loan_nonce)`. Published on loan issuance. The nonce prevents two identical loans from colliding.
- **Nullifier** — derived value published when a loan is closed/repaid, so it can't be counted twice or reused.

### 7.2 Public ledger state

- `loan_commitments: Set<Hash>` — append-only set of active loan commitments.
- `nullifiers: Set<Hash>` — spent/closed loan markers.
- `proof_log` (optional, Wave 1 nice-to-have) — timestamped record that a valid exposure proof was checked (no values, just "a check happened and passed/failed").

### 7.3 Private witness state (borrower-side only, never published)

- List of the borrower's actual loans: `{lender_id, amount, nonce, status}`.
- Derived values: `active_loan_count`, `total_exposure`.

### 7.4 Circuits

1. `register_loan(borrower_id_commitment, lender_id, amount, nonce)` — issuer-side. Writes a new loan commitment to public state; borrower's client updates their own private witness set (this happens off the borrower's own record, not the lender's — see Section 8 for how the borrower learns about a loan issued to them in Wave 1's simplified model).
2. `prove_exposure_within_limit(threshold_count, threshold_amount)` — borrower-side. Takes the borrower's private loan list as witness input, outputs a boolean proof: `count(active loans) <= threshold_count AND sum(active loan amounts) <= threshold_amount`, without revealing the list itself.
3. `close_loan(loan_commitment, nonce)` — issuer-side, marks a loan repaid/closed via nullifier, so it drops out of future exposure calculations.

### 7.5 Threshold values

Use RBI's own historical structure as the default (configurable, not hardcoded as a business rule): max concurrent lenders and a total exposure cap. Represent these as contract parameters, not magic numbers, so Wave 2/3 can adjust without a redeploy-from-scratch.

*(Exact Compact syntax for state declarations, circuits, and witness handling should be pulled from the current Midnight docs and the `bboard` example contract referenced in the buildathon prep materials — use that as the syntax template, not this PRD.)*

### 7.6 Toolchain pinning — do this on day one, before writing any contract code

Compact's compiler is versioned tightly to a language pragma, and a mismatch is a hard compile failure, not a warning — this is very plausibly how a team fails the "must have one compiling Compact contract" gate and gets disqualified before judging even starts. A working reference (`mashharuki/midnight-rps-sample-app`, listed as a program resource) pins these exact versions as of its build:

```
Docker version 27.4.0
compact 0.2.0        # wrapper CLI (manages compactc versions)
compactc 0.30.0      # actual compiler — contract fails to compile on newer versions without updating pragma
bun 1.3.13
node 23.3.0
```

Do not assume these exact numbers are still current by the time Wave 1 starts — check the Midnight compatibility matrix (linked from the API reference docs) first. The instruction that matters regardless of the exact numbers: **pin every version explicitly in the repo** (`.nvmrc`, a documented `compactc` version, lockfiles committed), verify a clean `git clone` + fresh install actually compiles before Wave 1 week 1 ends, and treat any pragma/version mismatch as a stop-everything issue, not something to work around. This is also part of what "Demo Readiness" (5 pts) is scoring — a judge who can't get your repo to build can't award points for the parts that do work.

Faucets (free, no cost): `faucet.preview.midnight.network` and `faucet.preprod.midnight.network`.

---

## 8. Off-chain / Backend Components (Wave 1: minimal)

Wave 1 should avoid a heavy backend — most "backend" logic in Wave 1 is really the borrower's own wallet-held private state. The only backend surface needed:
- A thin seed/demo service that lets the Issuer view register a small number of mock loans quickly during a live demo, so judges aren't hand-typing test data.
- No real database required for Wave 1; Wave 2 introduces the indexer.

---

## 9. Frontend Application — Full UI/UX Specification

This section should be treated as build-ready: every screen, its components, its states, and its edge cases. If Antigravity encounters a UI decision not covered here, that's a gap to flag to Abhi, not a gap to improvise silently.

### 9.0 Global shell (applies to all screens)

- **Role switcher** — a persistent top-level tab/segmented control: `Issuer | Borrower | Verifier`. Always visible, always shows which role is active. This is not just navigation — it's part of the pitch (see 9.5), so it should be visually prominent, not tucked in a menu.
- **Wallet connection state** — a persistent header element showing: not connected / connecting / connected (short address, e.g. `0x4f...9a2`) / wrong network. Every screen's primary action is disabled with an explanatory tooltip if the wallet isn't connected — never a silent failure on click.
- **Network indicator** — small, always-visible badge showing which network is active (e.g. "Preview Testnet") so no one mistakes a demo for mainnet.
- **Toast/notification system** — one consistent pattern for success, error, and pending-transaction states, used identically across all three role views (see 9.6).
- **"How this works" panel** — collapsed by default, available from the global header, not per-screen. Contains the plain-language explanation of commitments/nullifiers/proofs for anyone (including a judge) who wants the detail without it cluttering the primary flow.

### 9.1 Screen: Issuer View — "Register a Loan"

**Purpose:** let a (mock) lender record that they've disbursed a loan, without exposing amount or borrower identity publicly.

**Components:**
- Lender selector — dropdown of seeded mock lenders (e.g. "Lender A", "Lender B", "Lender C"), not a free-text field, to keep Wave 1 scope tight.
- Borrower ID input — a field for the borrower's identity commitment (in Wave 1, a simple derived ID, not a real name/Aadhaar — label it clearly as such, e.g. "Borrower reference ID").
- Loan amount input — numeric, with currency label (₹), inline validation (positive number, reasonable max for demo realism, e.g. ₹1,00,000 cap with a helper note).
- "Register Loan" primary button.
- Result panel (appears after submission): shows the **public commitment hash** that was written on-chain, a link/reference to view it on the testnet explorer if available, and explicit text confirming "amount and borrower identity were not published — only this commitment was."
- Loan history table (below the form) — every loan this mock issuer has registered in the current session: lender, masked borrower ref, masked amount (e.g. "₹••,000" partially revealed for demo legibility, or fully shown since this is the issuer's own view of their own issued loans — issuer can see what *they* issued, just not other lenders' loans), status (active/closed), commitment hash, a "Close Loan" action per row.

**States:**
- Empty state (no loans registered yet in session) — a short prompt, not a blank void.
- Loading (transaction submitting/proving) — explicit progress indicator, since proof generation is not instant; never let the button look clickable-but-dead during this.
- Success — result panel populates, history table updates, toast confirms.
- Error (e.g. proof server unreachable, wallet rejected, insufficient testnet funds) — specific, human-readable message per failure type, not a generic "something went wrong."

### 9.2 Screen: Borrower View — "Prove Your Exposure"

**Purpose:** let the borrower see their own real loan data (correct — privacy is from others, not from themselves) and generate a proof against a threshold.

**Components:**
- "My Active Loans" list — for the connected borrower identity: lender name, amount, date issued, status. This is the one place in the whole app raw values are shown, and it should look deliberately different (e.g. a "private — only you can see this" badge) so the contrast with the Verifier screen's blindness is visually obvious.
- Summary stat row — computed client-side from the list above: "Active loans: 2 / Total exposure: ₹65,000" — makes concrete what the proof will be checking.
- Threshold selector — for Wave 1, likely a fixed/preset threshold (e.g. "prove ≤ 2 lenders and ≤ ₹1,00,000", matching Section 7.5's configurable contract parameter) rather than a free-form input, to keep the circuit's test surface small; expose it as a labeled, visible value, not a hidden constant.
- "Generate Proof" primary button.
- Proof result panel — shows pass/fail clearly (large, unambiguous — green check / red cross, not just text color), a proof reference ID the borrower can hand to a verifier, and a copy-to-clipboard action for that reference.
- Proof history — past proofs generated this session, with timestamp and pass/fail, so a borrower (or judge) can see this isn't a one-shot demo trick.

**States:**
- No loans yet — empty state with a hint to go register a loan first via the Issuer view (cross-links between the three role views for demo flow, not production user-switching).
- Proof generating — this is the slowest operation in the whole app (ZK proof generation takes real time); needs a real progress indicator with a short explanatory line ("Generating a zero-knowledge proof — this runs entirely on your device and doesn't send your loan data anywhere"), not a spinner with no context.
- Proof passed / failed — both are first-class, clearly designed states, not "failed" being an afterthought error style. Failing the threshold is a valid, expected outcome, not a bug.
- Error (proof server not running locally, wallet disconnected mid-generation) — specific recovery guidance ("Start your local proof server and try again"), since this is the most likely real friction point in a live demo.

### 9.3 Screen: Verifier View — "Check a Proof"

**Purpose:** let a new (mock) lender check a borrower's exposure proof and get a trustworthy answer with zero access to underlying data. This is the screen that has to sell the pitch on sight.

**Components:**
- Proof reference input — paste/enter the reference ID the borrower shared.
- "Verify" primary button.
- Result panel — large, unambiguous pass/fail, plus explicit metadata that IS safe to show: which threshold was checked against, when the proof was generated, whether it's still valid/not expired. Deliberately absent: any field for amount, lender names, or loan count — the *absence* should be visually intentional (e.g. a small note: "Loan details are never shared with verifiers — only this result"), not just an omission a user might assume is a bug.
- Verification history — past checks this verifier has run, for demo narrative continuity.

**States:**
- No proof entered yet — disabled button state with a placeholder hint.
- Verifying (checking on-chain) — brief loading state, should be fast since this doesn't involve local proof generation.
- Valid / Invalid / Expired — three distinct outcomes, three distinct visual treatments, not just binary pass/fail (an expired proof is a different situation than a failed threshold check, and the UI should say so).
- Error (reference not found, malformed input) — inline validation before submission where possible, not just a post-submit error.

### 9.4 Cross-cutting components (shared across screens)

- **Button states:** default / hover / disabled / loading — every primary action needs all four defined, not just default.
- **Form validation:** inline, on-blur where possible, not only on-submit — a judge clicking through quickly shouldn't hit a wall of errors after filling an entire form.
- **Responsive behavior:** Wave 1 is web-only (per scope), but should be usable on a laptop at typical demo-projector resolution — don't assume a huge monitor. Mobile responsiveness is explicitly out of scope for Wave 1; don't spend build time on it.
- **Accessibility baseline:** sufficient color contrast (especially for the pass/fail states — don't rely on color alone, pair with icon + text), keyboard-navigable forms, labeled inputs (not placeholder-only labels that disappear on focus).

### 9.5 UX principles

- **Make the privacy guarantee visible, not just true.** A judge should be able to look at the Verifier screen and immediately see "I got an answer, I did not get the data" — worth real points on both Product Leadership (presentation clarity) and Communication (messaging clarity), so the UI itself should communicate the pitch, not just execute it.
- **No dead ends.** Every screen should make clear what to do next (issue a loan → then go prove exposure → then go verify) — a first-time user, including a judge who's never seen the product, should complete the full loop without narration.
- **Plain language over jargon.** "Prove you're within your borrowing limit," not "Generate zk-SNARK." Save the cryptographic vocabulary for the collapsible "how this works" panel (9.0), not the primary flow.
- **Failure is not shameful.** A failed proof or an invalid verification is a legitimate, expected product outcome — design those states with the same care as success states, since a demo that only ever shows the happy path looks unfinished, not polished.

### 9.6 Visual direction

- Clean, functional, credible-fintech aesthetic — not playful/gamey. This is pitched at NBFC-MFI ops teams and regulators as real infra, and the visual tone should match that (closer to a banking dashboard than a consumer app).
- Tailwind, consistent with Abhi's existing stack. A restrained palette (avoid default-purple-gradient "generic Web3 hackathon" look) — one accent color, neutral base, clear typographic hierarchy. Scored directly under Frontend & UX: Design Cohesion.
- Each of the 3 role views should be visually distinct enough (via the role switcher in 9.0) that a judge never wonders "which persona am I looking at right now."
- One consistent toast/notification style, one consistent loading-state style, one consistent empty-state style — reused across all three screens rather than each screen inventing its own pattern. This is what "Design Cohesion" is actually scoring.

---

## 10. Data Model Summary

| Entity | Public? | Fields |
|---|---|---|
| Loan commitment | Public (hash only) | `hash`, `timestamp` |
| Nullifier | Public (hash only) | `hash`, `timestamp` |
| Borrower's private loan record | Private (borrower-held) | `lender_id`, `amount`, `nonce`, `status`, `issued_at` |
| Proof result | Public | `pass/fail`, `threshold_used`, `timestamp` — never the underlying count/amount |

---

## 11. Engineering & Code Quality Standards (explicit instructions to the AI IDE)

This section exists because it is directly and separately scored (Backend Engineering: Code Quality & Structure 5pts, Documentation in Codebase 5pts; QA: Bug Resolution & Debugging 5pts, Version Control Use 5pts) — treat it as a spec, not a suggestion.

1. **Modular by responsibility, not by file size.** Contract logic, proof-generation helpers, wallet-connection logic, and UI components live in clearly separated modules/folders — no God-files.
2. **Every function has a one-line purpose comment** stating what it does and why, especially anything touching private vs. public state — the "why this is private" reasoning should be visible in-line, not just in this PRD.
3. **Naming says what things are.** No `data`, `temp`, `handleClick2`. Names should make the public/private distinction obvious at a glance (e.g. prefix or clearly named types like `PublicLoanCommitment` vs `PrivateLoanRecord`).
4. **No hardcoded thresholds or secrets.** Exposure limits, mock lender lists, and any config values live in a single config file, not scattered through the codebase.
5. **Commit hygiene:** small, scoped commits with descriptive messages (`feat:`, `fix:`, `test:` prefixes are fine) — this is literally scored (Version Control Use, 5pts). No single giant "final commit" dump.
6. **Tests are not optional filler.** Each circuit needs at least: a passing case, a failing case, and an edge case exactly at the threshold boundary. Tests should be runnable with a single documented command.
7. **README must let a judge run the project with zero prior context** — setup steps, how to compile the contract, how to run tests, how to run the demo flow, and a short explanation of what's public vs private and why. This is scored directly (Documentation in Codebase, 5pts; Demo Readiness, 5pts).
8. **Error handling is user-facing, not just console logs.** If a proof generation fails or a threshold isn't met, the UI should say so clearly — silent failures lose points under both QA and UX rubric lines.
9. **No secrets, seed phrases, or real personal data ever committed to the repo** — mock data only, clearly labeled as mock.

---

## 12. Proposed Repository Structure

```
vantage/
├── contracts/              # Compact contract(s)
│   ├── exposure-proof.compact
│   └── tests/
├── frontend/                # Next.js app
│   ├── app/
│   │   ├── issuer/
│   │   ├── borrower/
│   │   └── verifier/
│   ├── components/
│   ├── lib/                 # wallet connection, proof helpers
│   └── config/               # thresholds, mock lender list
├── docs/
│   ├── ARCHITECTURE.md       # can mirror Section 6-7 of this PRD
│   └── DEMO_SCRIPT.md        # step-by-step for judges
├── README.md
└── LICENSE                   # Apache 2.0 — required by contest rules
```

---

## 12A. Deployment & Hosting Plan (free-tier, student budget)

Nothing here should cost money for Wave 1–3. Four separate pieces, four separate hosting decisions:

| Piece | Where | Why | Cost |
|---|---|---|---|
| **Frontend (Next.js)** | **Vercel (Hobby tier)** | Built for Next.js specifically, generous free request limits, zero-config Git deploys | Free |
| **Chain (node + indexer)** | **Midnight's public Preview testnet** | Midnight's core engineering team hosts and maintains this — you never deploy or pay for a node/indexer yourself, you just point your app at their public endpoint and fund your wallet from the free testnet faucet | Free |
| **Proof server** | **Local (Docker) for demo day; see note below** | The proof server needs the borrower's private data as direct input — running it on someone else's remote server defeats the privacy guarantee, so this isn't a "just deploy it" component the way a normal API is | Free (runs on your own machine) |
| **Backend/indexer service (Wave 2+ only)** | **Render (free web service)** | Real permanent free tier for personal projects, no credit card required. Caveat: free services sleep after 15 minutes idle and take ~30-60 seconds to wake up — fine for a judge poking around, mildly annoying if not anticipated | Free |

**A specific note on the proof server, because it's the one piece that doesn't map cleanly to "just deploy it somewhere free":** proof generation has to happen somewhere that can see the borrower's private data, which by design should never be a third-party server. For Wave 1's demo, the practical options are: (a) run the proof server locally on your laptop via Docker during development and during the live judged demo — most reliable, zero cost, zero third-party trust issue; or (b) if you want the deployed Vercel app to be usable by someone other than you between demos, run a proof server on a small Render/Docker instance *for demo purposes only*, with a clear note in the README that this is a demo simplification and a real deployment would run proof generation client-side or on user-controlled infrastructure. Don't present (b) as if it were the real production architecture — that would undercut the whole privacy pitch in front of judges who know the architecture.

---

## 12B. AI Agent Resources — feed these to Antigravity directly

Two resources exist specifically so an AI coding agent doesn't hallucinate Compact syntax:

1. **`https://docs.midnight.network/llms.txt`** — this is real and current: an indexed map of the entire Midnight documentation site (API references for `compact-runtime`, `midnight-js`, `ledger`, `onchain-runtime`, the indexer GraphQL schema, error references, and more), formatted for AI consumption. If Antigravity supports pointing at an `llms.txt` as a documentation source, give it this URL directly — it's the single best way to keep the agent grounded in real, current APIs instead of guessing. If it doesn't support that directly, you can fetch specific pages linked from it as needed.
2. **Midnight Expert** — Midnight publishes a suite of Claude Code plugins specifically for writing and reviewing Compact and verifying generated code against the real compiler (mentioned in the docs' AI-integration section). Worth checking whether Antigravity can use or approximate this workflow — the core idea (verify against the real compiler, don't trust the model's memory of Compact syntax) is the right instinct regardless of which tool enforces it.

---

## 12C. Stitch Design Import — prompt for Antigravity, plus a mandatory fix pass

The UI designs already exist in Google Stitch (6 screens: 3 desktop + 3 mobile, covering Issuer/Borrower/Verifier views). Antigravity should pull these via its Stitch MCP connector using the prompt below verbatim, **then apply the fix checklist that follows before treating any screen as final.** Do not implement the Stitch output as-is — it was generated before several product-logic corrections below were identified.

**Stitch fetch prompt (give this to Antigravity):**

```
## Stitch Instructions
Get the images and code for the following Stitch project's screens:
## Project
Title: ZK Private Loan Manager
ID: 13655945852934120623
## Screens:
1. Issuer View - Register Loan
    ID: 893375f75dff4d729b4f6e009aa6f2bd
2. Borrower View - Prove Exposure
    ID: 192ac80fb00f461d9dab6bd9f968b678
3. Borrower View - Prove Exposure (Mobile)
    ID: 520bc085057e48fe8756078d6c84a2d6
4. Verifier View - Check Proof (Mobile)
    ID: c8d070c416c34c14988336d6c3c2dc28
5. Issuer View - Register Loan (Mobile)
    ID: f94190e8b9c74c7b9095d847fd5be5e9
6. Verifier View - Check Proof
    ID: 0c3bbc1b1e214863b440d92531c3af75
Use a utility like `curl -L` to download the hosted URLs.
```

**Mandatory fix checklist — apply to the pulled designs before building against them, in order of severity:**

1. **[Critical — privacy leak] Issuer View "Recent Registrations" table currently shows OTHER lenders' loans** (lender name, borrower reference, full amount) to whichever issuer is logged in. This directly contradicts the product's core premise (Section 4, Principle 1 — nothing sensitive touches public state / no other lender should ever see another lender's loan amounts or borrower references). Fix: scope this table to the currently-connected issuer's own registrations only. Any activity feed showing other lenders' actions must show commitment hashes and status only — never amount, never borrower reference.
2. **[High — scope mismatch] Verifier View "Verification History" lists proof types not in Wave 1 scope** ("Credit Score > 700," "Identity Verification"). Wave 1 builds exactly one proof type: the exposure-cap proof (Section 7.4, `prove_exposure_within_limit`). Remove every other proof type from the UI — showing proof types that don't exist yet reads as overclaiming to a judge testing the demo, which is worse than not showing them at all.
3. **[High — data inconsistency] Currency and threshold logic don't match across screens.** Borrower View uses ₹ and a "≤ ₹1,00,000" framing; Verifier View mock data uses "$50,000 USD" and a ">" comparison. Standardize on ₹ (INR) everywhere, and standardize the comparison direction to "at or under the limit" (≤) everywhere — the product proves a borrower is *within* a cap, never *above* one.
4. **[Medium — missing logic] The threshold proof UI only exposes an amount condition.** The actual circuit (Section 7.4) proves two conditions together: `active_loan_count ≤ threshold_count AND total_exposure ≤ threshold_amount`. Add a visible loan-count element to the Borrower View's "Generate Proof" panel and to the Verifier View's result panel, so both conditions being checked are visible — not just the amount one.
5. **[Low — credibility] Footer "Security Audit" link overclaims** for a hackathon-stage build with no actual audit. Replace with "How it works" (already present) or remove until a real audit exists.
6. **[Low — nice-to-have retained] Keep the "Computed Exposure" progress bar on the Borrower View and the copy/share Proof Reference ID pattern** — both are good additions beyond the original spec and should carry through unchanged.

After applying this checklist, the corrected screens become the actual Wave 1 frontend target — treat this checklist as acceptance criteria, not suggestions.

---

## 13. Testing Strategy

| Layer | What's tested | Wave |
|---|---|---|
| Contract unit tests | Threshold circuit: pass, fail, exact-boundary cases; nullifier prevents double-count | 1 |
| Contract integration tests | Full loan lifecycle: issue → prove → close → re-prove | 2 |
| Frontend smoke tests | The 3-screen happy path completes without manual console intervention | 1 |
| Manual demo script | A written, followable script so anyone (not just the builder) can run the full demo | 1 |

---

## 14. Wave 1 Build Plan (Aug 27 – Sep 16, 2026 — ~3 weeks)

Pre-Wave (now – Aug 27): read Midnight docs' dual-ledger model explanation, get local dev environment running, compile the sample `bboard` contract end-to-end, confirm Lace wallet setup — this is literally the buildathon organizers' own recommended prep and should be done before Wave 1 clock starts, not during it.

| Week | Focus | Exit criteria |
|---|---|---|
| Week 1 (Aug 27–Sep 2) | Toolchain pinned (Section 7.6) and verified from a clean clone. Compact contract: state model, `register_loan`, `close_loan`, nullifier logic. Get it compiling. | Contract compiles from a fresh clone with no manual fixes; loan registration + closing works via CLI/local tests |
| Week 2 (Sep 3–Sep 9) | `prove_exposure_within_limit` circuit + unit tests; start frontend scaffolding (3 views, wallet connect) | Proof circuit passes all threshold test cases; frontend can connect wallet and hit contract read functions |
| Week 3, first half (Sep 10–13) | Wire frontend to contract end-to-end; polish UX copy per Section 9; write README + demo script | Full Issuer → Borrower → Verifier loop works live, tests passing |
| Week 3, second half (Sep 14–16) | **Record demo video, build pitch slides, post progress publicly (Discord/X), do a full submission dry-run** | Video + deck exist and are reviewed by someone other than the builder; submission checklist below fully checked; submitted with buffer before the deadline, not at it |

**Why the last two days are scheduled and not squeezed in:** Communication & Marketing is 15% of your score and Product Leadership's presentation clarity is another 5 — a team that finishes code on the deadline and never gets to the video/deck loses points that have nothing to do with code quality. Treat this like any other deliverable with its own time slot, not an afterthought after "real" work is done.

### 14.1 Wave 1 submission checklist (cross-checked against the Official Rules)

- [ ] At least one Compact contract compiles successfully from a clean clone (hard gate — disqualifying if missed)
- [ ] Team members identified on the AKINDO submission
- [ ] Apache License 2.0 file in the repo
- [ ] Public GitHub repo link
- [ ] README explaining the project, setup process, architecture, Midnight integration, and how a judge can test/evaluate it themselves
- [ ] Description of progress completed during Wave 1 specifically (this becomes the diff you'll need to describe in Wave 2 — write it down now while it's fresh)
- [ ] Demo video recorded
- [ ] Pitch slides/visual assets prepared
- [ ] At least one public post about progress (Discord/X/wherever the buildathon community lives) — scored directly under Community Engagement
- [ ] Submitted before the deadline with buffer, not at the deadline

---

## 15. Risks & Open Questions

- **Compact tooling maturity** — the language and frontend-integration libraries are actively evolving; budget real time for docs/toolchain friction in Week 1, don't assume it'll be as smooth as a mature stack.
- **Team composition for this project** — not yet defined in this document; confirm before Wave 1 who's building what (contract vs frontend) so the Week 1–3 plan maps to actual people.
- **Threshold values** — using illustrative regulatory-style numbers for the demo; final values should be presented as configurable/illustrative, not asserted as official RBI figures, since exact current caps should be verified before any public-facing claim.
- **Name clearance** — "Vantage" is a working title, not checked for conflicts yet.

---

## 16. Rubric Mapping (why each piece of this plan exists)

| Rubric line | Points | What in this plan earns it |
|---|---|---|
| Problem Definition & Relevance | 5 | Section 2 — real, current, regulator-documented problem |
| Product Fit with Network | 5 | Section 6–7 — private/public split is structural, not decorative |
| Functional Depth | 5 | Section 7 — real circuits with real logic, not mocked proofs |
| Code Quality & Documentation | 10 | Section 11 |
| Working/Usable Interface | 10 | Section 9 |
| Completeness of Core Features | 5 | Section 5 Wave 1 scope, kept deliberately achievable |
| Demo Readiness | 5 | Section 11.7, 13 — README + demo script |
| Market Understanding / GTM | 10 | Section 3, 15 — named customer segment (NBFC-MFIs) |
| Messaging Clarity | 5 | Section 9.2 — UI itself communicates the pitch |

---

## 17. Glossary (for anyone reading this who isn't deep in ZK)

- **Commitment** — a cryptographic hash standing in for a real value, published instead of the value itself.
- **Nullifier** — a marker published to prove something was "used" or "closed" without revealing which specific item it was.
- **Witness / private state** — data known only to one party (here, the borrower), used to generate a proof but never published.
- **Circuit** — the specific computation a ZK proof is generated for (e.g., "count ≤ N and total ≤ X").
- **Dual-ledger model** — Midnight's architecture separating public on-chain state from private off-chain witness state, connected via ZK proofs.


### I have shared link from akindo about the buildathon once again i will paste some useful links.

hackathon description page -- https://app.akindo.io/wave-hacks/jaMZjqPOBsLXvjdG

rules - https://drive.google.com/file/d/1YKXtsw5nghcEBEW0BFrLn-U34AfH_MF4/view

juding rubic - https://docs.google.com/document/d/1-dDTqWa2CcfnSEvgXq83La2M8zAxi4jtVtKpMJRm3Oo/edit?tab=t.0#heading=h.7p6kkmssms1v

Resources and Tools
Helpful program resources and tools may include:
Resources:

[Midnight docs](https://docs.midnight.network/) -- https://docs.midnight.network/
[GitHub Repo](https://github.com/midnightntwrk) - https://github.com/midnightntwrk
https://github.com/mashharuki/midnight-rps-sample-app/blob/main/README.md — by Haruki, a member of the Aliit Fellowship
Tools:

https://github.com/midnightntwrk/midnight-local-dev – A repo to spin up a local network for testing
https://github.com/effectstream/effectstream – A Web3 engine for building multi-chain dApps, infra and games
https://github.com/kuiralabs/kuira-sdk-android – An SDK to build privacy-focused mobile applications.
https://docs.midnight.network/blog/migrating-to-kapa-and-midnight-expert – Code smart contracts and dapps with AI
https://docs.midnight.network/llms.txt