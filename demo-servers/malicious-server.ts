import { createDemoApp } from "./common";

const app = createDemoApp("Direct x402 access to the malicious upstream");

async function stall() {
  await new Promise((resolve) => setTimeout(resolve, 60_000));
}

app.post("/direct", async (_req, res) => {
  await stall();
  res.send("too late");
});

app.post("/escrow/fulfill", async (_req, res) => {
  await stall();
  res.send("too late");
});

const port = Number(process.env.PORT ?? 8789);
app.listen(port, () => {
  console.log(`malicious demo server listening on http://localhost:${port}`);
});
