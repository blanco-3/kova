# Submission Copy

## Project title

x402 Escrow Protocol

## One-line description

Solana-native escrow for x402 payments that releases funds only after service delivery is proven.

## Short description

x402 enabled HTTP-native payments for AI agents, but it did not solve the trust gap between payment and delivery. x402 Escrow Protocol intercepts the x402 `402 Payment Required` flow and replaces direct settlement with a Solana escrow vault. Buyers fund USDC into a PDA-backed escrow, sellers commit the SHA-256 hash of the delivered result, and payment only releases after the buyer verifies the returned bytes. If delivery fails or the seller stalls, the buyer gets refunded automatically.

## Demo summary

The live demo shows three outcomes:

- `Without Escrow`: direct x402 payment succeeds but the service never arrives
- `Delivery Failure Protection`: funds are escrowed and refunded when the seller does not deliver
- `Honest Trade`: the seller commits the result hash and receives payment only after verification

## Why it matters

This project adds the missing trust layer for agent commerce. x402 can transport payment, but escrow is what makes service delivery enforceable.

## Repository

`https://github.com/blanco-3/kova`

## Live demo URL

`https://kova-frontend-s6dwdvbzwa-du.a.run.app`

## Pitch deck URL

`TODO`

## Pitch video URL

`TODO`
