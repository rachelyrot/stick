"use client";

import { createContext, useContext } from "react";
import { DEFAULT_PRICING, type PricingConfig } from "./engine";

/** המחירון הפעיל מגיע מהשרת בכל טעינת עמוד, כך שכל שינוי בממשק הניהול חל מיד בכל האתר */
const PricingContext = createContext<PricingConfig>(DEFAULT_PRICING);

export function PricingProvider({ value, children }: { value: PricingConfig; children: React.ReactNode }) {
  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export const usePricing = () => useContext(PricingContext);
