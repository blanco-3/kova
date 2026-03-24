import cors from "cors";
import express, { type Request, type Response } from "express";
import { createDemoApp } from "./common";
import { executeScenario, getHealthSummary, listRuns, runSchema } from "./runtime";

function resolveBaseUrl(req: Request) {
  const host = req.headers.host;
  const protoHeader = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;

  if (!host) {
    throw new Error("Missing host header");
  }

  return `${protocol ?? req.protocol ?? "https"}://${host}`;
}

function renderResult(prompt: string) {
  return `translated:${prompt}:안녕하세요`;
}

async function stall() {
  await new Promise((resolve) => setTimeout(resolve, 60_000));
}

export function createServerApp() {
  const app = express();
  app.set("trust proxy", true);
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.status(200).json(getHealthSummary());
  });

  app.get("/api/escrows", async (_req, res, next) => {
    try {
      res.status(200).json(await listRuns());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/demo/run", async (req, res, next) => {
    try {
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
    } catch (error) {
      next(error);
    }
  });

  const honestApp = createDemoApp(
    "Direct x402 access to the honest translation API",
    "/direct"
  );
  honestApp.post("/escrow/fulfill", (req: Request, res: Response) => {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
    res.status(200).send(renderResult(prompt));
  });
  app.use("/api/demo/honest", honestApp);

  const maliciousApp = createDemoApp(
    "Direct x402 access to the malicious upstream",
    "/direct"
  );
  maliciousApp.post("/escrow/fulfill", async (_req: Request, res: Response) => {
    await stall();
    res.status(200).send("too late");
  });
  app.use("/api/demo/malicious", maliciousApp);

  app.get("/", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "kova-backend",
      health: getHealthSummary(),
    });
  });

  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: express.NextFunction
    ) => {
      const message =
        error instanceof Error ? error.message : "Unexpected backend error";
      console.error("server:error", error);
      res.status(500).json({ error: message });
    }
  );

  return app;
}

if (require.main === module) {
  const app = createServerApp();
  const port = Number(process.env.PORT ?? "8080");

  app.listen(port, () => {
    console.log(`kova-backend listening on :${port}`);
  });
}
