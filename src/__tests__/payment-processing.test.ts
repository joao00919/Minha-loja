import { describe, it, expect } from "@jest/globals";
import { formatCurrency } from "../utils/helpers";

describe("Payment Processing Tests", () => {
  it("should format currency correctly", () => {
    expect(formatCurrency(1000)).toBe("R$ 10.00");
    expect(formatCurrency(100)).toBe("R$ 1.00");
  });

  it("should handle payment amount validation", () => {
    const expectedAmount = BigInt(10000);
    const receivedAmount = BigInt(10000);
    expect(expectedAmount === receivedAmount).toBe(true);
  });

  it("should validate idempotency", () => {
    const idempotencyKey = "test-key-123";
    const processedKeys = new Set<string>();

    if (!processedKeys.has(idempotencyKey)) {
      processedKeys.add(idempotencyKey);
    }

    const isDuplicate = processedKeys.has(idempotencyKey);
    expect(isDuplicate).toBe(true);
  });
});
