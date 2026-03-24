import crypto from "node:crypto";

export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function sha256Bytes(input: string | Buffer): number[] {
  return Array.from(crypto.createHash("sha256").update(input).digest());
}

export function shortHash(hash: string | undefined): string {
  if (!hash) {
    return "none";
  }

  return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
}

