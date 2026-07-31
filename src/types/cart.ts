export interface AddToCartPayload {
  bookId: string;
  quantity: number;
  pricingMode: "rent";
  rentalPeriod: "day" | "week" | "month";
}