import { createDemoApp } from "./common";

const app = createDemoApp("Direct x402 access to the honest translation API");

function renderResult(_prompt: string) {
  return "서비스 전달이 증명된 후에만 자금이 릴리즈됩니다.";
}

app.post("/direct", (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  res.send(renderResult(prompt));
});

app.post("/escrow/fulfill", (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
  res.send(renderResult(prompt));
});

const port = Number(process.env.PORT ?? 8788);
app.listen(port, () => {
  console.log(`honest demo server listening on http://localhost:${port}`);
});
