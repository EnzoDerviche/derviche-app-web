import { describe, it, expect } from "vitest";
import {
  calculateItemSubtotal,
  calculateBudgetTotals,
  computePaymentStatus,
  calculateBalance,
  round2,
} from "./calculations";

describe("round2", () => {
  it("avoids float drift", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe("calculateItemSubtotal", () => {
  it("qty * price - discount", () => {
    expect(calculateItemSubtotal({ quantity: 3, unit_price: 100, discount: 50 })).toBe(250);
  });
  it("never negative", () => {
    expect(calculateItemSubtotal({ quantity: 1, unit_price: 10, discount: 999 })).toBe(0);
  });
});

describe("calculateBudgetTotals", () => {
  it("subtotal - discount + tax", () => {
    const t = calculateBudgetTotals({
      items: [
        { quantity: 2, unit_price: 100 },
        { quantity: 1, unit_price: 50, discount: 10 },
      ],
      discount: 40,
      taxRate: 21,
    });
    // subtotal = 200 + 40 = 240; taxable = 200; tax = 42; total = 242
    expect(t.subtotal).toBe(240);
    expect(t.discount).toBe(40);
    expect(t.tax).toBe(42);
    expect(t.total).toBe(242);
  });
  it("clamps discount to subtotal", () => {
    const t = calculateBudgetTotals({ items: [{ quantity: 1, unit_price: 100 }], discount: 999 });
    expect(t.discount).toBe(100);
    expect(t.total).toBe(0);
  });
});

describe("computePaymentStatus", () => {
  it("unpaid at zero", () => {
    expect(computePaymentStatus(100, 0, 0)).toBe("unpaid");
  });
  it("first partial payment is an advance", () => {
    expect(computePaymentStatus(100, 30, 1)).toBe("advance_received");
  });
  it("second partial payment is partially_paid", () => {
    expect(computePaymentStatus(100, 60, 2)).toBe("partially_paid");
  });
  it("fully paid when covered", () => {
    expect(computePaymentStatus(100, 100, 3)).toBe("fully_paid");
    expect(computePaymentStatus(100, 120, 2)).toBe("fully_paid");
  });
});

describe("calculateBalance", () => {
  it("total - paid, never below zero", () => {
    expect(calculateBalance(100, 30)).toBe(70);
    expect(calculateBalance(100, 150)).toBe(0);
  });
});
