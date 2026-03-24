import type { Request, Response } from "express";
import serverless from "serverless-http";
import { createDemoApp } from "../../../src/common";

const app = createDemoApp("Direct x402 access to the malicious upstream", "/");

async function stall() {
  await new Promise((resolve) => setTimeout(resolve, 60_000));
}

app.post("/", async (_req: Request, res: Response) => {
  await stall();
  res.send("too late");
});

export default serverless(app);
