"use client";

import { useEffect, useState } from "react";
import { DemoDashboard } from "../components/DemoDashboard";
import { EscrowVaultHero } from "../components/EscrowVaultHero";
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
    <main className="page-shell">
      <div className="page-toolbar">
        <span>{copy.hero.language}</span>
        <div className="locale-switch" role="tablist" aria-label={copy.hero.language}>
          <button
            className={locale === "en" ? "locale-button active" : "locale-button"}
            onClick={() => updateLocale("en")}
            type="button"
          >
            {copy.common.english}
          </button>
          <button
            className={locale === "ko" ? "locale-button active" : "locale-button"}
            onClick={() => updateLocale("ko")}
            type="button"
          >
            {copy.common.korean}
          </button>
        </div>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{copy.hero.eyebrow}</p>
          <h1>{copy.hero.headline}</h1>
          <p className="hero-text">{copy.hero.summary}</p>
          <div className="hero-ribbon">
            {copy.hero.ribbons.map((ribbon) => (
              <span key={ribbon}>{ribbon}</span>
            ))}
          </div>
        </div>

        <EscrowVaultHero locale={locale} />

        <div className="hero-stage">
          <article className="signal-card signal-risk">
            <span className="hero-label">{copy.hero.riskLabel}</span>
            <strong>{copy.hero.riskHeadline}</strong>
            <p>{copy.hero.riskBody}</p>
          </article>
          <article className="signal-card signal-safe">
            <span className="hero-label">{copy.hero.safeLabel}</span>
            <strong>{copy.hero.safeHeadline}</strong>
            <p>{copy.hero.safeBody}</p>
          </article>
        </div>

        <div className="hero-stats">
          {copy.hero.stats.map((stat) => (
            <div key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <DemoDashboard locale={locale} />
    </main>
  );
}
