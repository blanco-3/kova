import { DemoDashboard } from "../components/DemoDashboard";
import { x402Narrative } from "../lib/x402";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Seoulana WarmUp / Agent Commerce Infra</p>
          <h1>x402 payments need a delivery guarantee.</h1>
          <p className="hero-text">{x402Narrative.summary}</p>
          <div className="hero-ribbon">
            <span>PDA vaults</span>
            <span>SHA-256 commit</span>
            <span>Dual timeout</span>
            <span>Devnet USDC</span>
          </div>
        </div>
        <div className="hero-stage">
          <article className="signal-card signal-risk">
            <span className="hero-label">Without escrow</span>
            <strong>Payment clears first. Delivery can still fail.</strong>
            <p>
              A direct x402 flow can charge the buyer and still leave the agent
              with no recovery path after a stalled response.
            </p>
          </article>
          <article className="signal-card signal-safe">
            <span className="hero-label">With x402 Escrow</span>
            <strong>Funds release only after service delivery is proven.</strong>
            <p>
              The middleware swaps direct settlement for a Solana escrow vault
              and resolves to release or refund on-chain.
            </p>
          </article>
          <div className="hero-stats">
            <div>
              <span>Chain</span>
              <strong>Solana devnet</strong>
            </div>
            <div>
              <span>Asset</span>
              <strong>USDC-SPL</strong>
            </div>
            <div>
              <span>Pattern</span>
              <strong>Commit, verify, release</strong>
            </div>
            <div>
              <span>Fallback</span>
              <strong>Automatic refund path</strong>
            </div>
          </div>
        </div>
      </section>
      <DemoDashboard />
    </main>
  );
}
