import { createMiddlewareApp } from "./index";

const port = Number(process.env.MIDDLEWARE_PORT ?? process.env.PORT ?? 8787);

createMiddlewareApp().listen(port, () => {
  console.log(`x402 escrow middleware listening on http://localhost:${port}`);
});
