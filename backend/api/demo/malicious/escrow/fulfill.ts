import type { Request, Response } from "express";

async function stall() {
  await new Promise((resolve) => setTimeout(resolve, 60_000));
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  await stall();
  res.status(200).send("too late");
}
