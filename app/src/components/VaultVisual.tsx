"use client";

import { useState } from "react";
import type { Locale } from "../lib/i18n";

export function VaultVisual({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<"safe" | "direct">("safe");

  const isSafe = mode === "safe";

  return (
    <div className="vault-section">
      <div className="vault-section-head">
        <p className="section-label">
          {locale === "ko" ? "에스크로 볼트 비주얼" : "ESCROW VAULT VISUAL"}
        </p>
        <h2>
          {locale === "ko" ? (
            <>
              자금은 <span className="accent">암호화 볼트</span>를 통해 흐릅니다
            </>
          ) : (
            <>
              Funds flow through a <span className="accent">cryptographic vault</span>
            </>
          )}
        </h2>
        <p>
          {locale === "ko"
            ? "결제는 솔라나 PDA 볼트에 보관되며, 전달 해시가 온체인 커밋과 일치할 때만 릴리즈됩니다."
            : "Payment is held in a Program Derived Address (PDA) vault on Solana. Released only when the hash of delivery matches the on-chain commit."}
        </p>
      </div>

      <div className="flow-tabs">
        <button
          className={`flow-tab ${isSafe ? "active" : ""}`}
          onClick={() => setMode("safe")}
          type="button"
        >
          {locale === "ko" ? "안전 경로 (에스크로)" : "Safe Path (With Escrow)"}
        </button>
        <button
          className={`flow-tab ${!isSafe ? "active danger" : ""}`}
          onClick={() => setMode("direct")}
          type="button"
        >
          {locale === "ko" ? "직접 결제 (에스크로 없음)" : "Direct Path (Without Escrow)"}
        </button>
      </div>

      <div className="flow-diagram">
        <div className="flow-node">
          <div className="flow-node-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <span className="flow-node-label">
            {locale === "ko" ? "구매자 에이전트" : "Buyer Agent"}
          </span>
          <span className="flow-node-status" style={{ color: isSafe ? "var(--teal)" : "var(--orange)" }}>
            {locale === "ko" ? "예치" : "Deposit"}
          </span>
        </div>

        <div className="flow-connector">
          <div className="flow-dot" style={{ background: isSafe ? "var(--teal)" : "var(--red)" }} />
        </div>

        <div className="flow-node">
          <div
            className="flow-node-icon vault-icon"
            style={{
              borderColor: isSafe ? "var(--teal)" : "var(--red)",
              boxShadow: isSafe ? "0 0 40px var(--teal-dim)" : "0 0 40px var(--red-dim)",
              opacity: isSafe ? 1 : 0.4,
              borderStyle: isSafe ? "solid" : "dashed",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: isSafe ? "var(--teal)" : "var(--ink-muted)" }}
            >
              {isSafe ? (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </>
              ) : (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </>
              )}
            </svg>
          </div>
          <span className="flow-node-label">
            {locale === "ko" ? "에스크로 볼트" : "Escrow Vault"}
          </span>
          <span className="flow-node-status" style={{ color: isSafe ? "var(--teal)" : "var(--red)" }}>
            {isSafe ? "LOCKED" : "BYPASSED"}
          </span>
        </div>

        <div className="flow-connector">
          <div className="flow-dot" style={{ background: isSafe ? "var(--teal)" : "var(--red)" }} />
        </div>

        <div className="flow-node">
          <div className="flow-node-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span className="flow-node-label">
            {locale === "ko" ? "판매자 에이전트" : "Seller Agent"}
          </span>
          <span className={`flow-node-status ${!isSafe ? "danger" : ""}`}>
            {isSafe
              ? locale === "ko" ? "✓ 검증됨" : "✓ Verified"
              : locale === "ko" ? "✗ 응답 없음" : "✗ Stalled"}
          </span>
        </div>
      </div>

      <div className="flow-steps">
        {isSafe ? (
          <>
            <div className="flow-step-item">
              <div className="step-dot" />
              <span>{locale === "ko" ? "예치" : "Deposit"}</span>
            </div>
            <div className="flow-step-item">
              <div className="step-dot" />
              <span>{locale === "ko" ? "해시 커밋" : "Commit Hash"}</span>
            </div>
            <div className="flow-step-item">
              <div className="step-dot" />
              <span>{locale === "ko" ? "검증 & 릴리즈" : "Verify & Release"}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flow-step-item">
              <div className="step-dot" style={{ background: "var(--red)" }} />
              <span>{locale === "ko" ? "직접 결제" : "Direct Payment"}</span>
            </div>
            <div className="flow-step-item">
              <div className="step-dot" style={{ background: "var(--red)" }} />
              <span>{locale === "ko" ? "서비스 실패" : "Service Fails"}</span>
            </div>
            <div className="flow-step-item">
              <div className="step-dot" style={{ background: "var(--red)" }} />
              <span>{locale === "ko" ? "자금 손실" : "Funds Lost"}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
