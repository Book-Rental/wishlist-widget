import { describe, it, expect, vi, beforeEach } from "vitest";
import { addToCart } from "../services/cartService";

describe("cartService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const payload = {
    bookId: "book-1",
    quantity: 1,
    pricingMode: "rent" as const,
    rentalPeriod: "day" as const,
  };

  it("adds book to cart successfully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "Success",
      }),
    } as Response);

    const result = await addToCart(payload);

    expect(fetch).toHaveBeenCalled();

    expect(result).toEqual({
      status: "Success",
    });
  });

  it("sends correct request", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await addToCart(payload);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/cart/items"),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
  });

  it("throws api error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Already exists",
      }),
    } as Response);

    await expect(addToCart(payload)).rejects.toThrow(
      "Already exists"
    );
  });

  it("throws default error when response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        message: "Failed",
      }),
    } as Response);

    await expect(addToCart(payload)).rejects.toThrow("Failed");
  });
});