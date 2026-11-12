"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * המידות שהלקוח/ה הזין/ה לחפצים שלו/ה (למשל: הבקבוק שלי בקוטר 9 ס"מ).
 * נשמר בדפדפן ומשותף לעמוד המוצר ולסטודיו.
 */
const KEY = "stick:object-sizes:v1";
const EVENT = "stick:object-sizes";

function read(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function useObjectSizes() {
  const [sizes, setSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    setSizes(read());
    const on = () => setSizes(read());
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const setSize = useCallback((mockupId: string, cm: number | null) => {
    const next = { ...read() };
    if (cm && cm > 0) next[mockupId] = cm;
    else delete next[mockupId];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setSizes(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { sizes, setSize };
}
