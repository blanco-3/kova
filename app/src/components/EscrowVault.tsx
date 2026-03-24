"use client";

export function EscrowVault() {
  return (
    <div className="vault">
      {/* Ambient shadow on ground plane */}
      <div className="vault-ground" />
      
      {/* Main housing - precision machined block */}
      <div className="vault-housing">
        {/* Top chamfer highlight */}
        <div className="vault-chamfer-top" />
        
        {/* Left edge catch light */}
        <div className="vault-edge-light" />
        
        {/* Recessed face panel */}
        <div className="vault-face">
          {/* Concentric dial rings */}
          <div className="vault-dial">
            <div className="vault-dial-outer" />
            <div className="vault-dial-inner" />
            <div className="vault-dial-core" />
            
            {/* Status LED */}
            <div className="vault-led" />
          </div>
          
          {/* Machined grooves */}
          <div className="vault-groove vault-groove-1" />
          <div className="vault-groove vault-groove-2" />
        </div>
        
        {/* Bottom shadow line */}
        <div className="vault-undercut" />
      </div>
      
      {/* Product label */}
      <div className="vault-label">Secured</div>
    </div>
  );
}
