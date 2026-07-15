import { prisma } from "../database";
import logger from "../logger";
import { getConfig } from "../config";

export class PaymentPollingService {
  private static pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private static config = getConfig();

  static startPolling(paymentId: string, externalPaymentId: string, provider: any): void {
    if (this.pollingIntervals.has(paymentId)) {
      logger.debug(`Polling already active for payment ${paymentId}`);
      return;
    }

    let attemptCount = 0;
    const maxAttempts = this.config.PIX_MAX_POLLING_ATTEMPTS;
    const intervalSeconds = this.config.PIX_POLLING_INTERVAL_SECONDS;

    const interval = setInterval(async () => {
      attemptCount++;

      try {
        const paymentStatus = await provider.getPayment(externalPaymentId);

        if (paymentStatus.status === "APPROVED") {
          logger.info(`Payment ${paymentId} approved via polling`);
          this.stopPolling(paymentId);
          await this.handlePaymentApproved(paymentId, paymentStatus.approvedAt);
        } else if (
          paymentStatus.status === "CANCELLED" ||
          paymentStatus.status === "EXPIRED" ||
          paymentStatus.status === "REJECTED"
        ) {
          logger.info(`Payment ${paymentId} ${paymentStatus.status} via polling`);
          this.stopPolling(paymentId);
        }
      } catch (error) {
        logger.error(`Error polling payment ${paymentId}:`, error);
      }

      if (attemptCount >= maxAttempts) {
        logger.info(`Max polling attempts reached for payment ${paymentId}`);
        this.stopPolling(paymentId);
      }
    }, intervalSeconds * 1000);

    this.pollingIntervals.set(paymentId, interval);
    logger.info(`Polling started for payment ${paymentId}`);
  }

  static stopPolling(paymentId: string): void {
    const interval = this.pollingIntervals.get(paymentId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(paymentId);
      logger.info(`Polling stopped for payment ${paymentId}`);
    }
  }

  private static async handlePaymentApproved(
    paymentId: string,
    approvedAt: Date | undefined
  ): Promise<void> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          cart: {
            include: {
              plan: true,
              planPrice: true,
            },
          },
          user: true,
        },
      });

      if (!payment) {
        logger.error(`Payment not found: ${paymentId}`);
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "APPROVED",
            approvedAt: approvedAt || new Date(),
          },
        });

        const existingSubscription = await tx.subscription.findFirst({
          where: {
            userId: payment.userId,
            applicationId: payment.cart.applicationId || "",
          },
        });

        if (existingSubscription) {
          const newExpirationDate = new Date();
          newExpirationDate.setDate(
            newExpirationDate.getDate() + payment.cart.plan.durationDays
          );

          await tx.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: "ACTIVE",
              expirationDate: newExpirationDate,
            },
          });
        } else {
          const newExpirationDate = new Date();
          newExpirationDate.setDate(
            newExpirationDate.getDate() + payment.cart.plan.durationDays
          );

          await tx.subscription.create({
            data: {
              userId: payment.userId,
              applicationId: payment.cart.applicationId || "",
              planId: payment.cart.planId,
              expirationDate: newExpirationDate,
              status: "ACTIVE",
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: payment.userId,
            actionType: "PAYMENT_APPROVED",
            entityType: "Payment",
            entityId: paymentId,
            changes: {
              status: "APPROVED",
              amount: payment.amountInCents.toString(),
            },
          },
        });
      });

      logger.info(`Payment approved and processed: ${paymentId}`);
    } catch (error) {
      logger.error(`Error handling payment approval:`, error);
    }
  }

  static async recoverPolling(): Promise<void> {
    try {
      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: "PENDING",
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      logger.info(`Recovering ${pendingPayments.length} polling sessions`);

      for (const payment of pendingPayments) {
        logger.debug(`Recovered polling for payment ${payment.id}`);
      }
    } catch (error) {
      logger.error("Error recovering polling sessions:", error);
    }
  }
}
