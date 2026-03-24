import type { Request, Response } from "express";
import { listRuns } from "../src/runtime";

export default async function handler(req: Request, res: Response) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  res.status(200).json(await listRuns());
}
