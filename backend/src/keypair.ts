import fs from "node:fs";
import { Keypair } from "@solana/web3.js";

export interface KeypairSource {
  path?: string;
  json?: string;
}

function parseSecretKey(raw: string, label: string): Uint8Array {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `${label} keypair is not valid JSON: ${error instanceof Error ? error.message : "unknown error"}`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${label} keypair must be a JSON array of numbers`);
  }

  return Uint8Array.from(parsed as number[]);
}

export function readSecretKeyBytes(source: KeypairSource, label: string): Uint8Array {
  if (source.json?.trim()) {
    return parseSecretKey(source.json, label);
  }

  if (source.path?.trim()) {
    return parseSecretKey(fs.readFileSync(source.path, "utf8"), label);
  }

  throw new Error(`Set ${label} keypair path or JSON before starting the service`);
}

export function loadSolanaKeypair(source: KeypairSource, label: string): Keypair {
  return Keypair.fromSecretKey(readSecretKeyBytes(source, label));
}
