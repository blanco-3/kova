# Pitch Deck Generation Prompt

Use this prompt in Claude or Manus to generate the final pitch deck.

---

## Prompt

Create a **16:9, 11 slides, English, hackathon demo-first** pitch deck for a project called **KOVA**.

The audience is hackathon judges at Seoulana. Optimize for three things only: technical credibility, live-demo clarity, and proof-backed claims. This is not an investor deck. It is not a generic crypto deck.

---

### Identity

The product name is **KOVA**.

- **kova** is Finnish for "hard", "solid", "unyielding"
- The name reflects what the protocol does: it makes the promise between a buyer and a seller solid — enforced by code, not trust
- The tagline is: `Proof-of-delivery escrow for x402 payments on Solana.`

---

### Core Narrative

`x402 gave AI agents the ability to pay. It did not give them the ability to trust. KOVA keeps the x402 UX intact and replaces direct settlement with Solana proof-of-delivery escrow.`

---

### Hard Factual Boundaries

Only use claims grounded in the facts below. Do not invent statistics, market sizes, or competitor comparisons.

- The protected endpoint still returns a real `402 Payment Required` HTTP challenge
- The middleware intercepts the 402 and replaces direct settlement with escrow
- The on-chain instruction set:
  - `create_escrow`
  - `commit_result_hash`
  - `verify_and_release`
  - `claim_timeout_refund`
  - `reject_result`
- State transitions:
  - `Created → HashCommitted → Completed`
  - `Created → Refunded`
  - `HashCommitted → Disputed`
- The live demo shows exactly three outcomes:
  - `Without Escrow` → `lost`
  - `Delivery Failure Protection` → `refunded`
  - `Honest Trade` → `completed`
- `lost` is a UI/runtime label for the direct payment path — no escrow exists in that path
- v1 proves delivery, not service quality
- Tracker proof surface: `escrowPda`, transaction signatures, `resultHash`
- Program ID: `CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH`
- Repo: `https://github.com/blanco-3/kova`
- Live demo: `https://kova-frontend-s6dwdvbzwa-du.a.run.app`

---

### Do Not Claim

- Do not claim service quality verification or AI correctness guarantees
- Do not say "trustless" or "fully decentralized"
- Do not use rocket, coin, or token-price imagery
- Do not conflate the local `middleware` with the deployed `public backend`

---

### Slide Structure

Build exactly this slide order:

**Slide 1 — KOVA**
- The name: Finnish for "solid", "unyielding"
- What it means: the promise between buyer and seller, made solid by code
- Tagline: `Proof-of-delivery escrow for x402 payments on Solana.`
- Visual: full-bleed dark slide, large bold "KOVA", Finnish definition in small type beneath, Solana gradient accent

**Slide 2 — The Gap**
- x402 made HTTP-native payments possible for AI agents
- It does not make payment and delivery atomic
- A buyer can pay before delivery is ever proven
- Visual: simple two-column split — `x402 handles` vs `x402 does not handle` — clean and stark

**Slide 3 — Failure Modes**
- Paid, but the seller never delivers
- Paid, then the server fails mid-execution
- The same trust gap compounds across longer agent chains
- Live demo scope: one buyer, one seller, one verifiable result
- Visual: three compact failure cards with short labels and a red terminal state badge each

**Slide 4 — What KOVA Changes**
- The endpoint still returns a real `402 Payment Required`
- KOVA intercepts before direct settlement
- Buyer funds a PDA-backed USDC escrow vault
- Seller only receives payment after provable delivery
- Visual: before/after architecture flow — two lanes, left is broken, right has the escrow vault in the middle

**Slide 5 — On-chain Flow**
- Five instructions: `create_escrow` / `commit_result_hash` / `verify_and_release` / `claim_timeout_refund` / `reject_result`
- Three paths: `Created → Completed`, `Created → Refunded`, `HashCommitted → Disputed`
- Visual: horizontal state machine diagram, Solana purple/green nodes, clean arrows

**Slide 6 — Live Demo: Three Outcomes**
- `Without Escrow` → payment sent, service never arrives → **lost**
- `Delivery Failure Protection` → escrow funded, seller stalls, deadline passes → **refunded**
- `Honest Trade` → hash committed, buyer verifies bytes, funds released → **completed**
- Visual: three vertical columns with scenario label at top, arrow pointing down, terminal state badge at bottom — this is the visual anchor of the deck

**Slide 7 — How to Read the Demo**
- Each run shows: scenario route, escrow PDA, result hash, transaction signatures
- Every on-chain event is timestamped and linkable to Solana Explorer
- The tracker is the proof — not a simulation, a live devnet settlement
- Visual: annotated screenshot crop of the KOVA tracker UI with callout labels pointing to escrowPda / resultHash / Tx links

**Slide 8 — Why Solana**
- PDA vaults: isolated escrow accounts with no private key management
- SPL Token CPI: programmable USDC settlement in a single instruction
- Fast finality: settlement is visible on stage without waiting
- Low fees: on-chain escrow is economically practical per-request
- Visual: four capability callouts as icon + label cards, Solana logo, no generic chain marketing

**Slide 9 — Proof Surface**
- Program deployed on devnet: `CTRDkdc7fN427...`
- Escrow PDA: `[INSERT LATEST PDA]`
- Result Hash: `[INSERT LATEST HASH]`
- Tx signatures: `[Tx1] [Tx2] [Tx3]` linked to Solana Explorer
- Visual: dark terminal-style card, monospace font, shortened addresses with Explorer links

**Slide 10 — Scope + Roadmap**
- v1 proves delivery, not service quality
- Current demo: one buyer, one seller
- Out of scope now: arbitration, multi-agent chains, mainnet
- Roadmap: richer dispute handling → longer agent flows → production deployment
- Visual: two-column "Now / Next" split, minimal, no Gantt charts

**Slide 11 — Close**
- `x402 transports payment.`
- `KOVA makes delivery enforceable.`
- Repo: `github.com/blanco-3/kova`
- Demo: `kova-frontend-s6dwdvbzwa-du.a.run.app`
- Visual: full-bleed dark, same style as Slide 1, closing statement in large type, URLs in small mono below

---

### Visual Direction

- **Theme**: Solana — dark background (#0F0F14 or similar), Solana purple (`#9945FF`) and green (`#14F195`) as accent colors
- **Typography**: large, bold slide titles; short bullets in regular weight; monospace for addresses and code
- **Style**: technical and clean — architecture diagrams, state machines, UI crops, proof callouts
- **No**: dense paragraphs, generic crypto imagery (coins, rockets, charts), more than 5 bullets per slide

Slide 6 (Three Outcomes) and Slide 7 (How to Read the Demo) are the visual and narrative anchors. Give them the most space and polish.

---

### Output Format

For each slide provide:
1. Slide title
2. 3–5 concise bullets (final copy, not placeholders)
3. One recommended visual treatment (specific, not generic)

Mark manual-insertion points clearly:
- `[INSERT LATEST ESCROW PDA]`
- `[INSERT LATEST RESULT HASH]`
- `[INSERT TX 1 / TX 2 / TX 3 SIGNATURES]`
