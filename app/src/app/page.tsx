"use client";

import { useEffect, useState } from "react";
import { DemoDashboard } from "../components/DemoDashboard";
import { VaultVisual } from "../components/VaultVisual";
import { getUiCopy, type Locale } from "../lib/i18n";

type BrowserApi = typeof globalThis & {
  localStorage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
  };
  navigator?: {
    language?: string;
  };
};

const browserApi = globalThis as BrowserApi;

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const copy = getUiCopy(locale);

  useEffect(() => {
    const savedLocale = browserApi.localStorage?.getItem("x402-locale");
    if (savedLocale === "en" || savedLocale === "ko") {
      setLocale(savedLocale);
      return;
    }
    if (browserApi.navigator?.language?.toLowerCase().startsWith("ko")) {
      setLocale("ko");
    }
  }, []);

  function updateLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    browserApi.localStorage?.setItem("x402-locale", nextLocale);
  }

  return (
    <>
      <nav className="nav-bar">
        <span className="nav-logo">Kova</span>
        <a href="#vault" className="nav-link">
          Protocol
        </a>
        <a href="#demo" className="nav-link">
          Demo
        </a>
        <a
          href="https://github.com/blanco-3/kova"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
        >
          GitHub ↗
        </a>
        <div className="nav-locale">
          <button
            className={locale === "en" ? "locale-btn active" : "locale-btn"}
            onClick={() => updateLocale("en")}
            type="button"
          >
            EN
          </button>
          <button
            className={locale === "ko" ? "locale-btn active" : "locale-btn"}
            onClick={() => updateLocale("ko")}
            type="button"
          >
            KO
          </button>
        </div>
      </nav>

      <main className="page-shell">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1>
              {locale === "ko" ? (
                <>
                  결제는 <span className="accent">전달보다 먼저</span> 이뤄지면 안
                  됩니다.
                </>
              ) : (
                <>
                  Payment should <span className="accent">follow delivery,</span>{" "}
                  not precede it.
                </>
              )}
            </h1>
            <p className="hero-text">{copy.hero.summary}</p>
            <div className="hero-ribbon">
              {copy.hero.ribbons.map((ribbon) => (
                <span key={ribbon}>{ribbon}</span>
              ))}
            </div>
            <div className="hero-cta-row">
              <a href="#demo" className="btn-primary">
                {locale === "ko" ? "라이브 데모" : "Try Live Demo"} →
              </a>
              <a
                href="https://github.com/blanco-3/kova"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                {locale === "ko" ? "GitHub 보기" : "View on GitHub"} ↗
              </a>
            </div>
          </div>
        </section>

        <section id="vault">
          <VaultVisual locale={locale} />
        </section>

        <div id="demo">
          <DemoDashboard locale={locale} />
        </div>

        <footer className="page-footer">
          <span className="footer-logo">Kova</span>
          <span className="footer-center">
            Trust layer for the agent economy · Seoulana WarmUp Demo
          </span>
          <a
            href="https://github.com/blanco-3/kova"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GitHub ↗
          </a>
        </footer>
      </main>
    </>
  );
}
