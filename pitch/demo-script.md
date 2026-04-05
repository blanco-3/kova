# x402 Escrow Protocol Demo Script

## Narrative Guardrails

- Say `delivery-gated settlement` or `proof-of-delivery escrow`, not `trustless everything`.
- Say v1 proves delivery, not service quality.
- Say the live local demo runs through the middleware at `http://127.0.0.1:8787`.
- Say the deployed public service is a `public backend` on Cloud Run, not the local middleware.
- Treat `lost` as a runtime/UI state for the direct x402 path, not an on-chain escrow state.

## 5-minute main version

### 0:00-0:20 — Hook

**Screen**

- Title slide
- One-line subtitle: `Proof-of-delivery escrow for x402 payments on Solana`

**Script**

“x402 gave AI agents the ability to pay, but it did not give them the ability to trust. Our project, x402 Escrow Protocol, fills that gap with Solana-native proof-of-delivery escrow.”

### 0:20-1:00 — Problem

**Screen**

- Start with the `Without Escrow` lane
- Highlight `402 issued` followed by the final red `lost` state

**Script**

“Direct x402 payment solves transport, not atomic settlement between payment and delivery. If a seller stalls after payment, the buyer has no recourse. If a server fails after payment, the funds are already gone. And in longer agent chains, the same gap compounds. In this hackathon demo we focus on the buyer-seller delivery problem, because that is the smallest missing trust primitive.”

### 1:00-1:50 — Solution

**Screen**

- Protocol flow diagram
- Show the five-step sequence:
  - `402 issued`
  - `escrow created`
  - `hash committed`
  - `result delivered`
  - `released or refunded`

**Script**

“We keep the x402 experience intact. The protected service still returns a real `402 Payment Required` challenge. But instead of paying the seller directly, our middleware intercepts that paywall and creates a Solana escrow vault first. The buyer funds the vault with USDC. The seller commits the SHA-256 hash of the delivered bytes. The buyer verifies the returned bytes, and only a matching payload releases funds. If the seller misses the submit deadline, the buyer gets refunded. If the buyer disappears after a committed hash, the seller can claim after the verify deadline. And if the buyer rejects a committed result inside the verify window, the escrow moves to `Disputed` and refunds the buyer. That is delivery-gated settlement, not quality arbitration.”

### 1:50-2:20 — Demo 1: Without Escrow

**Screen**

- Run `Without Escrow`
- Show:
  - real x402 `402 issued`
  - direct payment path
  - final `lost`

**Script**

“First, the baseline. The malicious endpoint returns a real x402 challenge. The client proceeds without escrow, pays directly, and the service never arrives. The UI ends in `lost`. That state is intentionally off-chain, because there is no escrow contract to recover from. Payment happened, delivery did not, and the buyer has no recovery path.”

### 2:20-2:50 — Demo 2: Delivery Failure Protection

**Screen**

- Run `Delivery Failure Protection`
- Show:
  - `402 issued`
  - `escrow created`
  - malicious fulfillment stalls
  - `refunded`

**Script**

“Now the same failure with escrow protection. The middleware sees the same paywall, funds the escrow PDA instead of settling directly, and waits for the seller to commit delivery. The malicious seller never commits before the submit deadline, so the buyer claims a timeout refund. The run ends in `refunded` instead of `lost`.”

### 2:50-3:20 — Demo 3: Honest Trade

**Screen**

- Run `Honest Trade`
- Show:
  - `escrow created`
  - `hash committed`
  - `result delivered`
  - `released`

**Script**

“Finally, the honest path. The seller commits the result hash on-chain, returns the payload, and the buyer verifies the bytes. A matching hash releases the escrow to the seller. So the seller still gets paid, but only after delivery is proven.”

### 3:20-4:00 — Why Solana

**Screen**

- Highlight PDA vaults, SPL Token settlement, fast finality, low fees

**Script**

“Why Solana? PDA vaults let us derive isolated escrow accounts without private keys. SPL Token CPI gives us programmable USDC settlement. Fast finality makes the demo responsive enough for judges to watch live, and the fee profile is low enough that keeping escrow on-chain is practical instead of theatrical.”

### 4:00-4:35 — Proof

**Screen**

- Show tracker rows with:
  - `escrowPda`
  - transaction count / signatures
  - `resultHash`
- Optionally overlay the README verified devnet run

**Script**

“This is not a mocked status board. The tracker exposes the proof surface we care about: escrow PDA, transaction signatures, and result hash. The README already includes a verified devnet run with create, commit, release, and refund signatures. For the live run, we can point from the UI to the same on-chain evidence.”

### 4:35-5:00 — Differentiation and close

**Screen**

- Repo URL
- Demo URL
- Closing line

**Script**

“x402 transports payment. Escrow makes delivery enforceable. We are not claiming to solve quality arbitration, long agent chains, or mainnet commerce in this version. We are solving the first missing trust layer: pay only when delivery is provable. That is x402 Escrow Protocol.”

## 60-second cutdown

### 0:00-0:15

**Screen**

- `Without Escrow` lane

**Script**

“x402 lets agents pay, but it does not guarantee delivery. In the direct path, the client satisfies a real x402 challenge, the seller stalls, and the run ends in `lost`.”

### 0:15-0:35

**Screen**

- `Without Escrow` next to `Delivery Failure Protection`

**Script**

“With x402 Escrow Protocol, the middleware intercepts the same paywall and funds a Solana escrow vault first. If the seller never commits delivery, the buyer gets refunded instead of losing funds.”

### 0:35-0:50

**Screen**

- `Honest Trade` lane

**Script**

“On the honest path, the seller commits the result hash on-chain, returns the payload, and matching bytes release payment. Delivery first, settlement second.”

### 0:50-1:00

**Screen**

- Closing slide

**Script**

“x402 transports payment. Solana escrow makes delivery enforceable. That is the trust layer we are adding for agent commerce.”

## Optional proof overlay

- Program ID: `CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH`
- Devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- README verified devnet run date: `2026-03-24`
- Replace the sample signatures with the latest measured run if you re-validate before submission.
