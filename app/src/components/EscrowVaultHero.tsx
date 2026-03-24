"use client";

import { useEffect, useState } from "react";
import { getUiCopy, type Locale } from "../lib/i18n";

export function EscrowVaultHero({ locale }: { locale: Locale }) {
  const [activeFlow, setActiveFlow] = useState<"safe" | "risk">("safe");
  const [animationPhase, setAnimationPhase] = useState(0);
  const copy = getUiCopy(locale);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const flowInterval = setInterval(() => {
      setActiveFlow((prev) => (prev === "safe" ? "risk" : "safe"));
      setAnimationPhase(0);
    }, 8000);
    return () => clearInterval(flowInterval);
  }, []);

  return (
    <div className="vault-hero">
      <div className="vault-stage">
        {/* Ambient glow effects */}
        <div className="vault-ambient vault-ambient-left" />
        <div className="vault-ambient vault-ambient-right" />
        
        {/* Flow indicator */}
        <div className={`flow-indicator ${activeFlow}`}>
          <span className="flow-label">
            {activeFlow === "safe" ? copy.vault.safeFlow : copy.vault.riskFlow}
          </span>
        </div>

        {/* Buyer Node */}
        <div className={`vault-node buyer-node ${animationPhase >= 1 ? "active" : ""}`}>
          <div className="node-glow" />
          <div className="node-ring" />
          <div className="node-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className="node-label">{copy.vault.buyerWallet}</span>
          <span className="node-address">8xK2...4mNp</span>
        </div>

        {/* Token flow line - Left */}
        <div className={`token-flow flow-left ${animationPhase >= 1 ? "active" : ""} ${activeFlow}`}>
          <div className="flow-line" />
          <div className={`flow-particle ${animationPhase === 1 ? "moving" : ""}`}>
            <span className="usdc-token">$</span>
          </div>
        </div>

        {/* Central Vault - THE HERO */}
        <div className={`escrow-vault ${activeFlow === "safe" ? "secured" : "bypassed"} ${animationPhase >= 2 ? "active" : ""}`}>
          <div className="vault-outer-ring" />
          <div className="vault-mid-ring" />
          <div className="vault-inner-ring" />
          <div className="vault-core">
            <div className="vault-face vault-face-front">
              <div className="vault-lock">
                {activeFlow === "safe" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </svg>
                )}
              </div>
            </div>
            <div className="vault-shimmer" />
          </div>
          <span className="vault-label">{copy.vault.vault}</span>
          <span className="vault-status">
            {activeFlow === "safe" 
              ? animationPhase >= 2 ? copy.vault.hashCommitted : copy.vault.awaitingCommit
              : copy.vault.bypassed}
          </span>
        </div>

        {/* Token flow line - Right */}
        <div className={`token-flow flow-right ${animationPhase >= 3 ? "active" : ""} ${activeFlow}`}>
          <div className="flow-line" />
          <div className={`flow-particle ${animationPhase === 3 ? "moving" : ""}`}>
            <span className="usdc-token">$</span>
          </div>
        </div>

        {/* Seller/Service Node */}
        <div className={`vault-node seller-node ${animationPhase >= 3 ? "active" : ""} ${activeFlow}`}>
          <div className="node-glow" />
          <div className="node-ring" />
          <div className="node-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span className="node-label">{copy.vault.serviceEndpoint}</span>
          <span className={`node-status ${activeFlow === "risk" ? "failed" : ""}`}>
            {activeFlow === "safe" ? copy.vault.verified : copy.vault.stalled}
          </span>
        </div>

        {/* Direct payment failure indicator */}
        {activeFlow === "risk" && animationPhase >= 2 && (
          <div className="failure-indicator">
            <div className="failure-pulse" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{copy.vault.fundsLost}</span>
          </div>
        )}

        {/* Success indicator */}
        {activeFlow === "safe" && animationPhase >= 3 && (
          <div className="success-indicator">
            <div className="success-pulse" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9,12 11,14 15,10" />
            </svg>
            <span>{copy.vault.released}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .vault-hero {
          width: 100%;
          margin: 48px 0;
          perspective: 1000px;
        }

        .vault-stage {
          position: relative;
          height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        /* Ambient lighting */
        .vault-ambient {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
          pointer-events: none;
          transition: opacity 0.8s ease;
        }

        .vault-ambient-left {
          left: 5%;
          background: rgba(59, 130, 246, 0.4);
        }

        .vault-ambient-right {
          right: 5%;
          background: rgba(52, 211, 153, 0.4);
        }

        /* Flow indicator */
        .flow-indicator {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 20px;
          border-radius: 100px;
          font-family: var(--font-mono), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: all 0.5s ease;
        }

        .flow-indicator.safe {
          background: rgba(52, 211, 153, 0.15);
          border: 1px solid rgba(52, 211, 153, 0.3);
          color: #34d399;
        }

        .flow-indicator.risk {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        /* Nodes */
        .vault-node {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 2;
          transition: transform 0.5s ease, opacity 0.5s ease;
          opacity: 0.5;
        }

        .vault-node.active {
          opacity: 1;
          transform: scale(1.05);
        }

        .node-glow {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%);
          filter: blur(20px);
          transition: opacity 0.5s ease;
          opacity: 0;
        }

        .vault-node.active .node-glow {
          opacity: 1;
        }

        .node-ring {
          position: absolute;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: border-color 0.5s ease;
        }

        .vault-node.active .node-ring {
          border-color: rgba(59, 130, 246, 0.3);
        }

        .node-core {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(26, 29, 36, 0.95), rgba(15, 17, 20, 0.95));
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.5s ease;
        }

        .vault-node.active .node-core {
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .node-core svg {
          width: 28px;
          height: 28px;
          color: var(--ink-secondary);
          transition: color 0.5s ease;
        }

        .vault-node.active .node-core svg {
          color: #3b82f6;
        }

        .node-label {
          font-family: var(--font-mono), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-secondary);
        }

        .node-address,
        .node-status {
          font-family: var(--font-mono), monospace;
          font-size: 0.65rem;
          color: var(--ink-muted);
        }

        .node-status.failed {
          color: #ef4444;
        }

        .seller-node.risk.active .node-core {
          border-color: rgba(239, 68, 68, 0.4);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(239, 68, 68, 0.2);
        }

        .seller-node.risk.active .node-core svg {
          color: #ef4444;
        }

        .seller-node.risk.active .node-glow {
          background: radial-gradient(circle, rgba(239, 68, 68, 0.2), transparent 70%);
        }

        /* Token Flow Lines */
        .token-flow {
          position: relative;
          width: 100px;
          height: 4px;
          z-index: 1;
        }

        .flow-line {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0.05),
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.05)
          );
          border-radius: 2px;
          transition: background 0.5s ease;
        }

        .token-flow.active .flow-line {
          background: linear-gradient(90deg, 
            rgba(52, 211, 153, 0.2),
            rgba(52, 211, 153, 0.4),
            rgba(52, 211, 153, 0.2)
          );
        }

        .token-flow.risk.active .flow-line {
          background: linear-gradient(90deg, 
            rgba(239, 68, 68, 0.2),
            rgba(239, 68, 68, 0.4),
            rgba(239, 68, 68, 0.2)
          );
        }

        .flow-particle {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%) translateX(-50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .flow-particle.moving {
          opacity: 1;
          animation: flowMove 1.5s ease-in-out forwards;
        }

        @keyframes flowMove {
          0% { left: 0; }
          100% { left: 100%; }
        }

        .usdc-token {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #34d399, #10b981);
          color: #0a0b0d;
          font-weight: 700;
          font-size: 0.75rem;
          box-shadow: 0 0 20px rgba(52, 211, 153, 0.5);
        }

        .token-flow.risk .usdc-token {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        }

        /* THE ESCROW VAULT - HERO ELEMENT */
        .escrow-vault {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          z-index: 3;
          margin: 0 20px;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .escrow-vault.active {
          transform: scale(1.1);
        }

        .vault-outer-ring,
        .vault-mid-ring,
        .vault-inner-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid;
          transition: all 0.6s ease;
        }

        .vault-outer-ring {
          width: 160px;
          height: 160px;
          border-color: rgba(255, 255, 255, 0.05);
          animation: vaultRotate 20s linear infinite;
        }

        .vault-mid-ring {
          width: 140px;
          height: 140px;
          border-color: rgba(255, 255, 255, 0.08);
          animation: vaultRotate 15s linear infinite reverse;
        }

        .vault-inner-ring {
          width: 120px;
          height: 120px;
          border-color: rgba(255, 255, 255, 0.1);
          animation: vaultRotate 10s linear infinite;
        }

        .escrow-vault.secured .vault-outer-ring {
          border-color: rgba(52, 211, 153, 0.2);
          box-shadow: 0 0 40px rgba(52, 211, 153, 0.1);
        }

        .escrow-vault.secured .vault-mid-ring {
          border-color: rgba(52, 211, 153, 0.3);
        }

        .escrow-vault.secured .vault-inner-ring {
          border-color: rgba(52, 211, 153, 0.4);
        }

        .escrow-vault.bypassed .vault-outer-ring,
        .escrow-vault.bypassed .vault-mid-ring,
        .escrow-vault.bypassed .vault-inner-ring {
          opacity: 0.3;
          border-style: dashed;
        }

        @keyframes vaultRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .vault-core {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 24px;
          background: linear-gradient(135deg, 
            rgba(30, 34, 43, 0.98),
            rgba(21, 23, 28, 0.98)
          );
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2);
          transition: all 0.6s ease;
          transform-style: preserve-3d;
          transform: rotateX(10deg) rotateY(-5deg);
        }

        .escrow-vault.secured .vault-core {
          border-color: rgba(52, 211, 153, 0.4);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 60px rgba(52, 211, 153, 0.2),
            0 0 0 1px rgba(52, 211, 153, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .escrow-vault.bypassed .vault-core {
          opacity: 0.4;
          border-style: dashed;
          transform: rotateX(10deg) rotateY(-5deg) scale(0.95);
        }

        .vault-face-front {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vault-lock {
          width: 40px;
          height: 40px;
          transition: all 0.5s ease;
        }

        .vault-lock svg {
          width: 100%;
          height: 100%;
          color: var(--ink-secondary);
          transition: color 0.5s ease;
        }

        .escrow-vault.secured .vault-lock svg {
          color: #34d399;
        }

        .escrow-vault.bypassed .vault-lock svg {
          color: var(--ink-muted);
        }

        .vault-shimmer {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background: linear-gradient(
            135deg,
            transparent 40%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 60%
          );
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        .vault-label {
          font-family: var(--font-mono), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-secondary);
          margin-top: 16px;
        }

        .vault-status {
          font-family: var(--font-mono), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 100px;
          transition: all 0.5s ease;
        }

        .escrow-vault.secured .vault-status {
          background: rgba(52, 211, 153, 0.15);
          color: #34d399;
        }

        .escrow-vault.bypassed .vault-status {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        /* Failure/Success indicators */
        .failure-indicator,
        .success-indicator {
          position: absolute;
          right: 15%;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          animation: fadeIn 0.5s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-50%) scale(0.8); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }

        .failure-indicator svg,
        .success-indicator svg {
          width: 48px;
          height: 48px;
        }

        .failure-indicator svg {
          color: #ef4444;
        }

        .success-indicator svg {
          color: #34d399;
        }

        .failure-pulse,
        .success-pulse {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
        }

        .failure-pulse {
          background: rgba(239, 68, 68, 0.2);
        }

        .success-pulse {
          background: rgba(52, 211, 153, 0.2);
        }

        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .failure-indicator span,
        .success-indicator span {
          font-family: var(--font-mono), monospace;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .failure-indicator span {
          color: #ef4444;
        }

        .success-indicator span {
          color: #34d399;
        }

        @media (max-width: 768px) {
          .vault-stage {
            height: 280px;
            flex-wrap: wrap;
            gap: 20px;
          }

          .token-flow {
            width: 60px;
          }

          .vault-node,
          .escrow-vault {
            margin: 0;
          }

          .failure-indicator,
          .success-indicator {
            right: 5%;
          }
        }
      `}</style>
    </div>
  );
}
