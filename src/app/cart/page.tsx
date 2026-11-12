import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";
import { CartView } from "@/features/cart/CartView";

export const metadata: Metadata = { title: "סל הקניות" };

export default function CartPage() {
  return (
    <Container className="pb-10 pt-12 lg:pt-16">
      <h1 className="mb-10 font-display text-5xl font-light text-choco md:text-6xl">סל הקניות</h1>
      <CartView />
    </Container>
  );
}
