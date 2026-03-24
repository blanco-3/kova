# x402 Escrow Protocol Demo Script

## 60-second version

### 0–15s

“x402 gave AI agents the ability to pay. But it did not give them the ability to trust.”

Show the `Without Escrow` path:

- call the malicious x402 endpoint
- show `402 issued`
- show direct payment path
- show final red `Lost`

“Payment succeeded. Service delivery did not. The agent has no recourse.”

### 15–40s

“Now the same request with x402 Escrow Protocol.”

Show the `Rugpull Defense` path:

- `402 issued`
- `escrow created`
- malicious fulfillment stalls
- `refunded`

“Instead of paying directly, the middleware escrows funds into a Solana PDA vault. If the seller never commits delivery, the buyer gets refunded automatically.”

Show the `Honest Trade` path:

- `escrow created`
- `hash committed`
- `result delivered`
- `released`

“Matching bytes release payment. No delivery means no payout.”

### 40–60s

“Why Solana? PDA vaults without private keys. CPI-based token settlement. Fast finality. Low enough cost to keep escrow on-chain.”

Close with:

“x402 gave agents the ability to pay. We give them the ability to trust.”

## 2–3 minute expansion

- explain the atomicity gap with one sentence per failure mode
- show the program status transitions on the tracker
- point out the real x402 402 challenge on the protected direct route
- explain why `reject_result` is a v1 dispute path and not quality arbitration

