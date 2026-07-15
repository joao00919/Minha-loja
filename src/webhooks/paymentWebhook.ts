import { Request, Response } from "express";
import { prisma } from "../database";
import logger from "../logger";
import { SecurityService } from "../services/SecurityService";
import { getConfig } from "../config";

const config = getConfig();

export async function handlePaymentWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers["x-signature"] as string;
    const payload = JSON.stringify(req.body);

    if (!SecurityService.validateWebhookSignature(payload, signature, config.PIX_WEBHOOK_SECRET)) {
      logger.warn("Invalid webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const { eventId, externalPaymentId, status, amount, approvedAt } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { externalPaymentId },
    });

    if (!payment) {
      logger.warn(`Payment not found: ${externalPaymentId}`);
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { externalEventId: eventId },
    });

    if (existingEvent) {
      logger.info(`Webhook already processed: ${eventId}`);
      res.status(200).json({ success: true });
      return;
    }

    if (amount && BigInt(amount * 100) !== payment.amountInCents) {
      logger.error(`Amount mismatch for payment ${payment.id}`);
      res.status(400).json({ error: "Amount mismatch" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (status === "APPROVED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(approvedAt || Date.now()),
          },
        });
      } else if (status === "CANCELLED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });
      }

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: "WEBHOOK_RECEIVED",
          externalEventId: eventId,
          metadata: req.body,
        },
      });
    });

    logger.info(`Webhook processed: ${eventId}`);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
