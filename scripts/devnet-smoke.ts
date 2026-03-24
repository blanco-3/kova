import "dotenv/config";

const baseUrl = process.env.NEXT_PUBLIC_DEMO_API_BASE ?? "http://127.0.0.1:8787";

async function main() {
  const health = await fetch(`${baseUrl}/health`);
  if (!health.ok) {
    throw new Error(`Middleware health check failed with ${health.status}`);
  }

  const escrows = await fetch(`${baseUrl}/api/escrows`);
  if (!escrows.ok) {
    throw new Error(`Escrow list check failed with ${escrows.status}`);
  }

  const payload = {
    scenario: "success",
    prompt: "Translate 'trustless payments' into Korean.",
  };

  const run = await fetch(`${baseUrl}/api/demo/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!run.ok) {
    throw new Error(`Demo run failed with ${run.status}`);
  }

  const data = await run.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
