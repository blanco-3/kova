import { DemoDashboard } from "../components/DemoDashboard";
import { x402Narrative } from "../lib/x402";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Seoulana WarmUp / Agent Commerce Infra</p>
          <h1>x402 gave agents the ability to pay. This gives them the ability to trust.</h1>
          <p className="hero-text">{x402Narrative.summary}</p>
        </div>
        <div className="hero-card">
          <span className="hero-label">Core guarantee</span>
          <strong>Payment only releases when service delivery is proven.</strong>
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
              <strong>Hash commit + dual timeout</strong>
            </div>
          </div>
        </div>
      </section>
      <DemoDashboard />
    </main>
  );
}
