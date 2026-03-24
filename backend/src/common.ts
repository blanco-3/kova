import express from "express";
import fs from "node:fs";
import path from "node:path";
import { paymentMiddleware } from "@x402/express";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { SOLANA_DEVNET_CAIP2 } from "@x402/svm";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { config as loadEnv } from "dotenv";
import { loadSolanaKeypair } from "./keypair";

function envValue(name: string) {
  const value = process.env[name];
  return value?.trim() ? value.trim() : undefined;
}

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
]) {
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

export function loadSellerKeypair() {
  return loadSolanaKeypair(
    {
      path: process.env.SELLER_KEYPAIR_PATH ?? process.env.ANCHOR_WALLET,
      json: envValue("SELLER_KEYPAIR_JSON"),
    },
    "seller"
  );
}

export function createDemoApp(description: string, directPath = "/direct") {
  const app = express();
  app.use(express.json());

  const seller = loadSellerKeypair();
  const facilitator = new HTTPFacilitatorClient({
    url: envValue("FACILITATOR_URL") ?? "https://www.x402.org/facilitator",
  });
  const resourceServer = new x402ResourceServer(facilitator).register(
    SOLANA_DEVNET_CAIP2,
    new ExactSvmScheme()
  );

  app.use(
    paymentMiddleware(
      {
        [`POST ${directPath}`]: {
          accepts: {
            scheme: "exact",
            price: `$${Number(envValue("DIRECT_X402_PRICE_USD") ?? "0.05").toFixed(2)}`,
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
