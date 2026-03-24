"use client";

export function EscrowVault() {
  return (
    <div className="vault-stage">
      {/* Soft ambient glow on backdrop */}
      <div className="vault-ambient" />
      
      {/* Ground plane reflection */}
      <div className="vault-reflection" />
      
      {/* Main chrome vault body */}
      <div className="vault-body">
        {/* Top surface - catches key light */}
        <div className="vault-top">
          <div className="vault-top-highlight" />
          <div className="vault-top-gradient" />
        </div>
        
        {/* Chrome front face */}
        <div className="vault-front">
          {/* Primary chrome gradient */}
          <div className="vault-chrome" />
          
          {/* Horizontal reflection band */}
          <div className="vault-band" />
          
          {/* Central dial mechanism */}
          <div className="vault-dial-assembly">
            {/* Outer chrome ring */}
            <div className="vault-ring-outer">
              <div className="vault-ring-shine" />
            </div>
            
            {/* Inner brushed ring */}
            <div className="vault-ring-inner" />
            
            {/* Dark glass center */}
            <div className="vault-core">
              <div className="vault-core-depth" />
              
              {/* Precision indicator marks */}
              <div className="vault-marks">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="vault-mark" style={{ transform: `rotate(${i * 30}deg)` }} />
                ))}
              </div>
              
              {/* Central status light */}
              <div className="vault-status">
                <div className="vault-status-glow" />
                <div className="vault-status-core" />
              </div>
            </div>
          </div>
          
          {/* Vertical seam lines */}
          <div className="vault-seam vault-seam-left" />
          <div className="vault-seam vault-seam-right" />
          
          {/* Bottom edge shadow */}
          <div className="vault-edge-shadow" />
        </div>
        
        {/* Right side panel - dark chrome */}
        <div className="vault-side">
          <div className="vault-side-gradient" />
          <div className="vault-side-line" />
        </div>
        
        {/* Cast shadow underneath */}
        <div className="vault-shadow" />
      </div>
      
      {/* Floating label */}
      <div className="vault-caption">
        <span className="vault-caption-label">Status</span>
        <span className="vault-caption-value">Secured</span>
      </div>
    </div>
  );
}
