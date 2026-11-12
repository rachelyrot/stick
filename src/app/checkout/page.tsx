import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";
import { CheckoutView } from "@/features/cart/CheckoutView";

export const metadata: Metadata = { title: "השלמת הזמנה" };

export default function CheckoutPage() {
  return (
    <Container className="pb-10 pt-12 lg:pt-16">
      <h1 className="mb-10 font-display text-5xl font-light text-choco md:text-6xl">השלמת הזמנה</h1>
      <CheckoutView />
    </Container>
  );
}
