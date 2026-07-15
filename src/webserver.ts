import express, { Express, Request, Response } from "express";
import { getConfig } from "./config";
import { handlePaymentWebhook } from "./webhooks/paymentWebhook";
import logger from "./logger";

const config = getConfig();

export function setupWebServer(): Express {
  const app = express();

  app.use(express.json());
  app.use((req, res, next) => {
    logger.http(`${req.method} ${req.path}`);
    next();
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/webhooks/payment", handlePaymentWebhook);

  app.use((err: Error, req: Request, res: Response) => {
    logger.error("Express error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

export function startWebServer(): void {
  const app = setupWebServer();
  const port = config.PORT;

  app.listen(port, () => {
    logger.info(`Web server started on port ${port}`);
  });
}
