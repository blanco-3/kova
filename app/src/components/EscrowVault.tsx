"use client";

export function EscrowVault() {
  return (
    <div className="vault-container">
      <div className="vault-object">
        {/* Shadow beneath */}
        <div className="vault-shadow" />
        
        {/* Main body - matte black box */}
        <div className="vault-body" />
        
        {/* Edge highlights */}
        <div className="vault-edge-top" />
        <div className="vault-edge-left" />
        
        {/* Brushed metal faceplate */}
        <div className="vault-faceplate" />
        
        {/* Lock mechanism */}
        <div className="vault-lock" />
        
        {/* Status indicator */}
        <div className="vault-status">Secured</div>
      </div>
    </div>
  );
}
