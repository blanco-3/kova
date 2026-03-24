# Submission Checklist

## Required assets

- Pitch video link
- Pitch deck PDF
- GitHub repository URL
- Live demo URL

## Repository

- GitHub repo: `https://github.com/blanco-3/kova`
- Main branch contains the latest working UI and protocol implementation
- README includes architecture, local/devnet flow, and verified devnet transactions

## Demo links to finalize

- Frontend URL: `https://kova-henna.vercel.app`
- Middleware URL: `TODO`
- Honest server URL: `TODO`
- Malicious server URL: `TODO`

## Deck

- File target: `pitch/x402-escrow-protocol.pdf`
- Use `pitch/deck-outline.md` as the master outline
- Keep to 10 slides maximum

## Video

- Duration target: `60s` primary, `2-3 min` extended cut optional
- Use `pitch/demo-script.md`
- Show exactly three scenarios:
  - `Without Escrow`
  - `Rugpull Defense`
  - `Honest Trade`

## Demo proof points to show

- Program ID: `CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH`
- Real devnet USDC escrow flow
- Real x402 402 challenge on the direct endpoints
- Release path on successful delivery
- Refund path on timeout
- Loss path without escrow

## Screenshots to capture

- Hero section
- Before / after comparison
- Honest trade completed state
- Rugpull defense refunded state
- Without escrow lost state
- Live tracker with transaction signatures visible

## Final submission pass

- Replace all `TODO` links with real deployed URLs
- Export pitch deck to PDF
- Upload pitch video and paste link
- Verify README links work
- Verify demo link loads without local dependencies
