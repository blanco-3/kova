import "dotenv/config";

import express from "express";
import fs from "node:fs";
import { paymentMiddleware } from "@x402/express";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { SOLANA_DEVNET_CAIP2 } from "@x402/svm";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { Keypair } from "@solana/web3.js";

export function loadSellerKeypair() {
  const keypairPath =
    process.env.SELLER_KEYPAIR_PATH ?? process.env.ANCHOR_WALLET ?? "";

  if (!keypairPath) {
    throw new Error("Set SELLER_KEYPAIR_PATH before starting the demo server");
  }

  const raw = fs.readFileSync(keypairPath, "utf8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
}

export function createDemoApp(description: string) {
  const app = express();
  app.use(express.json());

  const seller = loadSellerKeypair();
  const facilitator = new HTTPFacilitatorClient({
    url: process.env.FACILITATOR_URL ?? "https://facilitator.x402.org",
  });
  const resourceServer = new x402ResourceServer(facilitator).register(
    SOLANA_DEVNET_CAIP2,
    new ExactSvmScheme()
  );

  app.use(
    paymentMiddleware(
      {
        "POST /direct": {
          accepts: {
            scheme: "exact",
            price: `$${Number(process.env.DIRECT_X402_PRICE_USD ?? "0.05").toFixed(2)}`,
            network: SOLANA_DEVNET_CAIP2,
            payTo: seller.publicKey.toBase58(),
            maxTimeoutSeconds: 60,
          },
          description,
        },
      },
      resourceServer,
      {
        appName: "x402 Escrow Protocol Demo",
        testnet: true,
      }
    )
  );

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      payTo: seller.publicKey.toBase58(),
      description,
    });
  });

  return app;
}
