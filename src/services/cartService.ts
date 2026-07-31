import { AddToCartPayload } from "../types/cart";

const API_URL = import.meta.env.VITE_API_URL;

export const addToCart = async (
  payload: AddToCartPayload
) => {
  const response = await fetch(
    `${API_URL}/api/cart/items`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
};