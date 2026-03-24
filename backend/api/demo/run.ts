import type { Request, Response } from "express";
import { executeScenario, runSchema } from "../../src/runtime";

function resolveBaseUrl(req: Request) {
  const host = req.headers.host;
  const protoHeader = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;

  if (!host) {
    throw new Error("Missing host header");
  }

  return `${protocol ?? "https"}://${host}`;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const parsed = runSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "invalid_request",
      details: parsed.error.flatten(),
    });
    return;
  }

  const run = await executeScenario(
    parsed.data.scenario,
    parsed.data.prompt,
    resolveBaseUrl(req)
  );

  res.status(200).json(run);
}
