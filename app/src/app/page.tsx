import Link from "next/link";
import { EscrowVault } from "@/components/EscrowVault";

export default function LandingPage() {
  return (
    <main className="landing">
      {/* Minimal header - just logo and one link */}
      <header className="header">
        <span className="wordmark">x402</span>
        <Link href="/demo" className="header-link">
          Demo
        </Link>
      </header>

      {/* Hero - vault object dominates, typography is precise */}
      <section className="hero">
        <div className="hero-vault">
          <EscrowVault />
        </div>
        
        <div className="hero-copy">
          <h1>
            Payment follows delivery.
            <br />
            Not the other way around.
          </h1>
          <p>
            Solana-native escrow for x402 agent commerce.
            Funds release only after cryptographic proof of delivery.
          </p>
        </div>
      </section>

      {/* Single contrast statement - no cards */}
      <section className="contrast">
        <div className="contrast-row">
          <div className="contrast-item risk">
            <span className="contrast-label">Without</span>
            <p>Payment clears before delivery is proven. No recovery.</p>
          </div>
          <div className="contrast-divider" />
          <div className="contrast-item safe">
            <span className="contrast-label">With x402</span>
            <p>Funds held in PDA vault. Released on hash match or refunded on timeout.</p>
          </div>
        </div>
      </section>

      {/* Technical specs - minimal, typographic */}
      <section className="specs">
        <div className="spec">
          <span className="spec-num">01</span>
          <span className="spec-text">Solana PDA Vaults</span>
        </div>
        <div className="spec">
          <span className="spec-num">02</span>
          <span className="spec-text">SHA-256 Commit-Verify</span>
        </div>
        <div className="spec">
          <span className="spec-num">03</span>
          <span className="spec-text">Dual Timeout Protection</span>
        </div>
      </section>

      {/* CTA - single, confident */}
      <section className="cta">
        <Link href="/demo" className="cta-button">
          Open Demo
        </Link>
        <a
          href="https://github.com/x402"
          target="_blank"
          rel="noopener noreferrer"
          className="cta-link"
        >
          Read Protocol Spec
        </a>
      </section>

      {/* Footer - absolute minimum */}
      <footer className="footer">
        <span>x402 Escrow Protocol</span>
      </footer>
    </main>
  );
}
