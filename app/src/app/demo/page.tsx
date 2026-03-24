import Link from "next/link";
import { DemoInterface } from "../../components/DemoInterface";

export default function DemoPage() {
  return (
    <>
      <header className="site-header">
        <Link href="/" className="logo">
          x402
        </Link>
        <nav className="header-nav">
          <Link href="/" className="header-link">
            Home
          </Link>
          <a
            href="https://github.com/x402"
            target="_blank"
            rel="noopener noreferrer"
            className="header-link"
          >
            Protocol
          </a>
        </nav>
      </header>

      <main className="demo-page">
        <div className="demo-header">
          <h1>Escrow Protocol Demo</h1>
          <p>
            Run three scenarios to see how x402 escrow protects buyers from
            failed deliveries while ensuring sellers get paid for honest work.
          </p>
        </div>

        <DemoInterface />
      </main>
    </>
  );
}
