import type { Request, Response } from "express";
import serverless from "serverless-http";
import { createDemoApp } from "../../../src/common";

const app = createDemoApp("Direct x402 access to the honest translation API", "/");

function renderResult(prompt: string) {
  return `translated:${prompt}:안녕하세요`;
}

app.post("/", (req: Request, res: Response) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  res.send(renderResult(prompt));
});

export default serverless(app);
