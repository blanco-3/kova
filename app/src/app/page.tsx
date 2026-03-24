import { DemoDashboard } from "../components/DemoDashboard";
import { x402Narrative } from "../lib/x402";
import { EscrowVaultHero } from "../components/EscrowVaultHero";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Seoulana WarmUp / Agent Commerce Infra</p>
          <h1>Payment should follow delivery, not precede it.</h1>
          <p className="hero-text">{x402Narrative.summary}</p>
          <div className="hero-ribbon">
            <span>PDA Vaults</span>
            <span>SHA-256 Commit</span>
            <span>Dual Timeout</span>
            <span>Devnet USDC</span>
          </div>
        </div>

        <EscrowVaultHero />

        <div className="hero-stage">
          <article className="signal-card signal-risk">
            <span className="hero-label">Without Escrow</span>
            <strong>Payment clears before delivery is proven.</strong>
            <p>
              A direct x402 flow settles immediately. If the service stalls or
              fails, the buyer has no recovery path and loses funds silently.
            </p>
          </article>
          <article className="signal-card signal-safe">
            <span className="hero-label">With x402 Escrow</span>
            <strong>Funds release only after delivery verification.</strong>
            <p>
              The middleware swaps direct settlement for a Solana vault. Payment
              releases on hash match or refunds on timeout - always auditable.
            </p>
          </article>
        </div>

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
      </section>

      <DemoDashboard />
    </main>
  );
}
