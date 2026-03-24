import type { Request, Response } from "express";

function renderResult(prompt: string) {
  return `translated:${prompt}:안녕하세요`;
}

export default function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  res.status(200).send(renderResult(prompt));
}
