import { describe, it, expect } from "@jest/globals";
import { formatCurrency, getDaysUntilExpiration } from "../utils/helpers";

describe("License Calculation Tests", () => {
  it("should calculate renewal date for active license", () => {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(expirationDate.getDate() + 30);

    const newExpiration = new Date(expirationDate);
    newExpiration.setDate(newExpiration.getDate() + 30);

    const daysFromNow = getDaysUntilExpiration(newExpiration);
    expect(daysFromNow).toBeGreaterThan(50);
    expect(daysFromNow).toBeLessThanOrEqual(60);
  });

  it("should calculate renewal date for expired license", () => {
    const today = new Date();
    const expiredDate = new Date(today);
    expiredDate.setDate(expiredDate.getDate() - 10);

    const newExpiration = new Date(today);
    newExpiration.setDate(newExpiration.getDate() + 30);

    const daysFromNow = getDaysUntilExpiration(newExpiration);
    expect(daysFromNow).toBeGreaterThan(25);
    expect(daysFromNow).toBeLessThanOrEqual(30);
  });
});
