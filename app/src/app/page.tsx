import Link from "next/link";
import { EscrowVault } from "../components/EscrowVault";

export default function LandingPage() {
  return (
    <>
      <header className="site-header">
        <span className="logo">x402</span>
        <nav className="header-nav">
          <Link href="/demo" className="header-link">
            Demo
          </Link>
          <a
            href="https://github.com/x402"
            target="_blank"
            rel="noopener noreferrer"
            className="header-link"
          >
            Protocol
          </a>
          <Link href="/demo" className="header-cta">
            Open Demo
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-eyebrow">Solana Escrow Protocol</span>
            <h1 className="hero-headline">
              Payment should follow delivery, not precede it.
            </h1>
            <p className="hero-subline">
              x402 lets AI agents pay. We make sure payment releases only after
              service delivery is cryptographically proven on-chain.
            </p>
            <div className="hero-actions">
              <Link href="/demo" className="btn-primary">
                Open Demo
              </Link>
              <a
                href="https://github.com/x402"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Read Protocol
              </a>
            </div>
          </div>

          <EscrowVault />
        </div>
      </section>

      <section className="value-section">
        <div className="value-grid">
          <article className="value-block value-risk">
            <span className="value-label">Without Escrow</span>
            <h2>Payment clears before delivery is proven.</h2>
            <p>
              A direct x402 flow settles immediately. If the service stalls or
              never delivers, the buyer has no recovery path. Funds are lost
              silently.
            </p>
          </article>

          <div className="value-divider" />

          <article className="value-block value-safe">
            <span className="value-label">With x402 Escrow</span>
            <h2>Funds release only after verification.</h2>
            <p>
              The middleware swaps direct settlement for a Solana PDA vault.
              Payment releases on hash match or refunds on timeout. Always
              auditable, always recoverable.
            </p>
          </article>
        </div>
      </section>

      <section className="proof-section">
        <div className="proof-inner">
          <span className="proof-label">Technical Foundation</span>
          <div className="proof-list">
            <div className="proof-item">
              <strong>Solana PDA Vaults</strong>
              <span>Deterministic escrow addresses derived from buyer + seller</span>
            </div>
            <div className="proof-item">
              <strong>SHA-256 Commit Verify</strong>
              <span>Seller commits result hash, buyer verifies before release</span>
            </div>
            <div className="proof-item">
              <strong>Dual Timeout Protection</strong>
              <span>Automatic refund if delivery window expires</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span className="footer-text">x402 Escrow Protocol</span>
        <div className="footer-links">
          <a
            href="https://github.com/x402"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GitHub
          </a>
          <a
            href="https://solana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Solana
          </a>
        </div>
      </footer>
    </>
  );
}
