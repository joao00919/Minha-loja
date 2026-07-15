import { prisma } from "../database";
import logger from "../logger";

export class JobService {
  static async runExpirationJob(): Promise<void> {
    try {
      const now = new Date();

      const expiredLicenses = await prisma.license.findMany({
        where: {
          expirationDate: { lte: now },
          status: "ACTIVE",
        },
      });

      for (const license of expiredLicenses) {
        await prisma.license.update({
          where: { id: license.id },
          data: { status: "EXPIRED" },
        });
      }

      logger.info(`Marked ${expiredLicenses.length} licenses as expired`);

      const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
          expirationDate: { lte: now },
          status: "ACTIVE",
        },
      });

      for (const sub of expiredSubscriptions) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        });
      }

      logger.info(`Marked ${expiredSubscriptions.length} subscriptions as expired`);
    } catch (error) {
      logger.error("Error running expiration job:", error);
    }
  }

  static async runPendingPaymentsJob(): Promise<void> {
    try {
      const now = new Date();

      const expiredPayments = await prisma.payment.findMany({
        where: {
          status: "PENDING",
          expiresAt: { lte: now },
        },
      });

      for (const payment of expiredPayments) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "EXPIRED",
            expiredAt: now,
          },
        });
      }

      logger.info(`Marked ${expiredPayments.length} payments as expired`);
    } catch (error) {
      logger.error("Error running pending payments job:", error);
    }
  }

  static async runRenewalJob(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueRenewals = await prisma.renewal.findMany({
        where: {
          renewalDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
          status: "PENDING",
        },
        include: { subscription: true },
      });

      logger.info(`Found ${dueRenewals.length} renewals due today`);

      for (const renewal of dueRenewals) {
        logger.debug(`Processing renewal for subscription ${renewal.subscriptionId}`);
      }
    } catch (error) {
      logger.error("Error running renewal job:", error);
    }
  }

  static async setupJobs(): Promise<void> {
    setInterval(() => this.runExpirationJob(), 60 * 60 * 1000);
    logger.info("Expiration job scheduled (hourly)");

    setInterval(() => this.runPendingPaymentsJob(), 60 * 60 * 1000);
    logger.info("Pending payments job scheduled (hourly)");

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeToMidnight = tomorrow.getTime() - now.getTime();
    setTimeout(() => {
      this.runRenewalJob();
      setInterval(() => this.runRenewalJob(), 24 * 60 * 60 * 1000);
    }, timeToMidnight);

    logger.info("Renewal job scheduled (daily at midnight)");
  }
}
