import type { Request, Response } from "express";
import { loadSellerKeypair } from "../../../src/common";

export default function handler(_req: Request, res: Response) {
  const seller = loadSellerKeypair();
  res.status(200).json({
    ok: true,
    payTo: seller.publicKey.toBase58(),
    description: "Direct x402 access to the malicious upstream",
  });
}
